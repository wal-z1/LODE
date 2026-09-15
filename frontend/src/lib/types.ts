export type AnalysisMode = "url" | "raw_headers";
export type Severity = "critical" | "high" | "medium" | "low";
export type FindingStatus = "pass" | "fail" | "warn";

export interface Finding {
	id: string;
	control: string;
	title: string;
	severity: Severity;
	status: FindingStatus;
	detail: string;
	remediation: string;
	url: string | null;
	raw_headers: string | null;
}

export interface AnalysisSummary {
	total_findings: number;
	severity_summary: Partial<Record<Severity, number>>;
	score: number;
}

export interface AnalysisResponse {
	url: string | null;
	score: number;
	summary: AnalysisSummary;
	findings: Finding[];
}

export type AnalyzePayload = { url: string } | { raw_headers: string };
