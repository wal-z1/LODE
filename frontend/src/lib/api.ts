import type { AnalyzePayload, AnalysisResponse } from "@/lib/types";

const apiUrl = import.meta.env.VITE_API_URL;

function getErrorMessage(value: unknown): string | null {
	if (typeof value !== "object" || value === null || !("detail" in value)) {
		return null;
	}

	const detail = value.detail;
	return typeof detail === "string" ? detail : null;
}

async function analyze(payload: AnalyzePayload): Promise<AnalysisResponse> {
	if (!apiUrl) {
		throw new Error("The API URL is not configured.");
	}

	try {
		const response = await fetch(`${apiUrl}/analyze`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const body: unknown = await response.json();
		if (!response.ok) {
			throw new Error(getErrorMessage(body) ?? "The analysis request failed.");
		}

		return body as AnalysisResponse;
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}

		throw new Error("Could not connect to the analysis service.");
	}
}

export { analyze };
