import { useState } from "react";
import { CaretDown, SpinnerGap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisResponse, Finding, Severity } from "@/lib/types";

const severityOrder: Severity[] = ["critical", "high", "medium", "low"];

interface ResultsPanelProps {
	result: AnalysisResponse;
}

function ResultsLoading() {
	return (
		<section
			aria-live="polite"
			aria-label="Analysis in progress"
			className="mt-16 pb-20">
			<div className="flex items-center gap-3 border-y border-border py-6 text-sm text-muted-foreground">
				<SpinnerGap className="size-5 animate-spin text-primary" />
				<span>Analyzing response headers...</span>
			</div>
			<div className="mt-3 border border-border p-4">
				<div className="h-6 w-28 animate-pulse bg-muted" />
				<div className="mt-5 space-y-3">
					<div className="h-4 w-3/4 animate-pulse bg-muted" />
					<div className="h-4 w-full animate-pulse bg-muted" />
					<div className="h-4 w-2/3 animate-pulse bg-muted" />
				</div>
			</div>
		</section>
	);
}

function scoreClass(score: number) {
	if (score >= 80) return "text-primary";
	if (score >= 50) return "text-muted-foreground";
	return "text-destructive";
}

function badgeClass(severity: Severity) {
	if (severity === "critical" || severity === "high")
		return "border-destructive/50 text-destructive";
	if (severity === "medium")
		return "border-muted-foreground/50 text-muted-foreground";
	return "border-primary/50 text-primary";
}

function statusLabel(status: Finding["status"]) {
	if (status === "pass") return "Looks good";
	if (status === "warn") return "Review suggested";
	return "Needs attention";
}

function FindingRow({ finding }: { finding: Finding }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="border-t border-border py-4 first:border-t-0">
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={`border px-1.5 py-0.5 text-[10px] uppercase ${badgeClass(finding.severity)}`}>
					{finding.severity}
				</span>
				<span className="text-base font-medium">{finding.title}</span>
				<span className="ml-auto text-[10px] uppercase text-muted-foreground">
					{statusLabel(finding.status)}
				</span>
			</div>
			<p className="mt-2 text-sm leading-6 text-muted-foreground">
				{finding.detail}
			</p>
			{finding.url ? (
				<a
					href={finding.url}
					target="_blank"
					rel="noreferrer"
					className="mt-2 inline-block text-xs text-primary underline underline-offset-4 hover:text-foreground">
					Documentation
				</a>
			) : null}
			{finding.status === "fail" ? (
				<>
					<Button
						type="button"
						variant="ghost"
						size="xs"
						aria-expanded={expanded}
						onClick={() => setExpanded((current) => !current)}
						className="mt-2 px-0 text-xs uppercase text-primary">
						<CaretDown className={expanded ? "rotate-180" : ""} />
						{expanded ? "Hide remediation" : "Show remediation"}
					</Button>
					{expanded ? (
						<p className="mt-2 border-l-2 border-primary pl-3 text-sm leading-6">
							{finding.remediation}
						</p>
					) : null}
				</>
			) : null}
		</div>
	);
}

function ResultsPanel({ result }: ResultsPanelProps) {
	const [filter, setFilter] = useState<Severity | "all">("all");
	const filteredFindings = result.findings.filter(
		(finding) => filter === "all" || finding.severity === filter,
	);

	return (
		<section id="results" className="mt-16 pb-20">
			<div className="grid gap-4 border-y border-border py-6 sm:grid-cols-[180px_1fr]">
				<div>
					<p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
						Security score{" "}
						<span className="normal-case tracking-normal">
							(higher is better)
						</span>
					</p>
					<p
						className={`mt-2 text-6xl font-medium leading-none ${scoreClass(result.score)}`}>
						{Math.round(result.score)}
					</p>
				</div>
				<div>
					<p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
						Summary
					</p>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">
						These labels show how urgently each issue needs attention. Select a
						label below to focus the list.
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						{severityOrder.map((severity) => {
							const count = result.summary.severity_summary[severity] ?? 0;
							return count > 0 ? (
								<span
									key={severity}
									className={`border px-2 py-1 text-xs uppercase ${badgeClass(severity)}`}>
									{severity}: {count}
								</span>
							) : null;
						})}
					</div>
				</div>
			</div>

			<div className="mt-8 flex flex-wrap items-center gap-2">
				<p className="mr-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
					Findings{" "}
					<span className="normal-case tracking-normal">
						(what LODE noticed)
					</span>
				</p>
				{["all", ...severityOrder].map((severity) => (
					<Button
						key={severity}
						type="button"
						variant={filter === severity ? "default" : "outline"}
						size="xs"
						onClick={() => setFilter(severity as Severity | "all")}>
						{severity}
					</Button>
				))}
			</div>

			<Card className="mt-3">
				<CardContent className="p-0">
					{severityOrder.map((severity) => {
						const findings = filteredFindings.filter(
							(finding) => finding.severity === severity,
						);
						return findings.length > 0 ? (
							<div key={severity} className="px-4 first:pt-1">
								<h3 className="border-b border-border py-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
									{severity}
								</h3>
								{findings.map((finding) => (
									<FindingRow key={finding.id} finding={finding} />
								))}
							</div>
						) : null;
					})}
					{filteredFindings.length === 0 ? (
						<p className="p-4 text-sm text-muted-foreground">
							No findings in this filter.
						</p>
					) : null}
				</CardContent>
			</Card>
			<p className="mt-3 text-xs leading-5 text-muted-foreground">
				A passing check is already in place. A warning may need review. A failed
				check includes a remediation you can expand.
			</p>
			<p className="mt-2 border-l-2 border-border pl-3 text-xs leading-5 text-muted-foreground">
				Context matters: some missing headers are normal for static websites and
				may not indicate a real issue. LODE checks headers only; it is not a
				malicious-link scanner.
			</p>
		</section>
	);
}

export { ResultsLoading, ResultsPanel };
