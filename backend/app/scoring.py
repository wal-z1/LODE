from .models import Finding, Severity

CONTROL_WEIGHTS = {
    "csp": 20,
    "cookies": 15,
    "hsts": 15,
    "cors": 10,
    "frame_protection": 10,
    "content_type": 5,
    "content_type_options": 5,
    "referrer_policy": 5,
    "permissions_policy": 5,
    "other": 10,
}

SEVERITY_PENALTY = {
    Severity.critical: 1.50,
    Severity.high: 1.00,
    Severity.medium: 0.50,
    Severity.low: 0.25,
}


def severity_summary(findings: list[Finding]) -> dict[Severity, int]:
    summary = {severity: 0 for severity in Severity}
    for finding in findings:
        summary[finding.severity] += 1
    return summary

def calc_score(findings: list[Finding]) -> float:
    score = 100.0
    for finding in findings:
      penalty = SEVERITY_PENALTY.get(finding.severity, 0)
      score -= CONTROL_WEIGHTS.get(finding.control, 10) * penalty
    return max(score, 0.0)

def report_summary(findings: list[Finding]) -> dict:
    summary = {
        "total_findings": len(findings),
        "severity_summary": severity_summary(findings),
        "score": calc_score(findings),
    }
    return summary
