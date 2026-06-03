from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid


class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscriberResponse(BaseModel):
    id: uuid.UUID
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
