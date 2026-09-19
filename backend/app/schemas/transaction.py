from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from datetime import date as date_type, datetime
from typing import Optional
from backend.app.schemas.category import CategoryResponse
from backend.app.schemas.account import AccountResponse

class TransactionBase(BaseModel):
    type: str = Field(..., pattern="^(income|expense|transfer)$")
    amount: float = Field(..., gt=0, description="Amount must be greater than zero")
    source_or_payee: str = Field(..., min_length=1, max_length=200)
    category_id: Optional[int] = None
    account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    description: Optional[str] = None
    date: date_type
    payment_method: Optional[str] = "Cash"
    is_recurring: Optional[bool] = False
    recurring_id: Optional[int] = None

    @field_validator("amount")
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return round(v, 2)

    @model_validator(mode="after")
    def validate_type_fields(self):
        if self.type in ("income", "expense") and self.category_id is None:
            raise ValueError("Category is required for income and expense transactions")
        if self.type == "transfer":
            if self.account_id is not None and self.to_account_id is not None and self.account_id == self.to_account_id:
                raise ValueError("Source account and destination account cannot be the same for a transfer")
        return self

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    source_or_payee: Optional[str] = None
    category_id: Optional[int] = None
    account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    description: Optional[str] = None
    date: Optional[date_type] = None
    payment_method: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime
    category: Optional[CategoryResponse] = None
    account: Optional[AccountResponse] = None
    to_account: Optional[AccountResponse] = None

    model_config = ConfigDict(from_attributes=True)
