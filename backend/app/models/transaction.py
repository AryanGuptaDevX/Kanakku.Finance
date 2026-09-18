from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False, index=True)  # "income" or "expense"
    amount = Column(Float, nullable=False)
    source_or_payee = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    description = Column(String, nullable=True)
    date = Column(Date, nullable=False, index=True)
    payment_method = Column(String, nullable=True, default="Cash")  # Cash, Bank Transfer, UPI, Credit Card, etc.
    is_recurring = Column(Boolean, default=False)
    recurring_id = Column(Integer, ForeignKey("recurring_transactions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="transactions")
    recurring_transaction = relationship("RecurringTransaction", back_populates="transactions")
