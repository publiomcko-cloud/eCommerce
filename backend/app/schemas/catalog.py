from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


ProductStatus = Literal["draft", "active", "archived"]
VariantStatus = Literal["active", "inactive", "archived"]


class CatalogCategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    sort_order: int
    product_count: int


class ProductImageResponse(BaseModel):
    id: str
    url: str
    alt_text: str | None
    sort_order: int
    is_primary: bool


class CatalogVariantResponse(BaseModel):
    id: str
    sku: str
    name: str
    attributes: dict[str, Any]
    price: float | None
    effective_price: float
    weight_grams: int | None
    status: VariantStatus
    available_stock: int
    allow_backorder: bool
    is_in_stock: bool


class ProductCardResponse(BaseModel):
    id: str
    name: str
    slug: str
    short_description: str | None
    category_name: str
    category_slug: str
    brand: str | None
    price: float
    compare_at_price: float | None
    currency: str
    primary_image_url: str | None
    is_in_stock: bool
    available_stock: int
    variant_count: int


class ProductListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[ProductCardResponse]


class ProductDetailResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    short_description: str | None
    brand: str | None
    price: float
    compare_at_price: float | None
    currency: str
    category: CatalogCategoryResponse
    images: list[ProductImageResponse]
    variants: list[CatalogVariantResponse]


class AdminProductImageInput(BaseModel):
    url: str = Field(min_length=1)
    alt_text: str | None = Field(default=None, max_length=255)
    sort_order: int = 0
    is_primary: bool = False


class AdminProductVariantInput(BaseModel):
    id: str | None = None
    sku: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    attributes: dict[str, Any] = Field(default_factory=dict)
    price: float | None = Field(default=None, ge=0)
    weight_grams: int | None = Field(default=None, ge=0)
    status: VariantStatus = "active"
    stock_on_hand: int = Field(default=0, ge=0)
    stock_reserved: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    allow_backorder: bool = False


class AdminProductUpsertRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    category_id: str
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=280)
    description: str | None = None
    short_description: str | None = None
    status: ProductStatus = "draft"
    brand: str | None = Field(default=None, max_length=120)
    base_price: float = Field(ge=0)
    compare_at_price: float | None = Field(default=None, ge=0)
    currency: str = Field(default="BRL", min_length=3, max_length=3)
    seo_title: str | None = Field(default=None, max_length=255)
    seo_description: str | None = None
    images: list[AdminProductImageInput] = Field(default_factory=list)
    variants: list[AdminProductVariantInput] = Field(default_factory=list, min_length=1)

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper()


class AdminInventoryStateResponse(BaseModel):
    stock_on_hand: int
    stock_reserved: int
    available_stock: int
    low_stock_threshold: int
    allow_backorder: bool


class AdminProductVariantResponse(BaseModel):
    id: str
    sku: str
    name: str
    attributes: dict[str, Any]
    price: float | None
    effective_price: float
    weight_grams: int | None
    status: VariantStatus
    inventory: AdminInventoryStateResponse


class AdminProductResponse(BaseModel):
    id: str
    category_id: str
    category_name: str
    category_slug: str
    name: str
    slug: str
    description: str | None
    short_description: str | None
    status: ProductStatus
    brand: str | None
    base_price: float
    compare_at_price: float | None
    currency: str
    seo_title: str | None
    seo_description: str | None
    created_at: datetime
    updated_at: datetime
    images: list[ProductImageResponse]
    variants: list[AdminProductVariantResponse]


class AdminProductListItemResponse(BaseModel):
    id: str
    name: str
    slug: str
    status: ProductStatus
    category_name: str
    variant_count: int
    total_available_stock: int
    updated_at: datetime


class AdminProductListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[AdminProductListItemResponse]
