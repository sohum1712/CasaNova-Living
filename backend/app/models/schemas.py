from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime, date
from enum import Enum


# Store related models
class StoreType(str, Enum):
    WAREHOUSE = "Warehouse"
    URBAN = "Urban"
    SUBURBAN = "Suburban"
    TOURIST = "Tourist"
    BUSINESS = "Business"
    ENTERTAINMENT = "Entertainment"
    SHOPPING = "Shopping"


class Store(BaseModel):
    model_config = {"from_attributes": True}

    store_id:   int
    store_name: str
    store_code: str
    address:    Optional[str] = None
    city:       Optional[str] = None
    state:      Optional[str] = None
    zip_code:   Optional[str] = None
    region:     Optional[str] = None
    store_type: Optional[str] = None
    created_at: datetime


class StoreCreate(BaseModel):
    store_name: str
    store_code: str
    address: str
    city: str
    state: str
    zip_code: str
    region: str
    store_type: StoreType


class StoreUpdate(BaseModel):
    store_name: Optional[str] = None
    store_code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    region: Optional[str] = None
    store_type: Optional[StoreType] = None


# Product related models
class Product(BaseModel):
    model_config = {"from_attributes": True}

    product_id:   int
    product_name: str
    brand:        Optional[str] = None
    category:     Optional[str] = None
    package_size: Optional[str] = None
    unit_price:   float
    created_at:   datetime


class ProductCreate(BaseModel):
    product_name: str
    brand: str
    category: str
    package_size: str
    unit_price: float


# Inventory related models
class Inventory(BaseModel):
    inventory_id: int
    store_id: int
    product_id: int
    quantity_cases: int
    reserved_cases: int
    last_updated: datetime
    version: int
    # Joined fields
    store_name: Optional[str] = None
    product_name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None


class InventoryUpdate(BaseModel):
    quantity_cases: Optional[int] = None
    reserved_cases: Optional[int] = None


# Order related models
class OrderStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


class Order(BaseModel):
    order_id: int
    order_number: str
    from_store_id: Optional[int] = None
    to_store_id: int
    product_id: int
    quantity_cases: int
    order_status: OrderStatus
    requested_by: int
    approved_by: Optional[int] = None
    order_date: datetime
    approved_date: Optional[datetime] = None
    fulfilled_date: Optional[datetime] = None
    notes: Optional[str] = None
    version: int
    # Joined fields
    to_store_name: Optional[str] = None
    from_store_name: Optional[str] = None
    product_name: Optional[str] = None
    requester_name: Optional[str] = None
    requester_avatar_url: Optional[str] = None
    approver_name: Optional[str] = None
    approver_avatar_url: Optional[str] = None


class OrderCreate(BaseModel):
    order_number: Optional[str] = None
    from_store_id: Optional[int]
    to_store_id: int
    product_id: int
    quantity_cases: int
    requested_by: int
    approved_by: Optional[int] = None
    notes: Optional[str]
    order_date: Optional[Union[datetime, str]] = None


# User related models
class UserRole(str, Enum):
    HEAD_OFFICE_ADMIN = "head_office_admin"
    AREA_MANAGER      = "area_manager"
    STORE_SUPERVISOR  = "store_supervisor"
    FLOOR_ASSOCIATE   = "floor_associate"


class UserToken(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      int
    username:     str
    role:         str   # plain string — avoids enum rejection on unknown DB values


class UserLogin(BaseModel):
    """`username` accepts either the account username or the registered email."""
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=100)


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10, max_length=500)
    password: str = Field(..., min_length=6)


class User(BaseModel):
    model_config = {"from_attributes": True}

    user_id:    int
    username:   str
    email:      str
    first_name: str
    last_name:  str
    role:       str          # plain string — tolerates any role value from DB
    store_id:   Optional[int]   = None
    region:     Optional[str]   = None
    avatar_url: Optional[str]   = None
    created_at: datetime


class UserCreate(BaseModel):
    username:   str = Field(..., min_length=1, max_length=50)
    email:      str = Field(..., min_length=3, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name:  str = Field(..., min_length=1, max_length=50)
    role:       str = "floor_associate"   # plain string — no enum restriction
    store_id:   Optional[int] = None
    region:     Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=2000)
    password:   str = Field(..., min_length=6)


# Analytics models
class KPIData(BaseModel):
    total_inventory_value: float
    total_products: int
    low_stock_alerts: int
    average_turnover: float


class RegionOption(BaseModel):
    value: str
    label: str
    store_count: int


class InventoryTrendData(BaseModel):
    date: str
    total_value: float
    total_quantity: int


class CategoryDistribution(BaseModel):
    category: str
    value: float
    percentage: float


# Response models
class PaginatedResponse(BaseModel):
    data: List[dict]
    page: int
    total_pages: int
    total: int
    limit: int


class ApiResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None
    error: Optional[str] = None


# ── CasaNova Extensions ──────────────────────────────────────────────────────

class TransferStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"


class StockTransfer(BaseModel):
    transfer_id: int
    from_store_id: int
    to_store_id: int
    product_id: int
    quantity: int
    status: TransferStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Joined fields
    from_store_name: Optional[str] = None
    to_store_name: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[str] = None


class StockTransferCreate(BaseModel):
    from_store_id: int
    to_store_id: int
    product_id: int
    quantity: int
    notes: Optional[str] = None


class POSSessionStatus(str, Enum):
    OPEN = "open"
    PAID = "paid"
    CANCELLED = "cancelled"


class POSSession(BaseModel):
    session_id: int
    store_id: int
    cart: List[dict]
    total: float
    status: POSSessionStatus
    created_at: datetime
    store_name: Optional[str] = None


class POSSessionCreate(BaseModel):
    store_id: int
    cart: List[dict]  # [{"product_id": 1, "qty": 2, "unit_price": 18.99}]
    total: float


class DashboardKPI(BaseModel):
    total_inventory_value: float
    total_products: int
    low_stock_count: int
    pending_transfers: int
    todays_sales: float
    store_id: Optional[int] = None
