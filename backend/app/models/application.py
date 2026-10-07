import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base


class ApplicationStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    SHORTLISTED = "SHORTLISTED"
    IN_REVIEW = "IN_REVIEW"
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    SELECTED = "SELECTED"
    REJECTED = "REJECTED"


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "student_id", name="uq_job_student_application"),
    )

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    interview_date = Column(DateTime, nullable=True)
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    notes = Column(Text, nullable=True)

    job = relationship("Job", back_populates="applications")
    student = relationship("Student", back_populates="applications")

    def __repr__(self) -> str:
        return f"<Application id={self.id} job_id={self.job_id} student_id={self.student_id} status={self.status}>"
