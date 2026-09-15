import ipaddress
import re
import socket

import httpx


BLOCKED_HOSTNAMES = frozenset({
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
    "metadata",
    "metadata.google.internal",
    "metadata.goog",
    "instance-data",
    "intranet",
})

BLOCKED_SUFFIXES = (
    ".localhost",
    ".local",
    ".localdomain",
    ".internal",
    ".intranet",
    ".corp",
    ".home",
    ".home.arpa",
    ".lan",
    ".svc",
    ".arpa",
    ".onion",
    ".i2p",
)

ALLOWED_SCHEMES = {
    "http": 80,
    "https": 443,
}

BLOCKED_IPV6_NETWORKS = (
    ipaddress.ip_network("64:ff9b::/96"),
    ipaddress.ip_network("64:ff9b:1::/48"),
)

DOMAIN_LABEL_RE = re.compile(r"^[a-z0-9-]{1,63}$")


def _is_safe_public_ip(value: str) -> bool:
    try:
        if "%" in value:
            return False

        ip = ipaddress.ip_address(value)

    except (ValueError, TypeError):
        return False

    if not ip.is_global:
        return False

    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_unspecified
        or ip.is_reserved
    ):
        return False

    if isinstance(ip, ipaddress.IPv6Address):

        if ip.ipv4_mapped is not None:
            return False

        if ip.sixtofour is not None:
            return False

        if ip.teredo is not None:
            return False

        for network in BLOCKED_IPV6_NETWORKS:
            if ip in network:
                return False

    return True


def _valid_public_domain(hostname: str) -> bool:
    try:
        hostname = hostname.encode("idna").decode("ascii").lower()
    except (UnicodeError, UnicodeDecodeError):
        return False

    if len(hostname) > 253:
        return False

    if "." not in hostname:
        return False

    labels = hostname.split(".")

    for label in labels:
        if not label:
            return False

        if not DOMAIN_LABEL_RE.fullmatch(label):
            return False

        if label.startswith("-") or label.endswith("-"):
            return False

    return True


def validate_anti_ssrf_req(url: str) -> bool:
    try:
        if not isinstance(url, str):
            return False

        if not url:
            return False

        if len(url) > 8192:
            return False

        for char in url:
            if char.isspace() or ord(char) < 0x20 or ord(char) == 0x7F:
                return False

        if "\\" in url:
            return False

        parsed = httpx.URL(url)

        if not parsed.is_absolute_url:
            return False

        scheme = parsed.scheme.lower()

        if scheme not in ALLOWED_SCHEMES:
            return False

        if parsed.userinfo:
            return False

        hostname = parsed.host

        if not hostname:
            return False

        hostname = hostname.strip().lower()

        hostname = hostname.rstrip(".")

        if not hostname:
            return False

        if "%" in hostname:
            return False

        if hostname in BLOCKED_HOSTNAMES:
            return False

        for suffix in BLOCKED_SUFFIXES:
            if hostname.endswith(suffix):
                return False

        expected_port = ALLOWED_SCHEMES[scheme]

        port = parsed.port

        if port is None:
            port = expected_port

        if port != expected_port:
            return False

        try:
            direct_ip = ipaddress.ip_address(hostname)
        except ValueError:
            direct_ip = None

        if direct_ip is not None:
            return _is_safe_public_ip(hostname)

        if not _valid_public_domain(hostname):
            return False

        try:
            dns_hostname = hostname.encode("idna").decode("ascii").lower()
        except UnicodeError:
            return False

        addrinfo = socket.getaddrinfo(
            dns_hostname,
            port,
            family=socket.AF_UNSPEC,
            type=socket.SOCK_STREAM,
            proto=socket.IPPROTO_TCP,
        )

        if not addrinfo:
            return False

        resolved_ips = set()

        for family, socktype, proto, canonname, sockaddr in addrinfo:

            if family not in (
                socket.AF_INET,
                socket.AF_INET6,
            ):
                return False

            ip_string = sockaddr[0]

            if not ip_string:
                return False

            resolved_ips.add(ip_string)

        if not resolved_ips:
            return False

        for resolved_ip in resolved_ips:
            if not _is_safe_public_ip(resolved_ip):
                return False

        return True

    except (
        httpx.InvalidURL,
        socket.gaierror,
        socket.timeout,
        UnicodeError,
        ValueError,
        TypeError,
        OSError,
    ):
        return False

    except Exception:
        return False


async def fetch_headers(url: str) -> dict:
    if not validate_anti_ssrf_req(url):
        raise ValueError("URL rejected by SSRF guard")

    async with httpx.AsyncClient(
        timeout=10.0,
        follow_redirects=False,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0"},
    ) as client:
        r = await client.get(url)
        r.raise_for_status()
    return dict(r.headers)
