from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime
from datetime import datetime
from backend.app.database import Base

class EMI(Base):
    __tablename__ = "emis"

    id = Column(Integer, primary_key=True, index=True)
    loan_name = Column(String, nullable=False)
    principal_amount = Column(Float, nullable=False)
    monthly_payment = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)  # Annual interest rate %
    start_date = Column(Date, nullable=False)
    due_day = Column(Integer, nullable=False, default=1)  # Day of month (1-31)
    total_payments = Column(Integer, nullable=False)
    payments_made = Column(Integer, nullable=False, default=0)
    remaining_amount = Column(Float, nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
