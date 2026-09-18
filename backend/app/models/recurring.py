from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "income" or "expense"
    amount = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    frequency = Column(String, nullable=False)  # "monthly", "weekly", "yearly"
    day_of_month = Column(Integer, nullable=True, default=1)
    day_of_week = Column(Integer, nullable=True)  # 0=Monday, 6=Sunday
    month_of_year = Column(Integer, nullable=True)  # 1-12
    last_processed_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="recurring_transactions")
    transactions = relationship("Transaction", back_populates="recurring_transaction")
