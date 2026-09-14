from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/analyze", tags=["analyze"])

@router.get("/")
async def analyze_root():
    return {"message": "You have just accessed the analyze root"}
