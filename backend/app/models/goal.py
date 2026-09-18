from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime
from datetime import datetime
from backend.app.database import Base

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    goal_name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_savings = Column(Float, nullable=False, default=0.0)
    target_date = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
