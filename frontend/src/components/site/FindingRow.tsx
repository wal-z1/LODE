import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

import { ContextPopover } from "@/components/site/ContextPopover";
import { CopyButton } from "@/components/site/CopyButton";
import { getFindingExplanation } from "@/lib/findings";
import type { Finding, Severity } from "@/lib/types";

const contextDependentIds = new Set([
	"cors_missing",
	"permissions_policy_missing",
	"referrer_policy_missing",
	"coop_missing",
	"coep_missing",
	"corp_missing",
	"cache_control_missing",
]);

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
				<div className="mb-3 ml-0 border-l border-border pl-3 sm:ml-14.5">
					{summary ? (
						<div>
							<p className="text-[10px] uppercase tracking-widest text-muted-foreground">
								What it means
							</p>
							<p className="mt-1 max-w-3xl text-sm leading-5 text-foreground">
								{summary}
							</p>
						</div>
					) : null}

					{finding.status === "fail" && finding.remediation ? (
						<div className="mt-3">
							<p className="text-[10px] uppercase tracking-widest text-muted-foreground">
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
								<p className="text-[10px] uppercase tracking-widest text-muted-foreground">
									{explanation.example.label}
								</p>

								<CopyButton
									value={explanation.example.code}
									label={explanation.example.label}
								/>
							</div>

							<pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word px-2.5 py-2 font-mono text-xs leading-5 text-foreground">
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
							<summary className="cursor-pointer select-none text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
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

export { FindingRow };
