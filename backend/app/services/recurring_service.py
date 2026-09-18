from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
import calendar

from backend.app.models.recurring import RecurringTransaction
from backend.app.models.transaction import Transaction

class RecurringService:
    @classmethod
    def process_recurring_transactions(cls, db: Session, target_month_str: str = None) -> int:
        """
        Idempotently processes all active recurring transactions for the target month or up to current date.
        Returns the number of new transactions created.
        """
        if not target_month_str:
            target_month_str = datetime.now().strftime("%Y-%m")

        dt = datetime.strptime(target_month_str, "%Y-%m")
        year, month = dt.year, dt.month
        last_day = calendar.monthrange(year, month)[1]
        
        month_start = date(year, month, 1)
        month_end = date(year, month, last_day)
        today = date.today()
        cutoff_date = min(month_end, today)

        active_recurrings = db.query(RecurringTransaction).filter(
            RecurringTransaction.is_active == True
        ).all()

        created_count = 0

        for r in active_recurrings:
            target_dates = []

            if r.frequency == "monthly":
                day_num = min(r.day_of_month or 1, last_day)
                target_date = date(year, month, day_num)
                if target_date <= cutoff_date:
                    target_dates.append(target_date)

            elif r.frequency == "weekly":
                if r.day_of_week is not None:
                    curr = month_start
                    while curr <= cutoff_date:
                        if curr.weekday() == r.day_of_week:
                            target_dates.append(curr)
                        curr += timedelta(days=1)

            elif r.frequency == "yearly":
                if r.month_of_year == month:
                    day_num = min(r.day_of_month or 1, last_day)
                    target_date = date(year, month, day_num)
                    if target_date <= cutoff_date:
                        target_dates.append(target_date)

            for t_date in target_dates:
                # Idempotency check: Check if transaction already exists for this recurring ID on this date
                existing = db.query(Transaction).filter(
                    Transaction.recurring_id == r.id,
                    Transaction.date == t_date
                ).first()

                if not existing:
                    tx = Transaction(
                        type=r.type,
                        amount=r.amount,
                        source_or_payee=r.title,
                        category_id=r.category_id,
                        description=f"Auto-generated recurring {r.frequency} transaction",
                        date=t_date,
                        payment_method="Auto/Recurring",
                        is_recurring=True,
                        recurring_id=r.id
                    )
                    db.add(tx)
                    r.last_processed_date = t_date
                    created_count += 1

        if created_count > 0:
            db.commit()

        return created_count
