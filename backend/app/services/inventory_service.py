from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_inventory_movement import CommerceInventoryMovement
from app.models.commerce_product_variant import CommerceProductVariant
from app.schemas.inventory import InventoryAdjustmentRequest, InventoryAdjustmentResponse


def adjust_inventory(
    session: Session,
    *,
    payload: InventoryAdjustmentRequest,
    created_by_user_id: str | None = None,
) -> InventoryAdjustmentResponse:
    variant = session.get(CommerceProductVariant, uuid.UUID(payload.variant_id))
    if variant is None:
        raise ValueError("Variant not found.")

    inventory = session.scalar(
        select(CommerceInventoryItem).where(CommerceInventoryItem.variant_id == variant.id)
    )
    if inventory is None:
        inventory = CommerceInventoryItem(variant_id=variant.id)
        session.add(inventory)
        session.flush()

    next_stock_on_hand = inventory.stock_on_hand + payload.quantity_delta
    if next_stock_on_hand < 0:
        raise ValueError("Inventory adjustment would make stock negative.")

    inventory.stock_on_hand = next_stock_on_hand

    movement = CommerceInventoryMovement(
        variant_id=variant.id,
        movement_type="adjustment",
        quantity_delta=payload.quantity_delta,
        reason=payload.reason,
        reference_type="admin",
        created_by_user_id=uuid.UUID(created_by_user_id) if created_by_user_id else None,
    )
    session.add(movement)
    session.commit()
    session.refresh(inventory)
    session.refresh(movement)

    available_stock = inventory.stock_on_hand - inventory.stock_reserved
    return InventoryAdjustmentResponse(
        movement_id=str(movement.id),
        variant_id=str(variant.id),
        movement_type="adjustment",
        quantity_delta=movement.quantity_delta,
        reason=movement.reason,
        stock_on_hand=inventory.stock_on_hand,
        stock_reserved=inventory.stock_reserved,
        available_stock=available_stock,
        low_stock_threshold=inventory.low_stock_threshold,
        allow_backorder=inventory.allow_backorder,
        created_at=movement.created_at,
    )
