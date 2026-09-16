import {
	useState,
	type FocusEvent,
	type FormEvent,
} from "react";
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
	onActiveChange: (active: boolean) => void;
}

function AnalyzerInput({
	loading,
	onSubmit,
	onActiveChange,
}: AnalyzerInputProps) {
	const [mode, setMode] = useState<AnalysisMode>("url");
	const [value, setValue] = useState("");
	const [scheme, setScheme] = useState<"http" | "https">("https");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const input = value.trim();

		if (mode === "raw_headers") {
			onSubmit(mode, input);
			return;
		}

		const url = input.replace(/^https?:\/\//i, "");
		onSubmit(mode, `${scheme}://${url}`);
	}

	function handleBlur(event: FocusEvent<HTMLFormElement>) {
		const nextTarget = event.relatedTarget as Node | null;

		if (!event.currentTarget.contains(nextTarget)) {
			onActiveChange(false);
		}
	}

	function changeMode(nextMode: AnalysisMode) {
		setMode(nextMode);
		setValue(nextMode === "raw_headers" ? RAW_HEADERS_EXAMPLE : "");
	}

	return (
		<form
			onSubmit={handleSubmit}
			onFocusCapture={() => onActiveChange(true)}
			onBlurCapture={handleBlur}
			className="mx-auto w-full max-w-190">
			<div className="mb-2 flex border-b border-border">
				{(["url", "raw_headers"] as const).map((option) => (
					<button
						key={option}
						type="button"
						onClick={() => changeMode(option)}
						aria-pressed={mode === option}
						className={`border-b-2 px-2.5 py-2 text-[10px] uppercase tracking-[0.12em] transition-colors ${
							mode === option
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}>
						{option === "url" ? "Website" : "Raw headers"}
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
							className="h-10 border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50">
							<option value="https">https://</option>
							<option value="http">http://</option>
						</select>

						<Input
							value={value}
							onChange={(event) => setValue(event.target.value)}
							type="text"
							inputMode="url"
							autoComplete="url"
							placeholder="example.com"
							aria-label="Website address"
							disabled={loading}
							className="h-10 min-w-0 flex-1"
						/>
					</>
				) : (
					<textarea
						value={value}
						onChange={(event) => setValue(event.target.value)}
						aria-label="Raw response headers"
						disabled={loading}
						className="min-h-24 flex-1 resize-y border border-input bg-transparent px-2.5 py-2 font-mono text-xs leading-5 text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
					/>
				)}

				<Button
					type="submit"
					disabled={loading || !value.trim()}
					className="h-10 shrink-0">
					{loading ? <SpinnerGap className="animate-spin" /> : null}
					{loading ? "CHECKING" : "CHECK HEADERS"}
				</Button>
			</div>

			<div className="mt-2 flex flex-wrap items-center gap-x-2 text-[10px] leading-5 text-muted-foreground">
				<span>Checks HTTP response configuration only.</span>
				<span className="hidden sm:inline">·</span>
				<span>
					Does not determine whether a website, link, or downloaded content is
					malicious.
				</span>
			</div>
		</form>
	);
}

export { AnalyzerInput };