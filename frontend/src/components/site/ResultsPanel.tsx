import { useState } from "react";
import {
	CaretDown,
	Check,
	Copy,
	Info,
	SpinnerGap,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFindingExplanation } from "@/lib/findings";
import type { AnalysisResponse, Finding, Severity } from "@/lib/types";

const severityOrder: Severity[] = ["critical", "high", "medium", "low"];

const contextDependentIds = new Set([
	"cors_missing",
	"permissions_policy_missing",
	"referrer_policy_missing",
	"coop_missing",
	"coep_missing",
	"corp_missing",
	"cache_control_missing",
]);

interface ResultsPanelProps {
	result: AnalysisResponse;
}

function ResultsLoading() {
	return (
		<section
			aria-live="polite"
			aria-label="Header check in progress"
			className="mt-8 pb-12">
			<div className="flex items-center gap-2.5 border-y border-border py-3 text-sm text-muted-foreground">
				<SpinnerGap className="size-4 animate-spin text-primary" />
				<span>Checking HTTP response headers...</span>
			</div>
		</section>
	);
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

function badgeClass(severity: Severity) {
	if (severity === "critical") {
		return "border-destructive/40 bg-destructive/10 text-destructive";
	}

	if (severity === "high") {
		return "border-rose-500/40 bg-rose-500/10 text-rose-600";
	}

	if (severity === "medium") {
		return "border-amber-500/40 bg-amber-500/10 text-amber-600";
	}

	return "border-primary/40 bg-primary/10 text-primary";
}

function statusTone(finding: Finding) {
	if (contextDependentIds.has(finding.id)) {
		return {
			label: "Context",
			className: "text-muted-foreground",
		};
	}

	if (finding.status === "pass") {
		return {
			label: "OK",
			className: "text-primary",
		};
	}

	if (finding.status === "warn") {
		return {
			label: "Review",
			className: "text-amber-600",
		};
	}

	return {
		label: "Action",
		className: "text-destructive",
	};
}

function cleanContextText(value?: string) {
	if (!value) return null;

	return value
		.replace(/^(Worry if|Do not worry if|Do not panic if)\s*/i, "")
		.trim();
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

		window.setTimeout(() => {
			setCopied(false);
		}, 1500);
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

function ContextPopover({
	whenToWorry,
	whenNotToWorry,
}: {
	whenToWorry?: string;
	whenNotToWorry?: string;
}) {
	const [open, setOpen] = useState(false);

	const importantWhen = cleanContextText(whenToWorry);
	const lowerConcernWhen = cleanContextText(whenNotToWorry);

	if (!importantWhen && !lowerConcernWhen) {
		return null;
	}

	return (
		<span
			className="relative inline-flex shrink-0 items-center gap-1.5"
			onMouseEnter={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}>
			<span className="hidden text-[10px] uppercase tracking-[0.1em] text-muted-foreground sm:inline">
				Hover for when this matters
			</span>

			<button
				type="button"
				aria-label="When this finding matters"
				aria-expanded={open}
				onClick={() => setOpen((current) => !current)}
				onFocus={() => setOpen(true)}
				onBlur={() => setOpen(false)}
				className="inline-flex size-6 items-center justify-center rounded-none border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
				<Info className="size-3.5" />
			</button>

			<span
				role="tooltip"
				className={`absolute right-0 top-full z-20 mt-1 w-[min(19rem,calc(100vw-2rem))] rounded-none border border-border bg-background p-2.5 text-left shadow-md transition-all duration-150 ${
					open
						? "visible translate-y-0 opacity-100"
						: "invisible -translate-y-1 opacity-0"
				}`}>
				{importantWhen ? (
					<span className="block">
						<span className="block text-[10px] uppercase tracking-[0.1em] text-primary">
							Important when
						</span>
						<span className="mt-1 block text-xs leading-5 text-foreground">
							{importantWhen}
						</span>
					</span>
				) : null}

				{lowerConcernWhen ? (
					<span
						className={
							importantWhen ? "mt-2 block border-t border-border pt-2" : "block"
						}>
						<span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
							Lower concern when
						</span>
						<span className="mt-1 block text-xs leading-5 text-foreground">
							{lowerConcernWhen}
						</span>
					</span>
				) : null}
			</span>
		</span>
	);
}

function FindingRow({ finding }: { finding: Finding }) {
	const [expanded, setExpanded] = useState(false);

	const explanation = getFindingExplanation(finding);
	const status = statusTone(finding);
	const contextDependent = contextDependentIds.has(finding.id);
	const summary = explanation?.plainEnglish || finding.detail;

	const hasDetails = Boolean(
		summary ||
		finding.remediation ||
		explanation?.developer ||
		explanation?.example,
	);

	return (
		<div className="border-t border-border first:border-t-0">
			<div className="flex min-h-12 items-center gap-2 py-2">
				<span
					className={`shrink-0 border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] ${badgeClass(finding.severity)}`}>
					{finding.severity}
				</span>

				<button
					type="button"
					disabled={!hasDetails}
					onClick={() => setExpanded((current) => !current)}
					className="min-w-0 flex-1 text-left focus-visible:outline-none">
					<span className="block text-sm font-medium leading-5 text-foreground">
						{finding.title}
					</span>
				</button>

				<ContextPopover
					whenToWorry={explanation?.whenToWorry}
					whenNotToWorry={explanation?.whenNotToWorry}
				/>

				<span
					className={`hidden shrink-0 text-[9px] uppercase tracking-[0.08em] sm:inline ${status.className}`}>
					{status.label}
				</span>

				{hasDetails ? (
					<button
						type="button"
						aria-label={
							expanded ? `Collapse ${finding.title}` : `Expand ${finding.title}`
						}
						aria-expanded={expanded}
						onClick={() => setExpanded((current) => !current)}
						className="inline-flex size-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
						<CaretDown
							className={`size-3.5 transition-transform ${
								expanded ? "rotate-180" : ""
							}`}
						/>
					</button>
				) : null}
			</div>

			{expanded ? (
				<div className="mb-3 ml-0 border-l border-border pl-3 sm:ml-[58px]">
					{summary ? (
						<div>
							<p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
								What it means
							</p>
							<p className="mt-1 max-w-3xl text-sm leading-5 text-foreground">
								{summary}
							</p>
						</div>
					) : null}

					{finding.status === "fail" && finding.remediation ? (
						<div className="mt-3">
							<p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
								{contextDependent ? "If applicable" : "Next step"}
							</p>
							<p className="mt-1 max-w-3xl text-sm leading-5 text-foreground">
								{finding.remediation}
							</p>
						</div>
					) : null}

					{explanation?.example ? (
						<div className="mt-3 max-w-3xl overflow-hidden border border-border bg-muted/30">
							<div className="flex items-center justify-between gap-3 border-b border-border px-2.5 py-2">
								<p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
									{explanation.example.label}
								</p>

								<CopyButton
									value={explanation.example.code}
									label={explanation.example.label}
								/>
							</div>

							<pre className="overflow-x-auto whitespace-pre-wrap break-words px-2.5 py-2 font-mono text-xs leading-5 text-foreground">
								{explanation.example.code}
							</pre>

							{explanation.example.note ? (
								<p className="border-t border-border px-2.5 py-2 text-xs leading-5 text-muted-foreground">
									{explanation.example.note}
								</p>
							) : null}
						</div>
					) : null}

					{explanation?.developer ? (
						<details className="mt-3 max-w-3xl">
							<summary className="cursor-pointer select-none text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground">
								Developer context
							</summary>

							<p className="mt-2 text-sm leading-5 text-muted-foreground">
								{explanation.developer}
							</p>
						</details>
					) : null}
				</div>
			) : null}
		</div>
	);
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
									className={`border px-1.5 py-0.5 text-[10px] uppercase ${badgeClass(severity)}`}>
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
