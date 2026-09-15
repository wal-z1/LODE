import { useState, type FormEvent } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnalysisMode } from "@/lib/types";

interface AnalyzerInputProps {
	loading: boolean;
	onSubmit: (mode: AnalysisMode, value: string) => void;
}

function AnalyzerInput({ loading, onSubmit }: AnalyzerInputProps) {
	const [mode, setMode] = useState<AnalysisMode>("url");
	const [value, setValue] = useState("");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		onSubmit(mode, value.trim());
	}

	return (
		<form onSubmit={handleSubmit} className="mx-auto mt-4 w-full max-w-190">
			<div className="mb-3 flex border-b border-border">
				{(["url", "raw_headers"] as const).map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => {
							setMode(option);
							setValue("");
						}}
						className={`border-b-2 px-2.5 py-2 text-xs uppercase tracking-[0.12em] transition-colors ${
							mode === option
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}>
						{option === "url" ? "URL" : "RAW HEADERS"}
					</button>
				))}
			</div>

			<div className="flex flex-col gap-2 sm:flex-row">
				{mode === "url" ? (
					<Input
						value={value}
						onChange={(event) => setValue(event.target.value)}
						type="url"
						placeholder="https://example.com"
						aria-label="Website URL"
						disabled={loading}
						className="h-9 flex-1"
					/>
				) : (
					<textarea
						value={value}
						onChange={(event) => setValue(event.target.value)}
						placeholder="HTTP/1.1 200 OK\nContent-Security-Policy: default-src 'self'"
						aria-label="Raw response headers"
						disabled={loading}
						className="min-h-24 flex-1 resize-y border border-input bg-transparent px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
					/>
				)}
				<Button type="submit" disabled={loading || !value} className="h-9">
					{loading ? <SpinnerGap className="animate-spin" /> : null}
					{loading ? "ANALYZING" : "ANALYZE"}
				</Button>
			</div>
		</form>
	);
}

export { AnalyzerInput };
