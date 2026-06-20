from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import case, distinct, func, select
from sqlalchemy.orm import Session

from app.models.commerce_cart import CommerceCart
from app.models.commerce_cart_item import CommerceCartItem
from app.models.commerce_category import CommerceCategory
from app.models.commerce_event import CommerceEvent
from app.models.commerce_inventory_item import CommerceInventoryItem
from app.models.commerce_order import CommerceOrder
from app.models.commerce_order_item import CommerceOrderItem
from app.models.commerce_payment import CommercePayment
from app.models.commerce_product import CommerceProduct
from app.models.commerce_product_variant import CommerceProductVariant
from app.models.commerce_refund import CommerceRefund
from app.models.dim_channel import DimChannel
from app.models.dim_customer import DimCustomer
from app.models.dim_product import DimProduct
from app.models.dim_region import DimRegion
from app.models.fact_order import FactOrder
from app.schemas.metrics import (
    CartAbandonmentResponse,
    ConversionFunnelResponse,
    InventoryRiskPoint,
    PaymentHealthResponse,
    RevenueByCategoryPoint,
)
from app.services.metrics_service import to_float
from app.services.transformation_service import (
    get_or_create_channel,
    get_or_create_customer,
    get_or_create_product,
    get_or_create_region,
    normalize_dimension_value,
)


@dataclass(frozen=True)
class CommerceProjectionResult:
    records_read: int
    records_inserted: int
    records_skipped: int


PAID_ORDER_STATUSES = ("paid", "fulfilled")


def get_revenue_by_category(session: Session) -> list[RevenueByCategoryPoint]:
    rows = session.execute(
        select(
            CommerceCategory.name,
            func.coalesce(func.sum(CommerceOrderItem.line_total), 0).label("revenue"),
            func.count(distinct(CommerceOrder.id)).label("order_count"),
            func.coalesce(func.sum(CommerceOrderItem.quantity), 0).label("quantity_sold"),
        )
        .select_from(CommerceOrderItem)
        .join(CommerceOrder, CommerceOrder.id == CommerceOrderItem.order_id)
        .join(CommerceProductVariant, CommerceProductVariant.id == CommerceOrderItem.variant_id)
        .join(CommerceProduct, CommerceProduct.id == CommerceProductVariant.product_id)
        .join(CommerceCategory, CommerceCategory.id == CommerceProduct.category_id)
        .where(CommerceOrder.status.in_(PAID_ORDER_STATUSES))
        .group_by(CommerceCategory.name)
        .order_by(func.sum(CommerceOrderItem.line_total).desc(), CommerceCategory.name.asc())
    ).all()

    return [
        RevenueByCategoryPoint(
            category=category_name,
            revenue=to_float(revenue),
            order_count=int(order_count or 0),
            quantity_sold=int(quantity_sold or 0),
        )
        for category_name, revenue, order_count, quantity_sold in rows
    ]


def get_conversion_funnel(session: Session) -> ConversionFunnelResponse:
    counts = {
        event_type: int(count or 0)
        for event_type, count in session.execute(
            select(CommerceEvent.event_type, func.count(CommerceEvent.id))
            .where(
                CommerceEvent.event_type.in_(
                    [
                        "product_viewed",
                        "cart_item_added",
                        "checkout_started",
                        "order_created",
                        "payment_succeeded",
                    ]
                )
            )
            .group_by(CommerceEvent.event_type)
        ).all()
    }

    product_views = counts.get("product_viewed", 0)
    cart_adds = counts.get("cart_item_added", 0)
    checkouts_started = counts.get("checkout_started", 0)
    orders_created = counts.get("order_created", 0)
    payments_succeeded = counts.get("payment_succeeded", 0)

    return ConversionFunnelResponse(
        product_views=product_views,
        cart_adds=cart_adds,
        checkouts_started=checkouts_started,
        orders_created=orders_created,
        payments_succeeded=payments_succeeded,
        visit_to_cart_rate=round(cart_adds / product_views, 4) if product_views else 0.0,
        checkout_to_order_rate=round(orders_created / checkouts_started, 4) if checkouts_started else 0.0,
        order_to_paid_rate=round(payments_succeeded / orders_created, 4) if orders_created else 0.0,
    )


def get_cart_abandonment(session: Session) -> CartAbandonmentResponse:
    active_carts = session.scalar(
        select(func.count(distinct(CommerceCart.id)))
        .select_from(CommerceCart)
        .join(CommerceCartItem, CommerceCartItem.cart_id == CommerceCart.id)
        .where(CommerceCart.status == "active")
    ) or 0
    converted_carts = session.scalar(
        select(func.count(CommerceCart.id)).where(CommerceCart.status == "converted")
    ) or 0
    abandoned_carts = session.scalar(
        select(func.count(CommerceCart.id)).where(CommerceCart.status == "abandoned")
    ) or 0
    at_risk_carts = int(active_carts or 0) + int(abandoned_carts or 0)
    total_considered = at_risk_carts + int(converted_carts or 0)

    return CartAbandonmentResponse(
        active_carts=int(active_carts or 0),
        converted_carts=int(converted_carts or 0),
        abandoned_carts=at_risk_carts,
        abandonment_rate=round(at_risk_carts / total_considered, 4) if total_considered else 0.0,
    )


def get_payment_health(session: Session) -> PaymentHealthResponse:
    row = session.execute(
        select(
            func.count(CommercePayment.id),
            func.coalesce(func.sum(case((CommercePayment.status == "pending", 1), else_=0)), 0),
            func.coalesce(func.sum(case((CommercePayment.status == "succeeded", 1), else_=0)), 0),
            func.coalesce(func.sum(case((CommercePayment.status == "failed", 1), else_=0)), 0),
            func.coalesce(func.sum(case((CommercePayment.status == "succeeded", CommercePayment.amount), else_=0)), 0),
        )
    ).one()
    refunded_amount = session.scalar(
        select(func.coalesce(func.sum(CommerceRefund.amount), 0)).where(CommerceRefund.status == "succeeded")
    ) or 0

    total_payments = int(row[0] or 0)
    succeeded_payments = int(row[2] or 0)
    gross_paid_amount = to_float(row[4])
    refunded = to_float(refunded_amount)

    return PaymentHealthResponse(
        total_payments=total_payments,
        pending_payments=int(row[1] or 0),
        succeeded_payments=succeeded_payments,
        failed_payments=int(row[3] or 0),
        success_rate=round(succeeded_payments / total_payments, 4) if total_payments else 0.0,
        gross_paid_amount=gross_paid_amount,
        refunded_amount=refunded,
        net_paid_amount=round(gross_paid_amount - refunded, 2),
    )


def get_inventory_risk(session: Session, *, limit: int = 20) -> list[InventoryRiskPoint]:
    available_stock = CommerceInventoryItem.stock_on_hand - CommerceInventoryItem.stock_reserved
    rows = session.execute(
        select(CommerceProductVariant, CommerceProduct, CommerceCategory, CommerceInventoryItem, available_stock.label("available_stock"))
        .join(CommerceProduct, CommerceProduct.id == CommerceProductVariant.product_id)
        .join(CommerceCategory, CommerceCategory.id == CommerceProduct.category_id)
        .join(CommerceInventoryItem, CommerceInventoryItem.variant_id == CommerceProductVariant.id)
        .where(
            CommerceInventoryItem.allow_backorder.is_(False),
            available_stock <= CommerceInventoryItem.low_stock_threshold,
        )
        .order_by(available_stock.asc(), CommerceProduct.name.asc())
        .limit(limit)
    ).all()

    return [
        InventoryRiskPoint(
            variant_id=str(variant.id),
            product_name=product.name,
            category_name=category.name,
            sku=variant.sku,
            stock_on_hand=inventory.stock_on_hand,
            stock_reserved=inventory.stock_reserved,
            available_stock=int(available or 0),
            low_stock_threshold=inventory.low_stock_threshold,
            allow_backorder=inventory.allow_backorder,
        )
        for variant, product, category, inventory, available in rows
    ]


def project_commerce_orders_to_facts(session: Session) -> CommerceProjectionResult:
    rows = session.execute(
        select(CommerceOrder, CommerceOrderItem, CommerceProductVariant, CommerceProduct, CommerceCategory)
        .join(CommerceOrderItem, CommerceOrderItem.order_id == CommerceOrder.id)
        .join(CommerceProductVariant, CommerceProductVariant.id == CommerceOrderItem.variant_id)
        .join(CommerceProduct, CommerceProduct.id == CommerceProductVariant.product_id)
        .join(CommerceCategory, CommerceCategory.id == CommerceProduct.category_id)
        .where(CommerceOrder.status.in_(PAID_ORDER_STATUSES))
        .order_by(CommerceOrder.created_at.asc(), CommerceOrderItem.created_at.asc())
    ).all()

    records_inserted = 0
    records_skipped = 0
    product_cache: dict[str, DimProduct] = {}
    customer_cache: dict[str, DimCustomer] = {}
    region_cache: dict[str, DimRegion] = {}
    channel_cache: dict[str, DimChannel] = {}

    for order, item, variant, product_model, category in rows:
        source_record_id = f"commerce:{order.order_number}:{item.id}"
        existing_fact = session.scalar(select(FactOrder.id).where(FactOrder.source_record_id == source_record_id))
        if existing_fact is not None:
            records_skipped += 1
            continue

        region_name = normalize_dimension_value(order.shipping_address_snapshot.get("region") or "Unknown")
        channel_name = "Storefront"
        product = get_or_create_product(
            session,
            product_cache,
            f"commerce_variant:{variant.id}",
            item.product_name,
            normalize_dimension_value(category.name),
        )
        customer = get_or_create_customer(
            session,
            customer_cache,
            f"commerce_customer:{order.customer_id}",
            region_name,
        )
        region = get_or_create_region(session, region_cache, region_name)
        channel = get_or_create_channel(session, channel_cache, channel_name)

        session.add(
            FactOrder(
                order_date=order.created_at.date(),
                product_id=product.id,
                customer_id=customer.id,
                region_id=region.id,
                channel_id=channel.id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_amount=item.line_total,
                source_record_id=source_record_id,
            )
        )
        records_inserted += 1

    session.commit()
    return CommerceProjectionResult(
        records_read=len(rows),
        records_inserted=records_inserted,
        records_skipped=records_skipped,
    )
