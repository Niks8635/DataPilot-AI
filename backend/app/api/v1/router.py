from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.dashboards import router as dashboards_router
from app.api.v1.ask_data import router as ask_data_router
from app.api.v1.reports import router as reports_router
from app.api.v1.relationships import router as relationships_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(datasets_router)
api_router.include_router(analysis_router)
api_router.include_router(dashboards_router)
api_router.include_router(ask_data_router)
api_router.include_router(reports_router)
api_router.include_router(relationships_router)
