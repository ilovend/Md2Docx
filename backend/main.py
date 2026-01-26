from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.api import routes

app = FastAPI(
    title="Md2Docx API",
    description="Backend service for Md2Docx desktop application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router - support both /api and /api/v1 prefixes
app.include_router(routes.router, prefix="/api")
app.include_router(routes.router, prefix="/api/v1")

@app.get("/health")
@app.get("/v1/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
