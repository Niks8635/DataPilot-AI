from sqlalchemy import Column, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Dashboard(BaseModel):
    __tablename__ = "dashboards"

    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    is_default = Column(Boolean, default=False)
    layout_config = Column(JSON, nullable=True)
    
    dataset = relationship("Dataset", back_populates="dashboards")
    widgets = relationship("DashboardWidget", back_populates="dashboard", cascade="all, delete-orphan")

class DashboardWidget(BaseModel):
    __tablename__ = "dashboard_widgets"

    dashboard_id = Column(String(36), ForeignKey("dashboards.id"), nullable=False, index=True)
    widget_type = Column(String(50), nullable=False)  # kpi, bar, line, pie, scatter, heatmap, table
    title = Column(String(255), nullable=False)
    chart_config = Column(JSON, nullable=False)
    grid_position = Column(JSON, nullable=True)
    
    dashboard = relationship("Dashboard", back_populates="widgets")
