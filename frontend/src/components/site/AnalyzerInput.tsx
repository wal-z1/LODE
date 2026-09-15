import { useState, type FormEvent } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnalysisMode } from "@/lib/types";

const RAW_HEADERS_EXAMPLE = `Content-Type: text/html
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'`;

interface AnalyzerInputProps {
	loading: boolean;
	onSubmit: (mode: AnalysisMode, value: string) => void;
}

function AnalyzerInput({ loading, onSubmit }: AnalyzerInputProps) {
	const [mode, setMode] = useState<AnalysisMode>("url");
	const [value, setValue] = useState("");
	const [scheme, setScheme] = useState<"http" | "https">("https");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const input = value.trim();
		const url = input.replace(/^https?:\/\//i, "");
		onSubmit(mode, mode === "url" ? `${scheme}://${url}` : input);
	}

	return (
		<form onSubmit={handleSubmit} className="mx-auto mt-4 w-full max-w-190">
			<div className="mb-4">
				<p className="text-xs font-medium uppercase tracking-[0.12em]">
					Start a check
				</p>
				<p className="mt-1 text-xs leading-5 text-muted-foreground">
					Enter a public website to fetch its settings, or paste headers from a
					response you already have.
				</p>
			</div>
			<div className="mb-3 flex border-b border-border">
				{(["url", "raw_headers"] as const).map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => {
							setMode(option);
							setValue(option === "raw_headers" ? RAW_HEADERS_EXAMPLE : "");
						}}
						aria-selected={mode === option}
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
					<>
						<select
							value={scheme}
							onChange={(event) =>
								setScheme(event.target.value as "http" | "https")
							}
							aria-label="URL scheme"
							disabled={loading}
							className="h-9 border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50">
							<option value="https">https://</option>
							<option value="http">http://</option>
						</select>
						<Input
							value={value}
							onChange={(event) => setValue(event.target.value)}
							type="text"
							placeholder="example.com"
							aria-label="Website address"
							disabled={loading}
							className="h-9 flex-1"
						/>
					</>
				) : (
					<textarea
						value={value}
						onChange={(event) => setValue(event.target.value)}
						aria-label="Raw response headers"
						disabled={loading}
						className="min-h-24 flex-1 resize-y border border-input bg-transparent px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
					/>
				)}
				<Button type="submit" disabled={loading || !value} className="h-9">
					{loading ? <SpinnerGap className="animate-spin" /> : null}
					{loading ? "CHECKING" : "CHECK SECURITY"}
				</Button>
			</div>
			<p className="mt-3 text-xs leading-5 text-muted-foreground">
				{mode === "url"
					? "Tip: HTTPS is recommended because it protects the connection while LODE checks the site."
					: "Headers are short lines in the form: setting name: setting value. The example can be replaced."}
			</p>
		</form>
	);
}

export { AnalyzerInput };
