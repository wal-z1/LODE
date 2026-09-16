import { useState } from "react";
import { CaretDown, Check, Copy, SpinnerGap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFindingExplanation } from "@/lib/findings";
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

function scoreTone(score: number) {
	if (score >= 80)
		return { label: "Low risk", className: "border-primary/50 text-primary" };
	if (score >= 50)
		return {
			label: "Watchlist",
			className: "border-muted-foreground/50 text-muted-foreground",
		};
	return {
		label: "High risk",
		className: "border-destructive/50 text-destructive",
	};
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

function CopyButton({ value, label }: { value: string; label: string }) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(value);
		} catch {
			const textarea = document.createElement("textarea");
			textarea.value = value;
			textarea.setAttribute("readonly", "");
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			textarea.remove();
		}

		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="xs"
			aria-label={copied ? `${label} copied` : `Copy ${label}`}
			onClick={handleCopy}
			className="shrink-0">
			{copied ? <Check className="size-3" /> : <Copy className="size-3" />}
			{copied ? "Copied" : "Copy"}
		</Button>
	);
}

function ConcernHover({
	whenToWorry,
	whenNotToWorry,
}: {
	whenToWorry?: string;
	whenNotToWorry?: string;
}) {
	if (!whenToWorry && !whenNotToWorry) {
		return null;
	}

	return (
		<span
			className="group relative inline-flex items-center gap-1 align-middle text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
			title={whenToWorry || whenNotToWorry || "Should I worry?"}>
			<span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card text-[9px] text-foreground">
				?
			</span>
			<span className="sr-only">Should I worry?</span>
			<span className="pointer-events-none absolute left-0 top-full z-10 mt-1 w-64 rounded-sm border border-border bg-background p-2 text-left text-[10px] leading-5 text-muted-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
				{whenToWorry ? (
					<span className="mb-1 block text-foreground">
						<strong>Worry if:</strong> {whenToWorry}
					</span>
				) : null}
				{whenNotToWorry ? (
					<span className="block text-foreground">
						<strong>Not a worry if:</strong> {whenNotToWorry}
					</span>
				) : null}
			</span>
		</span>
	);
}

function FindingRow({ finding }: { finding: Finding }) {
	const explanation = getFindingExplanation(finding);
	const [remediationExpanded, setRemediationExpanded] = useState(false);
	const [developerExpanded, setDeveloperExpanded] = useState(false);
	const [exampleExpanded, setExampleExpanded] = useState(false);

	return (
		<div className="border-t border-border py-4 first:border-t-0">
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={`border px-1.5 py-0.5 text-[10px] uppercase ${badgeClass(finding.severity)}`}>
					{finding.severity}
				</span>
				<span className="text-base font-medium">{finding.title}</span>
				<ConcernHover
					whenToWorry={explanation?.whenToWorry}
					whenNotToWorry={explanation?.whenNotToWorry}
				/>
				<span className="ml-auto text-[10px] uppercase text-muted-foreground">
					{statusLabel(finding.status)}
				</span>
			</div>

			{explanation ? (
				<div className="mt-3 rounded-sm border border-border bg-card/50 p-3">
					<p className="text-xs font-medium text-foreground">
						In plain English
					</p>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						{explanation.plainEnglish}
					</p>
				</div>
			) : null}

			{finding.status === "fail" ? (
				<>
					<Button
						type="button"
						variant="ghost"
						size="xs"
						aria-expanded={remediationExpanded}
						onClick={() => setRemediationExpanded((current) => !current)}
						className="mt-3 px-0 text-xs uppercase text-primary">
						<CaretDown className={remediationExpanded ? "rotate-180" : ""} />
						{remediationExpanded ? "Hide remediation" : "Show remediation"}
					</Button>
					{remediationExpanded ? (
						<p className="mt-2 border-l-2 border-primary pl-3 text-sm leading-6">
							{finding.remediation}
						</p>
					) : null}
				</>
			) : null}

			{explanation?.developer ? (
				<>
					<Button
						type="button"
						variant="ghost"
						size="xs"
						aria-expanded={developerExpanded}
						onClick={() => setDeveloperExpanded((current) => !current)}
						className="mt-2 px-0 text-xs uppercase text-primary">
						<CaretDown className={developerExpanded ? "rotate-180" : ""} />
						{developerExpanded
							? "Hide developer guidance"
							: "Show developer guidance"}
					</Button>
					{developerExpanded ? (
						<div className="mt-2 rounded-sm border border-border bg-card/50 p-3">
							<p className="text-xs font-medium text-foreground">
								Developer guidance
							</p>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								{explanation.developer}
							</p>
							<p className="mt-2 text-xs leading-5 text-muted-foreground">
								Analyzer detail: {finding.detail}
							</p>
						</div>
					) : null}
				</>
			) : null}

			{explanation?.example ? (
				<>
					<div className="mt-2 flex items-center justify-between gap-2">
						<Button
							type="button"
							variant="ghost"
							size="xs"
							aria-expanded={exampleExpanded}
							onClick={() => setExampleExpanded((current) => !current)}
							className="px-0 text-xs uppercase text-primary">
							<CaretDown className={exampleExpanded ? "rotate-180" : ""} />
							{exampleExpanded
								? "Hide starter configuration"
								: "Show starter configuration"}
						</Button>
						{exampleExpanded ? (
							<CopyButton
								value={explanation.example.code}
								label={explanation.example.label}
							/>
						) : null}
					</div>
					{exampleExpanded ? (
						<div className="mt-2 overflow-x-auto rounded-sm border border-border bg-muted/40 p-3">
							<p className="text-xs font-medium text-foreground">
								{explanation.example.label}
							</p>
							<pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-foreground">
								{explanation.example.code}
							</pre>
							{explanation.example.note ? (
								<p className="mt-2 text-xs leading-5 text-muted-foreground">
									{explanation.example.note}
								</p>
							) : null}
						</div>
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
					<span
						className={`mt-3 inline-flex w-fit items-center border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${scoreTone(result.score).className}`}
						title={
							result.score >= 80
								? "Should I worry? Usually not if the score is high and the remaining findings are limited to low-risk or expected gaps."
								: result.score >= 50
									? "Should I worry? Possibly, but it is usually a watchlist item depending on the app's real-world exposure and sensitive data."
									: "Should I worry? Yes, the app likely has several impactful gaps and should be reviewed before relying on it for sensitive traffic."
						}>
						{scoreTone(result.score).label}
					</span>
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

			{result.remarks && result.remarks.length > 0 ? (
				<div className="mt-4 rounded-sm border border-border bg-card/40 p-3">
					<p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
						Notes
					</p>
					<ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
						{result.remarks.map((remark) => (
							<li key={remark} className="list-disc pl-5">
								{remark}
							</li>
						))}
					</ul>
				</div>
			) : null}

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
