import { useRef, useState } from "react";
import { HeroSection } from "@/components/site/HeroSection";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AnalyzerInput } from "@/components/site/AnalyzerInput";
import { ResultsLoading, ResultsPanel } from "@/components/site/ResultsPanel";
import { analyze } from "@/lib/api";
import type { AnalysisMode, AnalysisResponse } from "@/lib/types";

function App() {
	const [isLight, setIsLight] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<AnalysisResponse | null>(null);
	const resultsRef = useRef<HTMLDivElement>(null);

	function toggleTheme() {
		setIsLight((current) => !current);
	}

	async function handleAnalyze(mode: AnalysisMode, value: string) {
		if (!value) {
			setError(
				mode === "url"
					? "Enter a URL to analyze."
					: "Paste response headers to analyze.",
			);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await analyze(
				mode === "url" ? { url: value } : { raw_headers: value },
			);
			setResult(response);
			window.requestAnimationFrame(() =>
				resultsRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				}),
			);
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "The analysis request failed.",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div
			className={`${isLight ? "light" : ""} min-h-screen bg-background text-foreground transition-colors duration-200`}>
			<SiteHeader isLight={isLight} onToggleTheme={toggleTheme} />

			<main
				id="top"
				className="mx-auto w-[calc(100%-48px)] max-w-280 pt-26 max-sm:w-[calc(100%-32px)] max-sm:pt-18">
				<HeroSection />
				<AnalyzerInput loading={loading} onSubmit={handleAnalyze} />
				{error ? (
					<p
						role="alert"
						className="mx-auto mt-3 max-w-190 border border-destructive/50 px-3 py-2 text-xs text-destructive">
						{error}
					</p>
				) : null}
				{loading || result ? (
					<div ref={resultsRef}>
						{loading ? <ResultsLoading /> : null}
						{!loading && result ? <ResultsPanel result={result} /> : null}
					</div>
				) : null}
			</main>
			<SiteFooter />
		</div>
	);
}

export default App;
