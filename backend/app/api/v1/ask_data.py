import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.dataset import Dataset
from app.models.conversation import Conversation, Message
from app.schemas.ask_data import AskDataRequest, AskDataResponse, ConversationResponse, MessageResponse, QueryStep
from app.schemas.chart import ChartConfig
from app.data_processing.parser import parse_dataset_file
from app.sandbox.executor import process_ask_data_query

router = APIRouter(prefix="/ask-data", tags=["Ask Your Data"])

@router.post("", response_model=AskDataResponse)
def ask_data(payload: AskDataRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == payload.dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    # Get or create conversation
    conv = None
    if payload.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == payload.conversation_id, 
            Conversation.user_id == user_id
        ).first()
        
    if not conv:
        conv = Conversation(
            dataset_id=ds.id,
            user_id=user_id,
            title=payload.question[:60]
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        
    # Save user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=payload.question
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)
    
    # Retrieve previous conversation history for multi-turn pronoun resolution
    prev_messages = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.id != user_msg.id
    ).order_by(Message.created_at.asc()).all()
    history = [
        {
            "role": m.role,
            "content": m.content,
            "query_code": m.query_code,
            "result_data": m.result_data
        }
        for m in prev_messages
    ]
    
    # Process analytical query with conversational memory
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    query_result = process_ask_data_query(df, payload.question, history)
    
    # Save assistant message
    asst_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=query_result["answer_text"],
        query_code=query_result.get("executed_code"),
        result_data=query_result.get("tabular_result"),
        chart_config=query_result.get("chart_config")
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)
    
    chart_cfg = None
    if query_result.get("chart_config"):
        chart_cfg = ChartConfig(**query_result["chart_config"])
        
    steps = [QueryStep(**s) for s in query_result.get("analysis_steps", [])]
    
    return AskDataResponse(
        conversation_id=conv.id,
        message_id=asst_msg.id,
        question=payload.question,
        answer_text=query_result["answer_text"],
        confidence_score=query_result.get("confidence_score", 0.9),
        analysis_steps=steps,
        executed_code=query_result.get("executed_code"),
        tabular_result=query_result.get("tabular_result"),
        result_columns=query_result.get("result_columns"),
        chart_config=chart_cfg,
        suggestions=query_result.get("suggestions", []),
        queried_columns=query_result.get("queried_columns", []),
        filter_explanation=query_result.get("filter_explanation"),
        calculation_details=query_result.get("calculation_details")
    )

@router.get("/conversations/{dataset_id}", response_model=List[ConversationResponse])
def get_conversations(dataset_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    convs = db.query(Conversation).filter(
        Conversation.dataset_id == dataset_id,
        Conversation.user_id == user_id
    ).order_by(Conversation.created_at.desc()).all()
    
    results = []
    for c in convs:
        msgs = [
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                query_code=m.query_code,
                result_data=m.result_data,
                chart_config=m.chart_config,
                created_at=m.created_at
            )
            for m in c.messages
        ]
        results.append(ConversationResponse(
            id=c.id,
            dataset_id=c.dataset_id,
            title=c.title,
            messages=msgs,
            created_at=c.created_at
        ))
    return results
