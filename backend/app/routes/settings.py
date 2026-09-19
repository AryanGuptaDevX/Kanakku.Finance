from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime, date

from backend.app.database import get_db, Base, engine
from backend.app.models.setting import AppSetting
from backend.app.models.category import Category
from backend.app.models.transaction import Transaction
from backend.app.models.account import Account
from backend.app.models.budget import Budget
from backend.app.models.recurring import RecurringTransaction
from backend.app.models.emi import EMI
from backend.app.models.sip import SIPInvestment
from backend.app.models.sip_contribution import SIPContribution
from backend.app.models.goal import SavingsGoal
from backend.app.utils.seed import seed_default_categories

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingUpdate(BaseModel):
    key: str
    value: str

class ResetRequest(BaseModel):
    confirm_code: str

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(AppSetting).all()
    res = {s.key: s.value for s in settings}
    if "currency" not in res:
        res["currency"] = "₹"
    return res

@router.post("")
def update_setting(setting: SettingUpdate, db: Session = Depends(get_db)):
    item = db.query(AppSetting).filter(AppSetting.key == setting.key).first()
    if item:
        item.value = setting.value
    else:
        item = AppSetting(key=setting.key, value=setting.value)
        db.add(item)
    db.commit()
    return {"message": "Setting updated", "key": setting.key, "value": setting.value}

@router.get("/backup")
def export_backup(db: Session = Depends(get_db)):
    def serialize_obj(obj):
        d = {}
        for c in obj.__table__.columns:
            val = getattr(obj, c.name)
            if isinstance(val, (datetime, date)):
                val = val.isoformat()
            d[c.name] = val
        return d

    data = {
        "version": "1.0",
        "exported_at": datetime.utcnow().isoformat(),
        "categories": [serialize_obj(c) for c in db.query(Category).all()],
        "accounts": [serialize_obj(a) for a in db.query(Account).all()],
        "transactions": [serialize_obj(t) for t in db.query(Transaction).all()],
        "budgets": [serialize_obj(b) for b in db.query(Budget).all()],
        "recurring_transactions": [serialize_obj(r) for r in db.query(RecurringTransaction).all()],
        "emis": [serialize_obj(e) for e in db.query(EMI).all()],
        "sips": [serialize_obj(s) for s in db.query(SIPInvestment).all()],
        "sip_contributions": [serialize_obj(sc) for sc in db.query(SIPContribution).all()],
        "goals": [serialize_obj(g) for g in db.query(SavingsGoal).all()],
        "settings": [serialize_obj(st) for st in db.query(AppSetting).all()]
    }
    return data

@router.post("/restore")
def restore_backup(backup_data: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    if not isinstance(backup_data, dict) or "version" not in backup_data:
        raise HTTPException(status_code=400, detail="Invalid backup file format")

    try:
        db.query(Transaction).delete()
        db.query(SIPContribution).delete()
        db.query(SIPInvestment).delete()
        db.query(EMI).delete()
        db.query(RecurringTransaction).delete()
        db.query(Budget).delete()
        db.query(SavingsGoal).delete()
        db.query(Category).delete()
        db.query(Account).delete()
        db.query(AppSetting).delete()
        db.commit()

        # Helper to parse dates
        def parse_val(v):
            if isinstance(v, str):
                try:
                    if "T" in v:
                        return datetime.fromisoformat(v)
                    elif len(v) == 10 and v.count("-") == 2:
                        return date.fromisoformat(v)
                except Exception:
                    pass
            return v

        # Restore Categories
        for cat_data in backup_data.get("categories", []):
            db.add(Category(**{k: parse_val(v) for k, v in cat_data.items()}))
        db.flush()

        # Restore Accounts
        for acc_data in backup_data.get("accounts", []):
            db.add(Account(**{k: parse_val(v) for k, v in acc_data.items()}))
        db.flush()

        # Restore Transactions
        for txn_data in backup_data.get("transactions", []):
            db.add(Transaction(**{k: parse_val(v) for k, v in txn_data.items()}))

        # Restore Budgets
        for b_data in backup_data.get("budgets", []):
            db.add(Budget(**{k: parse_val(v) for k, v in b_data.items()}))

        # Restore Recurring
        for r_data in backup_data.get("recurring_transactions", []):
            db.add(RecurringTransaction(**{k: parse_val(v) for k, v in r_data.items()}))

        # Restore EMIs
        for e_data in backup_data.get("emis", []):
            db.add(EMI(**{k: parse_val(v) for k, v in e_data.items()}))

        # Restore SIPs
        for s_data in backup_data.get("sips", []):
            db.add(SIPInvestment(**{k: parse_val(v) for k, v in s_data.items()}))

        # Restore SIP Contributions
        for sc_data in backup_data.get("sip_contributions", []):
            db.add(SIPContribution(**{k: parse_val(v) for k, v in sc_data.items()}))

        # Restore Goals
        for g_data in backup_data.get("goals", []):
            db.add(SavingsGoal(**{k: parse_val(v) for k, v in g_data.items()}))

        # Restore Settings
        for st_data in backup_data.get("settings", []):
            db.add(AppSetting(**{k: parse_val(v) for k, v in st_data.items()}))

        db.commit()
        return {"message": "Data restored successfully from backup."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to restore backup: {str(e)}")

@router.post("/reset-data")
def reset_all_data(
    reset_req: ResetRequest,
    db: Session = Depends(get_db)
):
    if reset_req.confirm_code != "RESET":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safety confirmation failed. You must provide confirm_code 'RESET' to wipe application data."
        )

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_default_categories(db)
    return {"message": "All database tables reset successfully."}
