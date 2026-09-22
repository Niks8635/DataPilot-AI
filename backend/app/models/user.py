from sqlalchemy import Column, String, Boolean
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    organization = Column(String(255), nullable=True, default="DataPilot Enterprise")
    role = Column(String(255), nullable=True, default="Principal Data Analyst")
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
