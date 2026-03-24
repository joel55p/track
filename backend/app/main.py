from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import assets, attendance, auth, supervision, tasks
from app.database import Base, engine

app = FastAPI(title="Teleprogreso Track API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(assets.router, prefix="/api")
app.include_router(supervision.router, prefix="/api")


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}
