from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database import get_db
from backend.app.models.category import Category
from backend.app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Category)
    if type:
        query = query.filter(Category.type == type)
    return query.order_by(Category.name).all()

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category_in: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(
        Category.name.ilike(category_in.name),
        Category.type == category_in.type
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_in.name}' already exists for {category_in.type}"
        )
    
    category = Category(
        name=category_in.name,
        type=category_in.type,
        icon=category_in.icon or "tag",
        color=category_in.color or "#64748b",
        is_default=False
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category_in: CategoryUpdate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    if category_in.name is not None:
        category.name = category_in.name
    if category_in.icon is not None:
        category.icon = category_in.icon
    if category_in.color is not None:
        category.color = category_in.color

    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if category.is_default:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Default categories cannot be deleted")
    
    db.delete(category)
    db.commit()
    return None
