from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.catalog import CatalogCategoryResponse, ProductDetailResponse, ProductListResponse
from app.services.catalog_service import get_catalog_product_by_slug, list_catalog_categories, list_catalog_products

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/categories", response_model=list[CatalogCategoryResponse])
def catalog_categories(db: Session = Depends(get_db)) -> list[CatalogCategoryResponse]:
    return list_catalog_categories(db)


@router.get("/products", response_model=ProductListResponse)
def catalog_products(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ProductListResponse:
    return list_catalog_products(db, q=q, category_slug=category, limit=limit, offset=offset)


@router.get("/products/{slug}", response_model=ProductDetailResponse)
def catalog_product_detail(slug: str, db: Session = Depends(get_db)) -> ProductDetailResponse:
    try:
        return get_catalog_product_by_slug(db, slug)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
