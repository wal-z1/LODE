from fastapi import FastAPI
from pydantic import BaseModel
from app.routes.analyze import router as analyze_router

app = FastAPI()
app.include_router(analyze_router)


@app.get("/")
async def root():
	return {"message": "You have just accessed the root"}


@app.get("/message/{message}")
async def get_message(message: str):
	return {"message": message}


@app.get("/query/")
async def query_params(p1: str, p2: int):
	return {"param1": p1, "param2": p2}


class Userdata(BaseModel):
	name: str
	age: int


@app.post("/post/")
async def post_message(data: Userdata):
	return {
		"response": True,
		"data": data,
	}
