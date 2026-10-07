from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base


class EligibilityCriteria(Base):
    __tablename__ = "eligibility_criteria"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id", ondelete="CASCADE"), unique=True, nullable=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=True, index=True)

    min_cgpa = Column(Float, default=6.0, nullable=False)
    max_backlogs = Column(Integer, default=0, nullable=False)
    # Stored as JSON string list of branch names e.g. '["Computer Science", "Information Technology"]'
    eligible_branches = Column(Text, nullable=False, default='["Computer Science", "Information Technology", "Electronics"]')
    eligible_batch = Column(Integer, nullable=False, default=2026)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    placement_drive = relationship("PlacementDrive", back_populates="eligibility_criteria")
    job = relationship("Job", back_populates="eligibility_criteria")

    def __repr__(self) -> str:
        return f"<EligibilityCriteria id={self.id} min_cgpa={self.min_cgpa} max_backlogs={self.max_backlogs} batch={self.eligible_batch}>"
