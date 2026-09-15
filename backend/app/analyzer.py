from fastapi import APIRouter

from backend.app.models import Finding,Severity, Status

def finding(id,title,severity,status,detail,remediation,url=None,raw_headers=None):
    return {
        "id": id,
        "title": title,
        "severity": severity,
        "status": status,
        "detail": detail,
        "remediation": remediation,
        "url": url,
        "raw_headers": raw_headers
    }

def check_hsts(headers: dict) -> Finding | None:
    if "strict-transport-security" not in headers:
        return Finding(
            id="hsts_missing",
            title="HSTS Header Missing",
            severity=Severity.high,
            status=Status.fail,
            detail="The Strict-Transport-Security (HSTS) header is missing from the response.",
            remediation="Add the 'Strict-Transport-Security' header with an appropriate max-age value.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=None
        )

    hsts = headers["strict-transport-security"].lower()

    if "max-age" not in hsts:
        return Finding(
            id="hsts_max_age_missing",
            title="HSTS max-age Missing",
            severity=Severity.high,
            status=Status.fail,
            detail="The HSTS header is present but does not define a max-age directive.",
            remediation="Add a max-age directive such as 'max-age=31536000'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=headers["strict-transport-security"]
        )

    if "max-age=0" in hsts:
        return Finding(
            id="hsts_disabled",
            title="HSTS Disabled",
            severity=Severity.high,
            status=Status.fail,
            detail="The HSTS header uses max-age=0, which disables HSTS protection.",
            remediation="Use a positive max-age value such as 'max-age=31536000'.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=headers["strict-transport-security"]
        )

    if "includesubdomains" not in hsts:
        return Finding(
            id="hsts_subdomains_missing",
            title="HSTS Does Not Include Subdomains",
            severity=Severity.low,
            status=Status.fail,
            detail="HSTS is enabled, but the includeSubDomains directive is missing.",
            remediation="Consider adding 'includeSubDomains' if all subdomains support HTTPS.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=headers["strict-transport-security"]
        )

    return None


def check_csp(headers: dict) -> Finding | None:
    if "content-security-policy" not in headers:
        return Finding(
            id="csp_missing",
            title="Content Security Policy (CSP) Header Missing",
            severity=Severity.high,
            status=Status.fail,
            detail="The Content-Security-Policy (CSP) header is missing from the response.",
            remediation="Add the 'Content-Security-Policy' header with a restrictive policy.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=None
        )

    csp = headers["content-security-policy"].lower()

    if "default-src *" in csp:
        return Finding(
            id="csp_wildcard",
            title="CSP Uses Wildcard Sources",
            severity=Severity.high,
            status=Status.fail,
            detail="The CSP allows resources from any origin using a wildcard source.",
            remediation="Replace wildcard sources with explicitly trusted origins.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=headers["content-security-policy"]
        )

    if "'unsafe-inline'" in csp:
        return Finding(
            id="csp_unsafe_inline",
            title="CSP Allows Unsafe Inline Content",
            severity=Severity.medium,
            status=Status.fail,
            detail="The CSP contains 'unsafe-inline', which weakens protection against injected scripts.",
            remediation="Remove 'unsafe-inline' where possible and use nonces or hashes instead.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=headers["content-security-policy"]
        )

    if "'unsafe-eval'" in csp:
        return Finding(
            id="csp_unsafe_eval",
            title="CSP Allows Unsafe JavaScript Evaluation",
            severity=Severity.medium,
            status=Status.fail,
            detail="The CSP contains 'unsafe-eval', which allows dynamic JavaScript evaluation.",
            remediation="Remove 'unsafe-eval' where possible.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=headers["content-security-policy"]
        )

    if "default-src" not in csp:
        return Finding(
            id="csp_default_src_missing",
            title="CSP default-src Missing",
            severity=Severity.low,
            status=Status.fail,
            detail="The CSP does not define a default-src fallback policy.",
            remediation="Add a default-src directive such as \"default-src 'self'\".",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=headers["content-security-policy"]
        )

    return None

def analyze_headers(headers:dict) -> list[Finding]:
    Findings = []
