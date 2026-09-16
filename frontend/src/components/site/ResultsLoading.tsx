import { SpinnerGap } from "@phosphor-icons/react";

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

export { ResultsLoading };
