import { useState } from "react";

import { FindingRow } from "@/components/site/FindingRow";
import { ResultsLoading } from "@/components/site/ResultsLoading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisResponse, Severity } from "@/lib/types";

const severityOrder: Severity[] = ["critical", "high", "medium", "low"];

interface ResultsPanelProps {
	result: AnalysisResponse;
}

function scoreClass(score: number) {
	if (score >= 80) return "text-primary";
	if (score >= 50) return "text-amber-500";
	return "text-destructive";
}

function scoreTone(score: number) {
	if (score >= 80) {
		return {
			label: "Strong",
			className: "border-primary/40 bg-primary/10 text-primary",
		};
	}

	if (score >= 50) {
		return {
			label: "Partial",
			className: "border-amber-500/40 bg-amber-500/10 text-amber-600",
		};
	}

	return {
		label: "Limited",
		className: "border-destructive/40 bg-destructive/10 text-destructive",
	};
}

function ResultsPanel({ result }: ResultsPanelProps) {
	const [filter, setFilter] = useState<Severity | "all">("all");

	const sortedFindings = [...result.findings].sort(
		(a, b) =>
			severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
	);

	const filteredFindings = sortedFindings.filter(
		(finding) => filter === "all" || finding.severity === filter,
	);

	const tone = scoreTone(result.score);

	return (
		<section id="results" className="mt-8 pb-12">
			<div className="grid gap-4 border-y border-border py-3 sm:grid-cols-[120px_1fr_minmax(220px,320px)] sm:items-center">
				<div>
					<p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
						Header score
					</p>

					<div className="mt-1 flex items-end gap-2">
						<p
							className={`text-4xl font-medium leading-none ${scoreClass(result.score)}`}>
							{Math.round(result.score)}
						</p>

						<span
							className={`mb-0.5 border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] ${tone.className}`}>
							{tone.label}
						</span>
					</div>
				</div>

				<div>
					<p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
						Findings
					</p>

					<div className="mt-1.5 flex flex-wrap gap-1.5">
						{severityOrder.map((severity) => {
							const count = result.summary.severity_summary[severity] ?? 0;

							if (count === 0) return null;

							return (
								<span
									key={severity}
									className={`border px-1.5 py-0.5 text-[10px] uppercase ${
										severity === "critical"
											? "border-destructive/40 bg-destructive/10 text-destructive"
											: severity === "high"
												? "border-rose-500/40 bg-rose-500/10 text-rose-600"
												: severity === "medium"
													? "border-amber-500/40 bg-amber-500/10 text-amber-600"
													: "border-primary/40 bg-primary/10 text-primary"
									}`}>
									{count} {severity}
								</span>
							);
						})}
					</div>
				</div>

				<p className="text-xs leading-5 text-muted-foreground">
					This score reflects HTTP response configuration. It is not a malware,
					reputation, content, or website-safety verdict.
				</p>
			</div>

			<div className="mt-3 flex flex-wrap items-center gap-1.5">
				<span className="mr-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
					Show
				</span>

				{(["all", ...severityOrder] as const).map((severity) => (
					<Button
						key={severity}
						type="button"
						variant={filter === severity ? "default" : "outline"}
						size="xs"
						onClick={() => setFilter(severity)}>
						{severity}
					</Button>
				))}
			</div>

			{result.remarks?.length ? (
				<details className="mt-3 border-y border-border py-2">
					<summary className="cursor-pointer select-none text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground">
						Analysis notes ({result.remarks.length})
					</summary>

					<ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
						{result.remarks.map((remark) => (
							<li key={remark}>{remark}</li>
						))}
					</ul>
				</details>
			) : null}

			<Card className="mt-3">
				<CardContent className="px-3 py-0">
					{filteredFindings.map((finding) => (
						<FindingRow key={finding.id} finding={finding} />
					))}

					{filteredFindings.length === 0 ? (
						<p className="py-4 text-sm text-muted-foreground">
							No findings in this filter.
						</p>
					) : null}
				</CardContent>
			</Card>

			<p className="mt-2 text-[10px] leading-5 text-muted-foreground">
				Missing does not always mean vulnerable. Some headers are only useful
				for specific application features or deployment models.
			</p>
		</section>
	);
}

export { ResultsLoading, ResultsPanel };
