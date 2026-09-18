from pydantic import BaseModel, Field
from datetime import date as date_type, datetime
from typing import Optional
from backend.app.schemas.category import CategoryResponse

class RecurringBase(BaseModel):
    title: str = Field(..., min_length=1)
    type: str = Field(..., pattern="^(income|expense)$")
    amount: float = Field(..., gt=0)
    category_id: int
    frequency: str = Field(..., pattern="^(weekly|monthly|yearly)$")
    day_of_month: Optional[int] = Field(default=1, ge=1, le=31)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    month_of_year: Optional[int] = Field(default=None, ge=1, le=12)
    is_active: Optional[bool] = True

class RecurringCreate(RecurringBase):
    pass

class RecurringUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category_id: Optional[int] = None
    frequency: Optional[str] = None
    day_of_month: Optional[int] = None
    is_active: Optional[bool] = None

class RecurringResponse(RecurringBase):
    id: int
    last_processed_date: Optional[date_type] = None
    created_at: datetime
    category: CategoryResponse

    class Config:
        from_attributes = True
