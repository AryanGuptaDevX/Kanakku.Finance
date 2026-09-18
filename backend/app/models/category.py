from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)  # "income" or "expense"
    icon = Column(String, nullable=True, default="tag")
    color = Column(String, nullable=True, default="#64748b")
    is_default = Column(Boolean, default=False)

    transactions = relationship("Transaction", back_populates="category", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="category", cascade="all, delete-orphan")
    recurring_transactions = relationship("RecurringTransaction", back_populates="category")
