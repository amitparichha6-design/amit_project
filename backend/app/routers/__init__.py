"""Routers package."""
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.admin import router as admin_router
from app.routers.student import router as student_router

__all__ = ["auth_router", "dashboard_router", "admin_router", "student_router"]
