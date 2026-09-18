from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.database import get_db, Base, engine
from backend.app.models.setting import AppSetting
from backend.app.utils.seed import seed_default_categories

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingUpdate(BaseModel):
    key: str
    value: str

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

@router.post("/reset-data")
def reset_all_data(db: Session = Depends(get_db)):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_default_categories(db)
    return {"message": "All database tables reset successfully."}
