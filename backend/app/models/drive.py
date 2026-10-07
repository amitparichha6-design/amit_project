from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base


class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    drive_date = Column(DateTime, nullable=False)
    venue = Column(String(255), nullable=False)
    selection_rounds = Column(Text, nullable=True, default='["Online Test", "Technical Interview", "HR Round"]')
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    company = relationship("Company", back_populates="placement_drives")
    eligibility_criteria = relationship("EligibilityCriteria", back_populates="placement_drive", uselist=False, cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="drive", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<PlacementDrive id={self.id} title={self.title} active={self.is_active}>"
