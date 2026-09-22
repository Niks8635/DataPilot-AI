import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("datapilot")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing DataPilot AI database models...")
    init_db()
    logger.info("DataPilot AI successfully started!")
    yield
    # Shutdown
    logger.info("Shutting down DataPilot AI...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Your data. Your questions. AI-powered answers. Professional end-to-end automated data analytics platform.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler: User-friendly responses, never raw stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "ProcessingError",
            "message": "We couldn't complete this analytical operation. Please verify the dataset structure and try again.",
            "detail": str(exc) if not isinstance(exc, AssertionError) else "Validation check failed."
        }
    )

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
