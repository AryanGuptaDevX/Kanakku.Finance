from pydantic import BaseModel, Field, model_validator, ConfigDict
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
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    is_active: Optional[bool] = True

    @model_validator(mode="after")
    def validate_frequency_fields(self):
        if self.frequency == "weekly" and self.day_of_week is None:
            raise ValueError("Weekly recurring schedules require day_of_week (0=Monday to 6=Sunday)")
        if self.frequency == "monthly" and self.day_of_month is None:
            raise ValueError("Monthly recurring schedules require day_of_month (1-31)")
        if self.frequency == "yearly":
            if self.month_of_year is None or self.day_of_month is None:
                raise ValueError("Yearly recurring schedules require month_of_year (1-12) and day_of_month (1-31)")
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self

class RecurringCreate(RecurringBase):
    pass

class RecurringUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category_id: Optional[int] = None
    frequency: Optional[str] = None
    day_of_month: Optional[int] = None
    day_of_week: Optional[int] = None
    month_of_year: Optional[int] = None
    start_date: Optional[date_type] = None
    end_date: Optional[date_type] = None
    is_active: Optional[bool] = None

class RecurringResponse(RecurringBase):
    id: int
    last_processed_date: Optional[date_type] = None
    created_at: datetime
    category: CategoryResponse

    model_config = ConfigDict(from_attributes=True)
