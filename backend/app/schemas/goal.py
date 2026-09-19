from pydantic import BaseModel, Field, ConfigDict
from datetime import date as date_type, datetime
from typing import Optional

class SavingsGoalBase(BaseModel):
    goal_name: str = Field(..., min_length=1)
    target_amount: float = Field(..., gt=0)
    current_savings: float = Field(default=0.0, ge=0)
    target_date: date_type
    description: Optional[str] = None

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(BaseModel):
    goal_name: Optional[str] = None
    target_amount: Optional[float] = None
    current_savings: Optional[float] = None
    target_date: Optional[date_type] = None
    description: Optional[str] = None

class SavingsGoalTopUp(BaseModel):
    amount: float = Field(..., gt=0)
    create_transaction: bool = True

class SavingsGoalResponse(SavingsGoalBase):
    id: int
    is_completed: bool
    created_at: datetime
    
    # Calculated metrics
    remaining_amount: float
    progress_percentage: float

    model_config = ConfigDict(from_attributes=True)
