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

def check_hsts(headers:dict) -> Finding | None:
    if "strict-transport-security" not in headers:
        return Finding(
            id="hsts_missing",
            title="HSTS Header Missing",
            severity=Severity.high,
            status=Status.fail,
            detail="The Strict-Transport-Security (HSTS) header is missing from the response. This header is important for enforcing secure connections and preveniting plaintext communication over HTTP.",
            remediation="Add the 'Strict-Transport-Security' header to your server configuration with an appropriate max-age value.",
            url="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
            raw_headers=None
        )
    return None


def analyze_headers(headers:dict) -> list[Finding]:
    Findings = []
