from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., description="bank, cash, credit_card, or wallet")
    initial_balance: float = Field(0.0)
    color: Optional[str] = Field("#2563eb")
    is_default: Optional[bool] = False

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    initial_balance: Optional[float] = None
    color: Optional[str] = None
    is_default: Optional[bool] = None

class AccountResponse(AccountBase):
    id: int
    current_balance: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
