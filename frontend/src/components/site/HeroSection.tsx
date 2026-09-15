function HeroSection() {
	return (
		<section id="overview" className="pb-9 max-sm:pb-6">
			<div className="mx-auto max-w-175 text-center">
				<h1 className="text-[clamp(40px,6vw,76px)] font-medium leading-[1.03] tracking-[-0.04em]">
					<span className="text-primary">HTTP SECURITY, MADE VISIBLE</span>
				</h1>
				<p className="mx-auto mt-5 max-w-145 text-sm leading-6 text-muted-foreground">
					Check the security settings a website sends to your browser. You will
					get a score, a plain-language explanation, and practical next steps.
				</p>
			</div>
			<div className="mx-auto mt-8 grid max-w-190 border-y border-border sm:grid-cols-3">
				{[
					[
						"01",
						"Choose what to check",
						"Use a website address or paste response headers.",
					],
					[
						"02",
						"Run the check",
						"LODE compares the settings with common protections.",
					],
					[
						"03",
						"Read the next step",
						"Open any finding to see what it means and how to fix it.",
					],
				].map(([number, title, detail]) => (
					<div
						key={number}
						className="border-border py-4 sm:border-l sm:px-4 first:sm:border-l-0">
						<p className="text-[10px] tracking-[0.12em] text-primary">
							{number}
						</p>
						<p className="mt-2 text-xs font-medium">{title}</p>
						<p className="mt-1 text-xs leading-5 text-muted-foreground">
							{detail}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}

export { HeroSection };
