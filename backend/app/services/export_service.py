import csv
import io
from sqlalchemy.orm import Session, joinedload
from backend.app.models.transaction import Transaction
from backend.app.models.emi import EMI
from backend.app.models.sip import SIPInvestment
from backend.app.models.goal import SavingsGoal

class CSVExportService:
    @staticmethod
    def export_transactions(db: Session, type_filter: str = None) -> str:
        query = db.query(Transaction).options(joinedload(Transaction.category))
        if type_filter:
            query = query.filter(Transaction.type == type_filter)
        
        txs = query.order_by(Transaction.date.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Date", "Type", "Source/Payee", "Category", "Amount", "Payment Method", "Description", "Recurring"])

        for t in txs:
            writer.writerow([
                t.id,
                t.date.strftime("%Y-%m-%d"),
                t.type.capitalize(),
                t.source_or_payee,
                t.category.name if t.category else "",
                f"{t.amount:.2f}",
                t.payment_method or "",
                t.description or "",
                "Yes" if t.is_recurring else "No"
            ])

        return output.getvalue()

    @staticmethod
    def export_emis(db: Session) -> str:
        emis = db.query(EMI).order_by(EMI.id.asc()).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Loan Name", "Principal Amount", "Monthly Payment", "Interest Rate (%)", "Start Date", "Due Day", "Total Payments", "Payments Made", "Remaining Amount", "Status"])

        for e in emis:
            writer.writerow([
                e.id,
                e.loan_name,
                f"{e.principal_amount:.2f}",
                f"{e.monthly_payment:.2f}",
                f"{e.interest_rate:.2f}",
                e.start_date.strftime("%Y-%m-%d"),
                e.due_day,
                e.total_payments,
                e.payments_made,
                f"{e.remaining_amount:.2f}",
                "Paid Off" if e.is_completed else "Active"
            ])

        return output.getvalue()

    @staticmethod
    def export_sips(db: Session) -> str:
        sips = db.query(SIPInvestment).order_by(SIPInvestment.id.asc()).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Fund Name", "Monthly Amount", "Start Date", "Total Invested", "Current Value", "Profit/Loss", "Return (%)"])

        for s in sips:
            pl = s.current_value - s.total_invested
            ret_pct = (pl / s.total_invested * 100) if s.total_invested > 0 else 0.0
            writer.writerow([
                s.id,
                s.fund_name,
                f"{s.monthly_amount:.2f}",
                s.start_date.strftime("%Y-%m-%d"),
                f"{s.total_invested:.2f}",
                f"{s.current_value:.2f}",
                f"{pl:.2f}",
                f"{ret_pct:.2f}%"
            ])

        return output.getvalue()

    @staticmethod
    def export_goals(db: Session) -> str:
        goals = db.query(SavingsGoal).order_by(SavingsGoal.id.asc()).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Goal Name", "Target Amount", "Current Savings", "Remaining Amount", "Progress (%)", "Target Date", "Description", "Status"])

        for g in goals:
            rem = max(g.target_amount - g.current_savings, 0.0)
            pct = (g.current_savings / g.target_amount * 100) if g.target_amount > 0 else 0.0
            writer.writerow([
                g.id,
                g.goal_name,
                f"{g.target_amount:.2f}",
                f"{g.current_savings:.2f}",
                f"{rem:.2f}",
                f"{pct:.1f}%",
                g.target_date.strftime("%Y-%m-%d"),
                g.description or "",
                "Completed" if g.is_completed else "In Progress"
            ])

        return output.getvalue()
