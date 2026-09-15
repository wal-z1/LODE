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
    title: str
    severity: Severity
    status: Status
    detail: str
    remediation: str
    url: str | None
    raw_headers: str | None
