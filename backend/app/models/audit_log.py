from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    admin_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    target_entity = Column(String(50), nullable=False, index=True)
    target_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    admin = relationship("User")

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action} entity={self.target_entity} target_id={self.target_id}>"
