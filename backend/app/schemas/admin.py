from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AdminBase(BaseModel):
    full_name: str
    designation: Optional[str] = None
    phone: Optional[str] = None


class AdminCreate(AdminBase):
    pass


class AdminResponse(AdminBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
