from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.services.export_service import CSVExportService

router = APIRouter(prefix="/api/export", tags=["CSV Export"])

@router.get("/transactions")
def export_all_transactions(db: Session = Depends(get_db)):
    csv_data = CSVExportService.export_transactions(db)
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=all_transactions.csv"})

@router.get("/income")
def export_income_transactions(db: Session = Depends(get_db)):
    csv_data = CSVExportService.export_transactions(db, type_filter="income")
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=income_transactions.csv"})

@router.get("/expenses")
def export_expense_transactions(db: Session = Depends(get_db)):
    csv_data = CSVExportService.export_transactions(db, type_filter="expense")
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=expense_transactions.csv"})

@router.get("/emis")
def export_emis(db: Session = Depends(get_db)):
    csv_data = CSVExportService.export_emis(db)
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=emi_loans.csv"})

@router.get("/sips")
def export_sips(db: Session = Depends(get_db)):
    csv_data = CSVExportService.export_sips(db)
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sip_investments.csv"})

@router.get("/goals")
def export_goals(db: Session = Depends(get_db)):
    csv_data = CSVExportService.export_goals(db)
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=savings_goals.csv"})
