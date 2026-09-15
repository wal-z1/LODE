import os

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
	from .app.analyzer import analyze_headers, parse_raw_headers
	from .app.fetcher import fetch_headers
	from .app.models import AnalysisResponse, AnalysisSummary, AnalyzeRequest
	from .app.scoring import report_summary
except ImportError:
	from app.analyzer import analyze_headers, parse_raw_headers
	from app.fetcher import fetch_headers
	from app.models import AnalysisResponse, AnalysisSummary, AnalyzeRequest
	from app.scoring import report_summary

app = FastAPI()

frontend_origins = os.getenv("FRONTEND_ORIGINS", "*").split(",")

app.add_middleware(
	CORSMiddleware,
	allow_origins=[origin.strip() for origin in frontend_origins if origin.strip()],
	allow_methods=["GET", "POST"],
	allow_headers=["*"],
)


@app.get("/health")
async def health_check():
	return {"status": "ok"}


async def analyze_header_map(headers: dict, url: str | None) -> AnalysisResponse:
	findings = analyze_headers(headers)
	summary = AnalysisSummary(**report_summary(findings))

	return AnalysisResponse(
		url=url,
		score=summary.score,
		summary=summary,
		findings=findings,
	)


async def fetch_and_analyze(url: str) -> AnalysisResponse:
	try:
		headers = await fetch_headers(url)
	except ValueError as error:
		raise HTTPException(status_code=400, detail=str(error)) from error
	except httpx.TimeoutException as error:
		raise HTTPException(status_code=504, detail="The target URL timed out") from error
	except httpx.HTTPStatusError as error:
		raise HTTPException(
			status_code=502,
			detail=f"The target URL returned HTTP {error.response.status_code}",
		) from error
	except httpx.RequestError as error:
		raise HTTPException(status_code=502, detail="Could not reach the target URL") from error

	return await analyze_header_map(headers, url)


@app.get("/findings", response_model=AnalysisResponse)
async def get_findings(url: str):
	return await fetch_and_analyze(url)


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalyzeRequest):
	if (request.url is None) == (request.raw_headers is None):
		raise HTTPException(
			status_code=422,
			detail="Provide exactly one of 'url' or 'raw_headers'",
		)

	if request.url is not None:
		return await fetch_and_analyze(request.url)

	try:
		headers = parse_raw_headers(request.raw_headers or "")
	except ValueError as error:
		raise HTTPException(status_code=400, detail=str(error)) from error

	return await analyze_header_map(headers, None)

