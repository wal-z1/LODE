
import httpx
import asyncio

async  def test_root():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8000/")
        print("hello world")

async def main():
    await test_root()

asyncio.run(main())
