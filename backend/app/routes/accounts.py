from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as date_type

from backend.app.database import get_db
from backend.app.models.account import Account
from backend.app.models.transaction import Transaction
from backend.app.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from backend.app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/api/accounts", tags=["Accounts & Wallets"])

def ensure_default_accounts(db: Session):
    count = db.query(Account).count()
    if count == 0:
        bank = Account(name="Primary Bank", type="bank", initial_balance=10000.0, current_balance=10000.0, color="#2563eb", is_default=True)
        cash = Account(name="Cash Wallet", type="cash", initial_balance=2000.0, current_balance=2000.0, color="#16a34a", is_default=False)
        db.add_all([bank, cash])
        db.commit()

@router.get("", response_model=List[AccountResponse])
def get_accounts(db: Session = Depends(get_db)):
    ensure_default_accounts(db)
    return db.query(Account).order_by(Account.id.asc()).all()

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(account_in: AccountCreate, db: Session = Depends(get_db)):
    account = Account(
        name=account_in.name,
        type=account_in.type,
        initial_balance=account_in.initial_balance,
        current_balance=account_in.initial_balance,
        color=account_in.color or "#2563eb",
        is_default=account_in.is_default or False
    )
    if account.is_default:
        db.query(Account).update({Account.is_default: False})
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, account_in: AccountUpdate, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    update_data = account_in.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        db.query(Account).filter(Account.id != account_id).update({Account.is_default: False})

    if "initial_balance" in update_data and update_data["initial_balance"] != account.initial_balance:
        diff = update_data["initial_balance"] - account.initial_balance
        account.current_balance += diff

    for field, val in update_data.items():
        setattr(account, field, val)

    db.commit()
    db.refresh(account)
    return account

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    linked = db.query(Transaction).filter((Transaction.account_id == account_id) | (Transaction.to_account_id == account_id)).first()
    if linked:
        raise HTTPException(status_code=400, detail="Cannot delete account with existing transaction history")

    db.delete(account)
    db.commit()
    return None

@router.post("/transfer", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def transfer_funds(
    from_account_id: int,
    to_account_id: int,
    amount: float,
    description: Optional[str] = "Account Transfer",
    transfer_date: Optional[date_type] = None,
    db: Session = Depends(get_db)
):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Transfer amount must be greater than zero")
    if from_account_id == to_account_id:
        raise HTTPException(status_code=400, detail="Source and destination accounts must be different")

    source_acc = db.query(Account).filter(Account.id == from_account_id).first()
    dest_acc = db.query(Account).filter(Account.id == to_account_id).first()

    if not source_acc or not dest_acc:
        raise HTTPException(status_code=404, detail="Source or destination account not found")

    source_acc.current_balance -= amount
    dest_acc.current_balance += amount

    dt = transfer_date or date_type.today()
    txn = Transaction(
        type="transfer",
        amount=amount,
        source_or_payee=f"Transfer: {source_acc.name} -> {dest_acc.name}",
        account_id=from_account_id,
        to_account_id=to_account_id,
        category_id=None,
        description=description,
        date=dt,
        payment_method="Transfer"
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn
