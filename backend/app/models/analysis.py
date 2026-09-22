from sqlalchemy import Column, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Analysis(BaseModel):
    __tablename__ = "analyses"

    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    version_number = Column(String(20), default="1")
    
    # Analysis outputs
    profile_data = Column(JSON, nullable=True)
    quality_score = Column(Float, default=100.0)
    quality_issues = Column(JSON, nullable=True)
    statistics = Column(JSON, nullable=True)
    eda_results = Column(JSON, nullable=True)
    correlations = Column(JSON, nullable=True)
    outliers = Column(JSON, nullable=True)
    ai_insights = Column(JSON, nullable=True)
    
    dataset = relationship("Dataset", back_populates="analyses")
