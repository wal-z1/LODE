
from .models import Finding, Severity, Status


def parse_raw_headers(raw_headers: str) -> dict[str, str | list[str]]:
    if not raw_headers.strip():
        raise ValueError("Raw headers cannot be empty")

    headers: dict[str, str | list[str]] = {}
    lines = raw_headers.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    started = False

    for line in lines:
        if not line.strip():
            if started:
                break
            continue

        if not started and line.upper().startswith("HTTP/"):
            started = True
            continue

        if ":" not in line:
            raise ValueError("Each header must use the 'Name: value' format")

        name, value = line.split(":", 1)
        name = name.strip().lower()
        value = value.strip()

        if not name or not value:
            raise ValueError("Header names and values cannot be empty")

        existing = headers.get(name)
        if existing is None:
            headers[name] = value
        elif isinstance(existing, list):
            existing.append(value)
        else:
            headers[name] = [existing, value]

        started = True

    if not headers:
        raise ValueError("No HTTP headers were found")

    return headers


def finding(id, title, severity, status, detail, remediation, url=None, raw_headers=None):
    return {
        "id": id,
        "title": title,
        "severity": severity,
        "status": status,
        "detail": detail,
        "remediation": remediation,
        "url": url,
        "raw_headers": raw_headers,
    }

# Checks the Strict-Transport-Security (HSTS) header.


def check_hsts(headers: dict) -> Finding | None:
    raw = headers.get("strict-transport-security")

    if not raw:
        return Finding(
            id="hsts_missing",
            control="hsts",
            title="HSTS Header Missing",
            severity=Severity.high,
            status=Status.fail,
            detail=(
                "The Strict-Transport-Security (HSTS) header is missing. "
                "Without HSTS, browsers may initially connect over HTTP before being redirected "
                "to HTTPS, creating an opportunity for downgrade or SSL-stripping attacks."
            ),
            remediation=(
                "Add a Strict-Transport-Security header such as "
                "'max-age=31536000; includeSubDomains'."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=None,
        )

    hsts = raw.lower()

    directives = {
        part.split("=", 1)[0].strip(): (
            part.split("=", 1)[1].strip()
            if "=" in part
            else None
        )
        for part in hsts.split(";")
        if part.strip()
    }

    if "max-age" not in directives:
        return Finding(
            id="hsts_max_age_missing",
            control="hsts",
            title="HSTS max-age Missing",
            severity=Severity.high,
            status=Status.fail,
            detail=(
                "The HSTS header is present but does not define a max-age directive. "
                "The browser therefore does not know how long HTTPS-only enforcement should remain active."
            ),
            remediation="Add a max-age directive such as 'max-age=31536000'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=raw,
        )

    try:
        max_age = int(directives["max-age"] or 0)
    except (TypeError, ValueError):
        return Finding(
            id="hsts_max_age_invalid",
            control="hsts",
            title="HSTS max-age Invalid",
            severity=Severity.high,
            status=Status.fail,
            detail=(
                f"The HSTS max-age value '{directives['max-age']}' is invalid. "
                "The value must be an integer representing the number of seconds "
                "the browser should enforce HTTPS."
            ),
            remediation="Use a valid integer value such as 'max-age=31536000'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=raw,
        )

    if max_age <= 0:
        return Finding(
            id="hsts_disabled",
            control="hsts",
            title="HSTS Disabled",
            severity=Severity.high,
            status=Status.fail,
            detail=(
                "The HSTS policy uses a non-positive max-age value. "
                "A value of 0 removes the browser's stored HSTS policy and disables HTTPS-only enforcement."
            ),
            remediation="Use a positive max-age value such as 'max-age=31536000'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=raw,
        )

    elif max_age < 31536000:
        return Finding(
            id="hsts_max_age_short",
            control="hsts",
            title="HSTS max-age Is Short",
            severity=Severity.low,
            status=Status.fail,
            detail=(
                f"HSTS is enabled with a max-age of {max_age} seconds. "
                "A short duration reduces how long the browser remembers to enforce HTTPS."
            ),
            remediation="Consider using a longer value such as 'max-age=31536000'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=raw,
        )

    elif "includesubdomains" not in directives:
        return Finding(
            id="hsts_subdomains_missing",
            control="hsts",
            title="HSTS Does Not Include Subdomains",
            severity=Severity.low,
            status=Status.fail,
            detail=(
                "HSTS protects the current hostname but does not automatically protect its subdomains. "
                "Subdomains that allow HTTP may remain exposed to downgrade or interception attacks."
            ),
            remediation=(
                "Consider adding 'includeSubDomains' if all subdomains support HTTPS."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=raw,
        )

    return None

# Checks the Content-Security-Policy (CSP) header.

def check_csp(headers: dict) -> Finding | None:
    raw = headers.get("content-security-policy")

    if not raw:
        return Finding(
            id="csp_missing",
            control="csp",
            title="Content Security Policy (CSP) Header Missing",
            severity=Severity.high,
            status=Status.fail,
            detail=(
                "The Content-Security-Policy header is missing. CSP controls which scripts, styles, "
                "frames, images, and other resources the browser is allowed to load or execute. "
                "Without it, injected content has fewer browser-level restrictions."
            ),
            remediation=(
                "Add a restrictive Content-Security-Policy such as \"default-src 'self'\" "
                "and explicitly allow only required external sources."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=None,
        )

    directives = {}

    for section in raw.split(";"):
        parts = section.strip().split()

        if not parts:
            continue

        name = parts[0].lower()

        if name not in directives:
            directives[name] = [value.lower() for value in parts[1:]]

    default_sources = directives.get("default-src")
    script_sources = directives.get("script-src")

    effective_script_sources = (
        script_sources
        if script_sources is not None
        else default_sources
    )

    if effective_script_sources is None:
        return Finding(
            id="csp_script_policy_missing",
            control="csp",
            title="CSP Does Not Restrict Script Sources",
            severity=Severity.high,
            status=Status.fail,
            detail=(
                "The CSP does not define either script-src or a default-src fallback. "
                "JavaScript sources are therefore not meaningfully restricted by the policy."
            ),
            remediation=(
                "Define a restrictive script-src directive or add an appropriate default-src fallback."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=raw,
        )

    has_nonce_or_hash = any(
        value.startswith("'nonce-")
        or value.startswith("'sha256-")
        or value.startswith("'sha384-")
        or value.startswith("'sha512-")
        for value in effective_script_sources
    )

    if "*" in effective_script_sources:
        return Finding(
            id="csp_script_wildcard",
            control="csp",
            title="CSP Allows Scripts From Any Origin",
            severity=Severity.high,
            status=Status.fail,
            detail=(
                "The effective script policy contains '*', allowing scripts to be loaded "
                "from arbitrary origins and significantly weakening CSP protection."
            ),
            remediation=(
                "Replace wildcard sources with explicitly trusted origins, nonces, or hashes."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=raw,
        )

    elif "'unsafe-inline'" in effective_script_sources and not has_nonce_or_hash:
        return Finding(
            id="csp_unsafe_inline",
            control="csp",
            title="CSP Allows Unsafe Inline Scripts",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "The effective script policy permits 'unsafe-inline', allowing inline JavaScript "
                "and weakening CSP protection against injected scripts and XSS."
            ),
            remediation=(
                "Remove 'unsafe-inline' and use CSP nonces or cryptographic hashes "
                "for legitimate inline scripts."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=raw,
        )

    elif "'unsafe-eval'" in effective_script_sources:
        return Finding(
            id="csp_unsafe_eval",
            control="csp",
            title="CSP Allows Unsafe JavaScript Evaluation",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "The effective script policy contains 'unsafe-eval', allowing JavaScript "
                "APIs that compile strings into executable code and increasing the impact "
                "of some script-injection vulnerabilities."
            ),
            remediation=(
                "Remove 'unsafe-eval' and refactor code that depends on dynamic JavaScript evaluation."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=raw,
        )

    return None

# Checks the X-Content-Type-Options header.

def check_content_type_options(headers: dict) -> Finding | None:
    raw = headers.get("x-content-type-options")

    if not raw:
        return Finding(
            id="x_content_type_options_missing",
            control="content_type_options",
            title="X-Content-Type-Options Header Missing",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "The X-Content-Type-Options header is missing. Without 'nosniff', "
                "browsers may attempt to guess a resource's MIME type instead of strictly "
                "following the server's declared Content-Type."
            ),
            remediation="Add 'X-Content-Type-Options: nosniff'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options",
            raw_headers=None,
        )

    elif raw.strip().lower() != "nosniff":
        return Finding(
            id="x_content_type_options_invalid",
            control="content_type_options",
            title="X-Content-Type-Options Header Invalid",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                f"The X-Content-Type-Options header contains the unsupported value '{raw}'. "
                "The expected value is 'nosniff'."
            ),
            remediation="Set the header to 'X-Content-Type-Options: nosniff'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options",
            raw_headers=raw,
        )

    return None

# Checks framing protection using X-Frame-Options and CSP frame-ancestors.

def check_frame_protection(headers: dict) -> Finding | None:
    xfo_raw = headers.get("x-frame-options")
    csp_raw = headers.get("content-security-policy")

    xfo = xfo_raw.strip().lower() if xfo_raw else None
    frame_ancestors = None

    if csp_raw:
        for section in csp_raw.split(";"):
            parts = section.strip().split()

            if parts and parts[0].lower() == "frame-ancestors":
                frame_ancestors = [value.lower() for value in parts[1:]]
                break

    if frame_ancestors and "*" not in frame_ancestors:
        return None

    elif xfo in {"deny", "sameorigin"}:
        return None

    elif frame_ancestors and "*" in frame_ancestors:
        return Finding(
            id="frame_ancestors_wildcard",
            control="frame_protection",
            title="CSP Allows Framing From Any Origin",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "The CSP frame-ancestors directive allows framing from any origin. "
                "Untrusted websites may therefore be able to embed the page and use it "
                "in clickjacking attacks."
            ),
            remediation=(
                "Use \"frame-ancestors 'none'\" to prevent framing or "
                "\"frame-ancestors 'self'\" to allow only same-origin framing."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors",
            raw_headers=csp_raw,
        )

    elif xfo_raw:
        return Finding(
            id="x_frame_options_invalid",
            control="frame_protection",
            title="X-Frame-Options Header Invalid",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                f"The X-Frame-Options header contains the unsupported value '{xfo_raw}', "
                "and no effective CSP frame-ancestors protection was detected."
            ),
            remediation=(
                "Use 'X-Frame-Options: DENY', 'SAMEORIGIN', or an appropriate "
                "CSP frame-ancestors directive."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
            raw_headers=xfo_raw,
        )

    else:
        return Finding(
            id="frame_protection_missing",
            control="frame_protection",
            title="Frame Protection Missing",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "Neither a valid X-Frame-Options header nor a CSP frame-ancestors policy "
                "was detected. Other websites may be able to embed the page and potentially "
                "use it in clickjacking attacks."
            ),
            remediation=(
                "Use \"frame-ancestors 'none'\", \"frame-ancestors 'self'\", "
                "'X-Frame-Options: DENY', or 'SAMEORIGIN'."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
            raw_headers=None,
        )

# Checks the Referrer-Policy header.

def check_referrer_policy(headers: dict) -> Finding | None:
    raw = headers.get("referrer-policy")

    valid_policies = {
        "no-referrer",
        "no-referrer-when-downgrade",
        "origin",
        "origin-when-cross-origin",
        "same-origin",
        "strict-origin",
        "strict-origin-when-cross-origin",
        "unsafe-url",
    }

    strong_policies = {
        "no-referrer",
        "same-origin",
        "strict-origin",
        "strict-origin-when-cross-origin",
    }

    if not raw:
        return Finding(
            id="referrer_policy_missing",
            control="referrer_policy",
            title="Referrer-Policy Header Missing",
            severity=Severity.low,
            status=Status.fail,
            detail=(
                "The site does not explicitly define a Referrer-Policy. "
                "Although modern browsers normally use a restrictive default, defining "
                "the policy explicitly makes referrer behavior predictable and auditable."
            ),
            remediation=(
                "Add a policy such as 'Referrer-Policy: strict-origin-when-cross-origin'."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy",
            raw_headers=None,
        )

    policies = [
        policy.strip().lower()
        for policy in raw.split(",")
        if policy.strip()
    ]

    supported = [
        policy
        for policy in policies
        if policy in valid_policies
    ]

    if not supported:
        return Finding(
            id="referrer_policy_invalid",
            control="referrer_policy",
            title="Referrer-Policy Header Invalid",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                f"The Referrer-Policy value '{raw}' does not contain a recognized policy. "
                "The browser may fall back to its default behavior."
            ),
            remediation=(
                "Use a valid policy such as 'strict-origin-when-cross-origin', "
                "'same-origin', or 'no-referrer'."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy",
            raw_headers=raw,
        )

    effective_policy = supported[-1]

    if effective_policy == "unsafe-url":
        return Finding(
            id="referrer_policy_unsafe_url",
            control="referrer_policy",
            title="Referrer-Policy Exposes Full URLs",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "The effective Referrer-Policy is 'unsafe-url'. This may send the full "
                "URL path and query string to cross-origin destinations and can expose "
                "sensitive information stored in URLs."
            ),
            remediation=(
                "Use 'strict-origin-when-cross-origin', 'strict-origin', "
                "'same-origin', or 'no-referrer'."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy",
            raw_headers=raw,
        )

    elif effective_policy not in strong_policies:
        return Finding(
            id="referrer_policy_weak",
            control="referrer_policy",
            title="Referrer-Policy Could Be More Restrictive",
            severity=Severity.low,
            status=Status.fail,
            detail=(
                f"The effective Referrer-Policy is '{effective_policy}'. "
                "The value is valid but may disclose more referrer information than "
                "more restrictive modern policies."
            ),
            remediation=(
                "Consider using 'strict-origin-when-cross-origin', 'strict-origin', "
                "'same-origin', or 'no-referrer'."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy",
            raw_headers=raw,
        )

    return None

# Checks the Permissions-Policy header.

def check_permissions_policy(headers: dict) -> Finding | None:
    raw = headers.get("permissions-policy")

    if not raw:
        return Finding(
            id="permissions_policy_missing",
            control="permissions_policy",
            title="Permissions-Policy Header Missing",
            severity=Severity.low,
            status=Status.fail,
            detail=(
                "The Permissions-Policy header is missing. The application does not explicitly "
                "restrict browser capabilities such as the camera, microphone, geolocation, "
                "or their availability to embedded content."
            ),
            remediation=(
                "Add a Permissions-Policy header appropriate for the application, such as "
                "'camera=(), microphone=(), geolocation=(self)'."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy",
            raw_headers=None,
        )

    policies = {}

    for section in raw.split(","):
        section = section.strip()

        if "=" not in section:
            continue

        feature, allowlist = section.split("=", 1)

        policies[feature.strip().lower()] = allowlist.strip().lower()

    sensitive_features = {
        "camera",
        "microphone",
        "geolocation",
    }

    unrestricted = [
        feature
        for feature in sensitive_features
        if policies.get(feature) == "*"
    ]

    if unrestricted:
        return Finding(
            id="permissions_policy_sensitive_wildcard",
            control="permissions_policy",
            title="Permissions-Policy Allows Sensitive Features From Any Origin",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "Sensitive browser features are available to any origin: "
                f"{', '.join(sorted(unrestricted))}. Embedded third-party content may therefore "
                "receive broader access than intended."
            ),
            remediation=(
                "Restrict sensitive capabilities to trusted origins or disable them. "
                "For example: 'camera=(), microphone=(), geolocation=(self)'."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy",
            raw_headers=raw,
        )

    return None

def check_cookies(headers: dict) -> list[Finding]:
    findings = []
    cookies = headers.get("set-cookie")

    if not cookies:
        return findings

    if isinstance(cookies, str):
        cookies = [cookies]

    for cookie in cookies:
        parts = [part.strip() for part in cookie.split(";")]
        name = parts[0].split("=", 1)[0].strip()
        attributes = {part.lower() for part in parts[1:]}

        if "secure" not in attributes:
            findings.append(
                Finding(
                    id=f"cookie_{name}_missing_secure",
                    control="cookies",
                    title=f"Cookie '{name}' Missing Secure Attribute",
                    severity=Severity.medium,
                    status=Status.fail,
                    detail=(
                        f"The cookie '{name}' does not have the 'Secure' attribute. "
                        "Without it, the cookie may be transmitted over unencrypted HTTP connections."
                    ),
                    remediation="Add the 'Secure' attribute to the Set-Cookie header.",
                    url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie",
                    raw_headers=cookie,
                )
            )

        if "httponly" not in attributes:
            findings.append(
                Finding(
                    id=f"cookie_{name}_missing_httponly",
                    control="cookies",
                    title=f"Cookie '{name}' Missing HttpOnly Attribute",
                    severity=Severity.medium,
                    status=Status.fail,
                    detail=(
                        f"The cookie '{name}' does not have the 'HttpOnly' attribute. "
                        "Without it, client-side scripts may access the cookie, increasing the risk of XSS attacks."
                    ),
                    remediation="Add the 'HttpOnly' attribute to the Set-Cookie header.",
                    url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie",
                    raw_headers=cookie,
                )
            )

    return findings


def check_cors(headers: dict) -> Finding | None:
    if "access-control-allow-origin" not in headers:
        return Finding(
            id="cors_missing",
            control="cors",
            title="CORS Header Missing",
            severity=Severity.low,
            status=Status.fail,
            detail=(
                "The Access-Control-Allow-Origin header is missing. "
                "Without it, cross-origin requests may be blocked by browsers, "
                "but the application does not explicitly define its CORS policy."
            ),
            remediation=(
                "Add an appropriate Access-Control-Allow-Origin header to define the CORS policy."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
            raw_headers=None,
        )
    if "access-control-allow-credentials" in headers and headers.get("access-control-allow-origin") == "*":
        return Finding(
            id="cors_wildcard_with_credentials",
            control="cors",
            title="CORS Allows Any Origin With Credentials",
            severity=Severity.high,
            status=Status.fail,
            detail=(
                "The Access-Control-Allow-Origin header is set to '*', allowing any origin, "
                "while Access-Control-Allow-Credentials is also present. "
                "This combination allows cross-origin requests with credentials from any origin, "
                "which can lead to security vulnerabilities."
            ),
            remediation=(
                "Set Access-Control-Allow-Origin to a specific trusted origin when using credentials."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
            raw_headers=None,
        )


def check_server_header(headers: dict) -> Finding | None:
    value = headers.get("server")

    if value:
        return Finding(
            id="server_header_disclosure",
            control="server_header",
            title="Server Header Exposes Server Information",
            severity=Severity.low,
            status=Status.fail,
            detail=f"The Server header exposes server information: '{value}'.",
            remediation="Remove or minimize the Server header.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server",
            raw_headers=value,
        )


def check_powered_by(headers: dict) -> Finding | None:
    value = headers.get("x-powered-by")

    if value:
        return Finding(
            id="powered_by_disclosure",
            control="powered_by",
            title="X-Powered-By Header Exposes Technology",
            severity=Severity.low,
            status=Status.fail,
            detail=f"The X-Powered-By header exposes backend technology: '{value}'.",
            remediation="Remove the X-Powered-By header.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers",
            raw_headers=value,
        )


def check_aspnet_version(headers: dict) -> Finding | None:
    value = headers.get("x-aspnet-version")

    if value:
        return Finding(
            id="aspnet_version_disclosure",
            control="aspnet_version",
            title="ASP.NET Version Exposed",
            severity=Severity.low,
            status=Status.fail,
            detail=f"The X-AspNet-Version header exposes ASP.NET version information: '{value}'.",
            remediation="Disable the X-AspNet-Version header.",
            url="https://learn.microsoft.com/en-us/aspnet/",
            raw_headers=value,
        )


def check_coop(headers: dict) -> Finding | None:
    if "cross-origin-opener-policy" not in headers:
        return Finding(
            id="coop_missing",
            control="coop",
            title="Cross-Origin-Opener-Policy Missing",
            severity=Severity.low,
            status=Status.fail,
            detail="The Cross-Origin-Opener-Policy header is missing.",
            remediation="Consider using 'Cross-Origin-Opener-Policy: same-origin'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy",
            raw_headers=None,
        )


def check_coep(headers: dict) -> Finding | None:
    if "cross-origin-embedder-policy" not in headers:
        return Finding(
            id="coep_missing",
            control="coep",
            title="Cross-Origin-Embedder-Policy Missing",
            severity=Severity.low,
            status=Status.fail,
            detail="The Cross-Origin-Embedder-Policy header is missing.",
            remediation="Consider using 'Cross-Origin-Embedder-Policy: require-corp'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy",
            raw_headers=None,
        )


def check_corp(headers: dict) -> Finding | None:
    if "cross-origin-resource-policy" not in headers:
        return Finding(
            id="corp_missing",
            control="corp",
            title="Cross-Origin-Resource-Policy Missing",
            severity=Severity.low,
            status=Status.fail,
            detail="The Cross-Origin-Resource-Policy header is missing.",
            remediation="Consider using 'same-origin' or 'same-site'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy",
            raw_headers=None,
        )


def check_cache_control(headers: dict) -> Finding | None:
    if "cache-control" not in headers:
        return Finding(
            id="cache_control_missing",
            control="cache_control",
            title="Cache-Control Header Missing",
            severity=Severity.low,
            status=Status.fail,
            detail="The Cache-Control header is missing.",
            remediation="Define an appropriate caching policy.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control",
            raw_headers=None,
        )


def check_content_type(headers: dict) -> Finding | None:
    if "content-type" not in headers:
        return Finding(
            id="content_type_missing",
            control="content_type",
            title="Content-Type Header Missing",
            severity=Severity.low,
            status=Status.fail,
            detail="The Content-Type header is missing.",
            remediation="Set the correct Content-Type for the response.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type",
            raw_headers=None,
        )

def analyze_headers(headers: dict) -> list[Finding]:
    findings = []

    checks = [
        check_hsts,
        check_csp,
        check_content_type_options,
        check_frame_protection,
        check_referrer_policy,
        check_permissions_policy,
        check_cookies,
        check_cors,
        check_server_header,
        check_powered_by,
        check_aspnet_version,
        check_coop,
        check_coep,
        check_corp,
        check_cache_control,
        check_content_type,
    ]

    for check in checks:
        result = check(headers)

        if isinstance(result, list):
            findings.extend(result)
        elif result is not None:
            findings.append(result)

    return findings