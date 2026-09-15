import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.analyzer import analyze_headers
from app.fetcher import fetch_headers
from app.scoring import report_summary

app = FastAPI()

app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
	allow_methods=["GET"],
	allow_headers=["*"],
)


@app.get("/health")
async def health_check():
	return {"status": "ok"}


@app.get("/findings")
async def get_findings(url: str):
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

	findings = analyze_headers(headers)
	summary = report_summary(findings)

	return {
		"url": url,
		"score": summary["score"],
		"summary": summary,
		"findings": findings,
	}

