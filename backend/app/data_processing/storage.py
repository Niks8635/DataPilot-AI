import os
import shutil
import uuid
from typing import Tuple
import pandas as pd
from app.core.config import settings

def save_upload_file(file_content: bytes, original_filename: str) -> Tuple[str, str, int]:
    file_id = str(uuid.uuid4())
    _, ext = os.path.splitext(original_filename)
    safe_filename = f"{file_id}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    with open(dest_path, "wb") as f:
        f.write(file_content)
        
    file_size = len(file_content)
    return dest_path, safe_filename, file_size

def save_dataframe_as_csv(df: pd.DataFrame, dataset_id: str, version_num: int) -> str:
    filename = f"{dataset_id}_v{version_num}.csv"
    dest_path = os.path.join(settings.UPLOAD_DIR, filename)
    df.to_csv(dest_path, index=False)
    return dest_path
