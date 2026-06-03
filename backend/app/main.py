import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import newsletter

app = FastAPI(title="PersonalPage API", version="1.0.0")

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(newsletter.router)


@app.get("/health")
def health():
    return {"status": "ok"}
