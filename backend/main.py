from fastapi import FastAPI
import httpx
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "You have just accessed the root"}

@app.get("/message/{message}")
async def get_message(message: str):
    return {"message": message}
