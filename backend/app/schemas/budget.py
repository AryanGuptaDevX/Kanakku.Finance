from pydantic import BaseModel, Field
from typing import Optional
from backend.app.schemas.category import CategoryResponse

class BudgetBase(BaseModel):
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")  # YYYY-MM
    category_id: Optional[int] = None  # None for total monthly budget
    amount: float = Field(..., gt=0)

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount: float = Field(..., gt=0)

class BudgetResponse(BudgetBase):
    id: int
    category: Optional[CategoryResponse] = None
    spent: float = 0.0
    remaining: float = 0.0
    percentage: float = 0.0

    class Config:
        from_attributes = True
