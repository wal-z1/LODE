from enum import Enum
from pydantic import BaseModel

class Severity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"

class Status(str, Enum):
    passed = "pass"
    fail = "fail"
    warn = "warn"

class Finding(BaseModel):
    id: str
    control: str
    title: str
    severity: Severity
    status: Status
    detail: str
    remediation: str
    url: str | None
    raw_headers: str | None


class AnalyzeRequest(BaseModel):
    url: str | None = None
    raw_headers: str | None = None


class AnalysisSummary(BaseModel):
    total_findings: int
    severity_summary: dict[Severity, int]
    score: float


class AnalysisResponse(BaseModel):
    url: str | None
    score: float
    summary: AnalysisSummary
    findings: list[Finding]
    remarks: list[str]
