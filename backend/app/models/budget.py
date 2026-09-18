from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, nullable=False, index=True)  # YYYY-MM
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)  # Nullable for overall total budget
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="budgets")
