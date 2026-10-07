from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from app.database.session import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    roll_number = Column(String(50), unique=True, index=True, nullable=True)
    department = Column(String(100), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    cgpa = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    phone = Column(String(20), nullable=True)
    bio = Column(Text, nullable=True)

    # Detailed Student Profile fields
    skills = Column(Text, nullable=True, default='[]')
    projects = Column(Text, nullable=True, default='[]')
    certifications = Column(Text, nullable=True, default='[]')
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    resume_url = Column(String(255), nullable=True)

    # Student Management & Academic Profile Verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    backlogs = Column(Integer, default=0, nullable=False)

    # Placement Status Tracking
    is_placed = Column(Boolean, default=False, nullable=False)
    placed_company_name = Column(String(150), nullable=True)
    placed_package = Column(String(50), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="student_profile")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Student id={self.id} roll_number={self.roll_number} verified={self.is_verified} placed={self.is_placed}>"
