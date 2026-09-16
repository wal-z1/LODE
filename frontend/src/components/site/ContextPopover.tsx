import { useState } from "react";
import { Info } from "@phosphor-icons/react";

function cleanContextText(value?: string) {
	if (!value) return null;

	return value
		.replace(/^(Worry if|Do not worry if|Do not panic if)\s*/i, "")
		.trim();
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

export { ContextPopover };
