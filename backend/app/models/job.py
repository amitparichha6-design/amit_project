from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    role_category = Column(String(100), nullable=True)
    salary_package = Column(String(100), nullable=True)
    job_location = Column(String(150), nullable=True)
    job_type = Column(String(50), default="Full-Time", nullable=False)
    application_deadline = Column(DateTime, nullable=True)
    required_skills = Column(Text, nullable=True, default='["Python", "Problem Solving", "Web Development"]')
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    company = relationship("Company", back_populates="jobs")
    drive = relationship("PlacementDrive", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    eligibility_criteria = relationship("EligibilityCriteria", back_populates="job", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Job id={self.id} title={self.title} company_id={self.company_id} active={self.is_active}>"
