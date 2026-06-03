from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import newsletter

app = FastAPI(title="PersonalPage API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(newsletter.router)


@app.get("/health")
def health():
    return {"status": "ok"}
