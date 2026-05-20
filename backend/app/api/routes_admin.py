from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.catalog import AdminProductListResponse, AdminProductResponse, AdminProductUpsertRequest
from app.schemas.inventory import InventoryAdjustmentRequest, InventoryAdjustmentResponse
from app.services.auth_service import AuthContext, require_roles
from app.services.catalog_service import create_admin_product, get_admin_product, list_admin_products, update_admin_product
from app.services.inventory_service import adjust_inventory

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/products", response_model=AdminProductListResponse)
def admin_products(
    status_value: str | None = Query(default=None, alias="status"),
    category_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _: AuthContext = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> AdminProductListResponse:
    return list_admin_products(db, status=status_value, category_id=category_id, limit=limit, offset=offset)


@router.post("/products", response_model=AdminProductResponse, status_code=status.HTTP_201_CREATED)
def admin_create_product(
    payload: AdminProductUpsertRequest,
    _: AuthContext = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> AdminProductResponse:
    try:
        return create_admin_product(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/products/{product_id}", response_model=AdminProductResponse)
def admin_get_product(
    product_id: str,
    _: AuthContext = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> AdminProductResponse:
    try:
        return get_admin_product(db, product_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put("/products/{product_id}", response_model=AdminProductResponse)
def admin_update_product(
    product_id: str,
    payload: AdminProductUpsertRequest,
    _: AuthContext = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> AdminProductResponse:
    try:
        return update_admin_product(db, product_id, payload)
    except ValueError as exc:
        message = str(exc)
        status_code = 404 if "not found" in message.lower() else 400
        raise HTTPException(status_code=status_code, detail=message) from exc


@router.post("/inventory/adjustments", response_model=InventoryAdjustmentResponse)
def admin_adjust_inventory(
    payload: InventoryAdjustmentRequest,
    context: AuthContext = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> InventoryAdjustmentResponse:
    try:
        return adjust_inventory(db, payload=payload, created_by_user_id=str(context.user.id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
