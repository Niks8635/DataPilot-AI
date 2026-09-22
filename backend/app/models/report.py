from sqlalchemy import Column, String, ForeignKey, JSON, Text
from app.models.base import BaseModel

class Report(BaseModel):
    __tablename__ = "reports"

    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(JSON, nullable=False)  # Structured report sections
    html_content = Column(Text, nullable=True)
    format = Column(String(20), default="html")  # html, pdf, json

class Project(BaseModel):
    __tablename__ = "projects"

    user_id = Column(String(36), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
