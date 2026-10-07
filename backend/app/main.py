from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import init_db, SessionLocal
from app.database.seed import seed_demo_users_if_empty
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.admin import router as admin_router
from app.routers.student import router as student_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: automatically create database directory & SQLite tables
    init_db()
    db = SessionLocal()
    try:
        seed_demo_users_if_empty(db)
    finally:
        db.close()
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "CAMPUSHIRE – College Placement Management System API\n\n"
        "Features:\n"
        "- Self-contained SQLite database with auto-creation\n"
        "- Secure registration and login with bcrypt password hashing\n"
        "- JWT Authentication & Role-based Authorization (ADMIN, STUDENT, COMPANY)\n"
        "- Complete Admin / TPO Placement Officer Management Suite\n"
        "- Real SQLite Criteria, Drives, Applications, and Audit Trail\n"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(student_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health Check"])
def root():
    return {
        "system": settings.PROJECT_NAME,
        "phase": "Phase 1 Foundation",
        "status": "online",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }


@app.get("/health", tags=["Health Check"])
def health_check():
    return {
        "status": "healthy",
        "database": "SQLite (campushire.db)",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
