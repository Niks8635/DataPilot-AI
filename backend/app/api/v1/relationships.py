from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.dataset import Dataset
from app.data_processing.parser import parse_dataset_file
from app.analysis.relationships import detect_relationships

router = APIRouter(prefix="/relationships", tags=["Relationships"])

@router.get("", response_model=List[Dict[str, Any]])
def get_dataset_relationships(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    datasets = db.query(Dataset).filter(Dataset.user_id == user_id).all()
    if len(datasets) < 2:
        return []
        
    ds_objects = []
    for ds in datasets:
        try:
            df = parse_dataset_file(ds.current_file_path, ds.original_filename)
            ds_objects.append({
                "id": ds.id,
                "name": ds.name,
                "df": df
            })
        except Exception:
            continue
            
    return detect_relationships(ds_objects)
