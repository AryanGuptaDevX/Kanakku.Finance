from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from datetime import datetime
from backend.app.database import Base

class SIPInvestment(Base):
    __tablename__ = "sip_investments"

    id = Column(Integer, primary_key=True, index=True)
    fund_name = Column(String, nullable=False)
    monthly_amount = Column(Float, nullable=False)
    start_date = Column(Date, nullable=False)
    total_invested = Column(Float, nullable=False)
    current_value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
