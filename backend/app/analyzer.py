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
            detail=(
                "The Strict-Transport-Security (HSTS) header is missing. "
                "Without HSTS, a user's browser may initially connect to the site over HTTP "
                "before being redirected to HTTPS. An attacker positioned on the network could "
                "attempt to intercept or downgrade that initial connection before HTTPS is established."
            ),
            remediation=(
                "Enable HSTS by adding the 'Strict-Transport-Security' response header. "
                "For example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains'. "
                "Only enable includeSubDomains if every subdomain is available over HTTPS."
            ),
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
            detail=(
                "The HSTS header is present but does not define a max-age directive. "
                "The max-age value tells the browser how long it must remember to access "
                "the site exclusively through HTTPS. Without it, the HSTS policy is incomplete."
            ),
            remediation=(
                "Add a max-age directive specifying how long browsers should enforce HTTPS. "
                "For example: 'Strict-Transport-Security: max-age=31536000'."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=headers["strict-transport-security"]
        )

    if "max-age=0" in hsts:
        return Finding(
            id="hsts_disabled",
            title="HSTS Disabled",
            severity=Severity.high,
            status=Status.fail,
            detail=(
                "The HSTS policy uses max-age=0. This tells browsers to immediately stop "
                "enforcing HSTS for the site, effectively disabling the protection and allowing "
                "future connections to begin over HTTP again."
            ),
            remediation=(
                "Use a positive max-age value. A commonly used value is "
                "'max-age=31536000', which instructs browsers to enforce HTTPS for one year."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=headers["strict-transport-security"]
        )

    if "includesubdomains" not in hsts:
        return Finding(
            id="hsts_subdomains_missing",
            title="HSTS Does Not Include Subdomains",
            severity=Severity.low,
            status=Status.fail,
            detail=(
                "HSTS is enabled for the current hostname, but it does not apply automatically "
                "to its subdomains. A subdomain that accepts insecure HTTP connections may therefore "
                "remain exposed to downgrade or interception attacks."
            ),
            remediation=(
                "Consider adding the 'includeSubDomains' directive if all current and future "
                "subdomains support HTTPS. Example: "
                "'Strict-Transport-Security: max-age=31536000; includeSubDomains'."
            ),
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
            detail=(
                "The Content-Security-Policy (CSP) header is missing. CSP allows a website to "
                "tell the browser which sources are trusted for scripts, styles, images, frames, "
                "and other resources. Without it, injected content such as malicious JavaScript "
                "has fewer browser-level restrictions, increasing the impact of vulnerabilities such as XSS."
            ),
            remediation=(
                "Define a restrictive Content-Security-Policy that only allows resources from "
                "trusted locations. A basic starting point may be \"default-src 'self'\", "
                "then additional sources can be explicitly allowed as required by the application."
            ),
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
            detail=(
                "The CSP uses a wildcard (*) in default-src, allowing resources to be loaded "
                "from virtually any origin. This removes much of CSP's ability to restrict where "
                "potentially dangerous content can come from."
            ),
            remediation=(
                "Replace wildcard sources with explicitly trusted origins. For example, "
                "use \"default-src 'self'\" and separately allow only the external domains "
                "that the application genuinely requires."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=headers["content-security-policy"]
        )

    if "'unsafe-inline'" in csp:
        return Finding(
            id="csp_unsafe_inline",
            title="CSP Allows Unsafe Inline Content",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "The CSP contains 'unsafe-inline'. This can allow inline scripts or styles to execute, "
                "depending on the directive where it is used. For scripts, this significantly weakens "
                "CSP's protection against injected JavaScript and some forms of cross-site scripting (XSS)."
            ),
            remediation=(
                "Remove 'unsafe-inline' where possible. For legitimate inline scripts, use "
                "CSP nonces or cryptographic hashes so that only explicitly authorized inline "
                "code is allowed to execute."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=headers["content-security-policy"]
        )

    if "'unsafe-eval'" in csp:
        return Finding(
            id="csp_unsafe_eval",
            title="CSP Allows Unsafe JavaScript Evaluation",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "The CSP contains 'unsafe-eval', which permits JavaScript mechanisms such as "
                "eval() and similar dynamic code execution. If an attacker can influence data "
                "passed into these functions, it can increase the likelihood or impact of code injection."
            ),
            remediation=(
                "Remove 'unsafe-eval' and avoid JavaScript features that dynamically compile "
                "strings as executable code. Refactor affected code or libraries where possible."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=headers["content-security-policy"]
        )

    if "default-src" not in csp:
        return Finding(
            id="csp_default_src_missing",
            title="CSP default-src Missing",
            severity=Severity.low,
            status=Status.fail,
            detail=(
                "The CSP does not define a default-src directive. default-src acts as the fallback "
                "policy for several resource types that do not have a more specific directive. "
                "Without a fallback, resources not explicitly covered by other directives may be "
                "less restricted than intended."
            ),
            remediation=(
                "Add a restrictive default-src fallback such as \"default-src 'self'\" and "
                "override it with more specific directives only where necessary."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
            raw_headers=headers["content-security-policy"]
        )

    return None


def check_content_type_options(headers: dict) -> Finding | None:
    if "x-content-type-options" not in headers:
        return Finding(
            id="x_content_type_options_missing",
            title="X-Content-Type-Options Header Missing",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "The X-Content-Type-Options header is missing. Without 'nosniff', browsers may "
                "attempt to guess the type of some resources instead of strictly respecting the "
                "server's declared Content-Type. In certain situations, attacker-controlled content "
                "could therefore be interpreted as executable script or HTML rather than harmless data."
            ),
            remediation=(
                "Add 'X-Content-Type-Options: nosniff' to responses and ensure that every resource "
                "is also served with the correct Content-Type."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options",
            raw_headers=None
        )

    if headers["x-content-type-options"].lower() != "nosniff":
        return Finding(
            id="x_content_type_options_invalid",
            title="X-Content-Type-Options Header Invalid",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                f"The X-Content-Type-Options header is present but uses the invalid value "
                f"'{headers['x-content-type-options']}'. Browsers expect the value 'nosniff'; "
                "other values do not provide the intended MIME-sniffing protection."
            ),
            remediation=(
                "Set the header exactly to 'X-Content-Type-Options: nosniff' and ensure resources "
                "are returned with accurate Content-Type headers."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options",
            raw_headers=headers["x-content-type-options"]
        )

    return None


def check_frame_protection(headers: dict) -> Finding | None:
    if "x-frame-options" not in headers:
        return Finding(
            id="x_frame_options_missing",
            title="X-Frame-Options Header Missing",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                "The X-Frame-Options header is missing. Without frame restrictions, another website "
                "may be able to embed this page inside an iframe. An attacker could potentially hide "
                "or overlay the framed page with deceptive controls and trick a logged-in user into "
                "clicking legitimate application buttons. This attack is known as clickjacking."
            ),
            remediation=(
                "Set 'X-Frame-Options: DENY' if the page should never be framed, or "
                "'X-Frame-Options: SAMEORIGIN' if framing should only be allowed by pages "
                "from the same origin. Modern applications should also consider CSP's "
                "'frame-ancestors' directive."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
            raw_headers=None
        )

    if headers["x-frame-options"].lower() not in ["deny", "sameorigin"]:
        return Finding(
            id="x_frame_options_invalid",
            title="X-Frame-Options Header Invalid",
            severity=Severity.medium,
            status=Status.fail,
            detail=(
                f"The X-Frame-Options header uses the unsupported or ineffective value "
                f"'{headers['x-frame-options']}'. As a result, the browser may not prevent "
                "untrusted websites from embedding the page, leaving it potentially exposed "
                "to clickjacking attacks."
            ),
            remediation=(
                "Set the header to 'DENY' to prevent all framing or 'SAMEORIGIN' to allow "
                "framing only from the same origin. For more flexible control, use the "
                "Content-Security-Policy 'frame-ancestors' directive."
            ),
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
            raw_headers=headers["x-frame-options"]
        )

    return None
def analyze_headers(headers:dict) -> list[Finding]:
    Findings = []
