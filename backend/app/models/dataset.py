from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Dataset(BaseModel):
    __tablename__ = "datasets"

    user_id = Column(String(36), index=True, nullable=False)
    project_id = Column(String(36), index=True, nullable=True)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # csv, xlsx, xls, json, parquet
    file_path = Column(String(500), nullable=False)
    current_file_path = Column(String(500), nullable=False)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    file_size_bytes = Column(Integer, default=0)
    status = Column(String(50), default="ready")  # uploading, parsing, profiling, ready, error
    current_version = Column(Integer, default=1)
    
    # Relationships
    versions = relationship("DatasetVersion", back_populates="dataset", cascade="all, delete-orphan")
    cleaning_operations = relationship("CleaningOperation", back_populates="dataset", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="dataset", cascade="all, delete-orphan")
    dashboards = relationship("Dashboard", back_populates="dataset", cascade="all, delete-orphan")

class DatasetVersion(BaseModel):
    __tablename__ = "dataset_versions"

    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    description = Column(String(500), nullable=True)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    
    dataset = relationship("Dataset", back_populates="versions")

class CleaningOperation(BaseModel):
    __tablename__ = "cleaning_operations"

    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    version_id = Column(String(36), ForeignKey("dataset_versions.id"), nullable=True)
    operation_type = Column(String(100), nullable=False)
    parameters = Column(JSON, nullable=True)
    summary = Column(String(500), nullable=False)
    affected_rows = Column(Integer, default=0)
    
    dataset = relationship("Dataset", back_populates="cleaning_operations")
