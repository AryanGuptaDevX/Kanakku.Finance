from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from backend.app.database import get_db
from backend.app.models.transaction import Transaction
from backend.app.models.category import Category
from backend.app.models.account import Account
from backend.app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from backend.app.services.calculator import FinancialCalculator

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
    type: Optional[str] = Query(None, pattern="^(income|expense|transfer)$"),
    category_id: Optional[int] = None,
    account_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account),
        joinedload(Transaction.to_account)
    )
    
    if type:
        query = query.filter(Transaction.type == type)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if account_id:
        query = query.filter((Transaction.account_id == account_id) | (Transaction.to_account_id == account_id))
    
    if month:
        s_date, e_date = FinancialCalculator.get_month_date_range(month)
        query = query.filter(Transaction.date >= s_date, Transaction.date <= e_date)
    elif start_date and end_date:
        query = query.filter(Transaction.date >= start_date, Transaction.date <= end_date)
        
    return query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction_in: TransactionCreate, db: Session = Depends(get_db)):
    if transaction_in.type in ("income", "expense"):
        if not transaction_in.category_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category is required for income/expense")
        category = db.query(Category).filter(Category.id == transaction_in.category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        if category.type != transaction_in.type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{category.name}' type ({category.type}) does not match transaction type ({transaction_in.type})"
            )

    tx = Transaction(
        type=transaction_in.type,
        amount=transaction_in.amount,
        source_or_payee=transaction_in.source_or_payee,
        category_id=transaction_in.category_id,
        account_id=transaction_in.account_id,
        to_account_id=transaction_in.to_account_id,
        description=transaction_in.description,
        date=transaction_in.date,
        payment_method=transaction_in.payment_method or "Cash",
        is_recurring=transaction_in.is_recurring or False,
        recurring_id=transaction_in.recurring_id
    )

    # Balance updates for account
    if transaction_in.account_id:
        acc = db.query(Account).filter(Account.id == transaction_in.account_id).first()
        if acc:
            if transaction_in.type == "income":
                acc.current_balance += transaction_in.amount
            elif transaction_in.type == "expense":
                acc.current_balance -= transaction_in.amount
            elif transaction_in.type == "transfer":
                acc.current_balance -= transaction_in.amount

    if transaction_in.type == "transfer" and transaction_in.to_account_id:
        to_acc = db.query(Account).filter(Account.id == transaction_in.to_account_id).first()
        if to_acc:
            to_acc.current_balance += transaction_in.amount

    db.add(tx)
    db.commit()
    db.refresh(tx)
    
    return db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account),
        joinedload(Transaction.to_account)
    ).filter(Transaction.id == tx.id).first()

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account),
        joinedload(Transaction.to_account)
    ).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return tx

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(transaction_id: int, transaction_in: TransactionUpdate, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    
    target_type = transaction_in.type if transaction_in.type is not None else tx.type
    target_category_id = transaction_in.category_id if transaction_in.category_id is not None else tx.category_id

    if target_type in ("income", "expense") and target_category_id:
        category = db.query(Category).filter(Category.id == target_category_id).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        if category.type != target_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{category.name}' type ({category.type}) does not match transaction type ({target_type})"
            )

    tx.type = target_type
    tx.category_id = target_category_id

    if transaction_in.amount is not None:
        if transaction_in.amount <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than 0")
        tx.amount = transaction_in.amount
    if transaction_in.source_or_payee is not None:
        if not transaction_in.source_or_payee.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source/Payee name cannot be empty")
        tx.source_or_payee = transaction_in.source_or_payee.strip()
    if transaction_in.description is not None:
        tx.description = transaction_in.description
    if transaction_in.date is not None:
        tx.date = transaction_in.date
    if transaction_in.payment_method is not None:
        tx.payment_method = transaction_in.payment_method

    db.commit()
    return db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account),
        joinedload(Transaction.to_account)
    ).filter(Transaction.id == transaction_id).first()

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    
    # Reverse balance adjustment if linked to accounts
    if tx.account_id:
        acc = db.query(Account).filter(Account.id == tx.account_id).first()
        if acc:
            if tx.type == "income":
                acc.current_balance -= tx.amount
            elif tx.type == "expense" or tx.type == "transfer":
                acc.current_balance += tx.amount

    if tx.type == "transfer" and tx.to_account_id:
        to_acc = db.query(Account).filter(Account.id == tx.to_account_id).first()
        if to_acc:
            to_acc.current_balance -= tx.amount

    db.delete(tx)
    db.commit()
    return None
