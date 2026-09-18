from sqlalchemy.orm import Session
from sqlalchemy import extract, func, and_
from datetime import datetime, date
import calendar

from backend.app.models.transaction import Transaction
from backend.app.models.category import Category
from backend.app.models.budget import Budget
from backend.app.models.emi import EMI
from backend.app.models.sip import SIPInvestment
from backend.app.models.goal import SavingsGoal

class FinancialCalculator:
    @staticmethod
    def get_month_date_range(month_str: str):
        """Parse YYYY-MM into start_date and end_date."""
        dt = datetime.strptime(month_str, "%Y-%m")
        year, month = dt.year, dt.month
        start_date = date(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        end_date = date(year, month, last_day)
        return start_date, end_date

    @classmethod
    def get_dashboard_summary(cls, db: Session, month_str: str):
        start_date, end_date = cls.get_month_date_range(month_str)

        # 1. Total Income & Expenses for month
        income_query = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.type == "income",
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).scalar()

        expense_query = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.type == "expense",
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).scalar()

        total_income = round(float(income_query), 2)
        total_expenses = round(float(expense_query), 2)

        # 2. Total EMI payments for active loans
        active_emis = db.query(EMI).filter(EMI.is_completed == False).all()
        total_emi = round(sum(emi.monthly_payment for emi in active_emis), 2)

        # 3. Total SIP contributions
        active_sips = db.query(SIPInvestment).all()
        total_sip = round(sum(sip.monthly_amount for sip in active_sips), 2)

        # 4. Available Balance = Income - Expenses - EMI - SIP
        available_balance = round(total_income - total_expenses - total_emi - total_sip, 2)

        # 5. Savings Rate = (Available Balance / Total Income) * 100
        savings_rate = 0.0
        if total_income > 0:
            savings_rate = round(max((available_balance / total_income) * 100, 0.0), 2)

        # 6. Income vs Expense Chart (Current month breakdown)
        income_vs_expense_chart = [
            {"category": "Income", "amount": total_income, "color": "#10b981"},
            {"category": "Expenses", "amount": total_expenses, "color": "#ef4444"},
            {"category": "EMI", "amount": total_emi, "color": "#f59e0b"},
            {"category": "SIP", "amount": total_sip, "color": "#3b82f6"}
        ]

        # 7. Expense Category Breakdown for month
        cat_breakdown_raw = db.query(
            Category.id,
            Category.name,
            Category.color,
            func.coalesce(func.sum(Transaction.amount), 0.0).label("cat_total")
        ).join(Transaction, Transaction.category_id == Category.id)\
         .filter(
             Transaction.type == "expense",
             Transaction.date >= start_date,
             Transaction.date <= end_date
         )\
         .group_by(Category.id, Category.name, Category.color)\
         .all()

        expense_category_breakdown = []
        for cat_id, cat_name, cat_color, cat_total in cat_breakdown_raw:
            pct = (cat_total / total_expenses * 100) if total_expenses > 0 else 0
            expense_category_breakdown.append({
                "category_id": cat_id,
                "category_name": cat_name,
                "color": cat_color or "#64748b",
                "amount": round(float(cat_total), 2),
                "percentage": round(pct, 1)
            })

        # Sort category breakdown by highest amount
        expense_category_breakdown.sort(key=lambda x: x["amount"], reverse=True)

        # 8. Monthly Trend (Past 6 months up to selected month)
        monthly_trend = cls.get_monthly_trend(db, month_str, num_months=6)

        # 9. Overall Budget Progress for selected month
        budget_record = db.query(Budget).filter(
            Budget.month == month_str,
            Budget.category_id == None
        ).first()

        budget_progress = None
        if budget_record:
            budget_limit = budget_record.amount
            spent = total_expenses
            remaining = round(budget_limit - spent, 2)
            pct = round((spent / budget_limit * 100) if budget_limit > 0 else 0, 1)
            budget_progress = {
                "budget_limit": budget_limit,
                "spent": spent,
                "remaining": remaining,
                "percentage": pct
            }

        # 10. Savings Goals Progress
        goals = db.query(SavingsGoal).filter(SavingsGoal.is_completed == False).all()
        savings_goal_progress = [
            {
                "id": g.id,
                "goal_name": g.goal_name,
                "target_amount": g.target_amount,
                "current_savings": g.current_savings,
                "remaining": round(max(g.target_amount - g.current_savings, 0.0), 2),
                "percentage": round((g.current_savings / g.target_amount * 100) if g.target_amount > 0 else 0, 1)
            }
            for g in goals
        ]

        # 11. Upcoming EMI Payments
        upcoming_emis = [
            {
                "id": emi.id,
                "loan_name": emi.loan_name,
                "monthly_payment": emi.monthly_payment,
                "due_day": emi.due_day,
                "due_date": f"{month_str}-{emi.due_day:02d}",
                "remaining_amount": emi.remaining_amount
            }
            for emi in active_emis
        ]

        # 12. Recent Transactions (Latest 5 in month)
        recent_txs = db.query(Transaction).filter(
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).order_by(Transaction.date.desc(), Transaction.id.desc()).limit(5).all()

        return {
            "month": month_str,
            "total_income": total_income,
            "total_expenses": total_expenses,
            "total_emi": total_emi,
            "total_sip": total_sip,
            "available_balance": available_balance,
            "savings_rate": savings_rate,
            "income_vs_expense_chart": income_vs_expense_chart,
            "expense_category_breakdown": expense_category_breakdown,
            "monthly_trend": monthly_trend,
            "budget_progress": budget_progress,
            "savings_goal_progress": savings_goal_progress,
            "upcoming_emis": upcoming_emis,
            "recent_transactions": recent_txs
        }

    @classmethod
    def get_monthly_trend(cls, db: Session, target_month_str: str, num_months: int = 6):
        """Calculates income vs expenses for N months prior to and including target_month."""
        dt = datetime.strptime(target_month_str, "%Y-%m")
        trend = []

        # Generate month list backwards
        month_list = []
        curr_year, curr_month = dt.year, dt.month
        for _ in range(num_months):
            m_str = f"{curr_year:04d}-{curr_month:02d}"
            month_list.append(m_str)
            curr_month -= 1
            if curr_month == 0:
                curr_month = 12
                curr_year -= 1

        month_list.reverse()

        for m_str in month_list:
            s_date, e_date = cls.get_month_date_range(m_str)

            inc = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.type == "income",
                Transaction.date >= s_date,
                Transaction.date <= e_date
            ).scalar()

            exp = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
                Transaction.type == "expense",
                Transaction.date >= s_date,
                Transaction.date <= e_date
            ).scalar()

            inc_f = round(float(inc), 2)
            exp_f = round(float(exp), 2)
            sav_f = round(inc_f - exp_f, 2)

            trend.append({
                "month": m_str,
                "income": inc_f,
                "expenses": exp_f,
                "savings": sav_f
            })

        return trend
