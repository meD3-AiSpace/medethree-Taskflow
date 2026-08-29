from typing import List, Optional, Any
from pydantic import BaseModel, Field

class Preferences(BaseModel):
    theme: str
    notifications_enabled: bool
    language: str

class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    score: float
    roles: List[str]
    preferences: Preferences
    metadata: Optional[Any] = None
