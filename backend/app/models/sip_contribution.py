from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class SIPContribution(Base):
    __tablename__ = "sip_contributions"

    id = Column(Integer, primary_key=True, index=True)
    sip_id = Column(Integer, ForeignKey("sip_investments.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sip = relationship("SIPInvestment", back_populates="contributions")
