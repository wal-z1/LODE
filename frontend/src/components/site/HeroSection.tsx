interface HeroSectionProps {
	compact: boolean;
}

function HeroSection({ compact }: HeroSectionProps) {
	return (
		<section
			id="overview"
			aria-hidden={compact}
			className={`overflow-hidden transition-all duration-200 ${
				compact
					? "pointer-events-none max-h-0 pb-0 opacity-0"
					: "max-h-96 pb-7 opacity-100"
			}`}>
			<div className="mx-auto max-w-190 text-center">
				<h1 className="text-[clamp(38px,5vw,64px)] font-medium leading-[1.03] tracking-[-0.04em] text-primary">
					HTTP SECURITY HEADERS, MADE VISIBLE
				</h1>

				<p className="mx-auto mt-4 max-w-155 text-sm leading-6 text-muted-foreground">
					Inspect the browser-facing security configuration returned by a
					website and see what matters, what is optional, and what can be
					improved.
				</p>

				<div className="mx-auto mt-4 flex w-fit flex-wrap items-center justify-center gap-x-3 gap-y-1 border-y border-border px-3 py-2 text-[10px] uppercase tracking-[0.1em]">
					<span className="text-foreground">HTTP headers only</span>
					<span className="text-muted-foreground">
						No malware or page-behavior scanning
					</span>
				</div>
			</div>
		</section>
	);
}

export { HeroSection };