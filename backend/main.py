from fastapi import FastAPI
import httpx
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "You have just accessed the root"}


