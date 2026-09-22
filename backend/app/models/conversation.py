from sqlalchemy import Column, String, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Conversation(BaseModel):
    __tablename__ = "conversations"

    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    title = Column(String(255), default="New Analysis Session")
    
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(BaseModel):
    __tablename__ = "messages"

    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    query_code = Column(Text, nullable=True)
    result_data = Column(JSON, nullable=True)
    chart_config = Column(JSON, nullable=True)
    
    conversation = relationship("Conversation", back_populates="messages")
