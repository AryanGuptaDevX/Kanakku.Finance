from sqlalchemy.orm import Session
from backend.app.models.category import Category

DEFAULT_CATEGORIES = [
    # Expense categories
    {"name": "Food", "type": "expense", "icon": "utensils", "color": "#f97316", "is_default": True},
    {"name": "Transport", "type": "expense", "icon": "car", "color": "#0284c7", "is_default": True},
    {"name": "Shopping", "type": "expense", "icon": "shopping-bag", "color": "#ec4899", "is_default": True},
    {"name": "Bills", "type": "expense", "icon": "receipt", "color": "#eab308", "is_default": True},
    {"name": "Entertainment", "type": "expense", "icon": "film", "color": "#8b5cf6", "is_default": True},
    {"name": "Healthcare", "type": "expense", "icon": "activity", "color": "#ef4444", "is_default": True},
    {"name": "Education", "type": "expense", "icon": "book-open", "color": "#3b82f6", "is_default": True},
    {"name": "Rent", "type": "expense", "icon": "home", "color": "#14b8a6", "is_default": True},
    {"name": "Subscriptions", "type": "expense", "icon": "repeat", "color": "#6366f1", "is_default": True},
    {"name": "Other", "type": "expense", "icon": "more-horizontal", "color": "#64748b", "is_default": True},

    # Income categories
    {"name": "Salary", "type": "income", "icon": "briefcase", "color": "#10b981", "is_default": True},
    {"name": "Freelance", "type": "income", "icon": "laptop", "color": "#06b6d4", "is_default": True},
    {"name": "Business", "type": "income", "icon": "building", "color": "#8b5cf6", "is_default": True},
    {"name": "Bonus", "type": "income", "icon": "gift", "color": "#f59e0b", "is_default": True},
    {"name": "Other Income", "type": "income", "icon": "dollar-sign", "color": "#10b981", "is_default": True},
]

def seed_default_categories(db: Session):
    existing_count = db.query(Category).count()
    if existing_count == 0:
        for cat_data in DEFAULT_CATEGORIES:
            cat = Category(**cat_data)
            db.add(cat)
        db.commit()
