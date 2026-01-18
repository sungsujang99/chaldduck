// OpenAPI 스펙 기반 타입 정의

// 공통 응답 래퍼
export interface JsonBody<T> {
  status: number;
  message: string;
  data: T;
}

// Customer 관련
export interface CustomerResponse {
  customerId: number;
  name: string;
  phone: string;
  blocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
}

export interface CustomerUpsertRequest {
  name: string;
  phone: string;
}

export interface AddressResponse {
  addressId: number;
  label: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address1: string;
  address2: string;
  isDefault: boolean;
}

export interface AddressCreateRequest {
  label: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address1: string;
  address2: string;
  isDefault?: boolean;
}

export interface AddressUpdateRequest {
  label: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address1: string;
  address2: string;
  isDefault?: boolean;
}

export interface BlockInfo {
  blocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
}

export interface CustomerOrderItemRow {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockStatusSnapshot?: "ORDERABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";
  stockQtySnapshot?: number;
  stockCheckedAt?: string;
  stockBlockReason?: string;
}

export interface CustomerOrderRow {
  orderId: number;
  orderNo: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  fulfillmentType: FulfillmentType;
  subtotalAmount: number;
  deliveryFee: number;
  discountAmount: number;
  finalAmount: number;
  createdAt: string;
  items: CustomerOrderItemRow[];
}

export interface CustomerProfileResponse {
  customer: CustomerResponse;
  blockInfo: BlockInfo;
  addresses: AddressResponse[];
  orders: CustomerOrderRow[];
}

export interface CustomerBlockUpdateRequest {
  blocked: boolean;
  reason?: string;
}

// Product 관련
export type ProductCategory = 
  | "RICE_CAKE"
  | "CAKE"
  | "BREAD"
  | "COOKIE"
  | "CHOCOLATE"
  | "ICE_CREAM"
  | "BEVERAGE"
  | "GIFT_SET"
  | "OTHER";

export type TaxType = "TAXABLE" | "TAX_EXEMPT";

export interface AdminProductStockRow {
  productId: number;
  name: string;
  price: number;
  stockQty: number;
  safetyStock: number;
  soldOutStatus: "IN_STOCK" | "LOW_STOCK" | "SOLD_OUT";
  category?: ProductCategory;
  taxType?: TaxType;
  purchasePrice?: number;
  active?: boolean;
  deletedAt?: string;
}

// 카테고리 한글 라벨
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  RICE_CAKE: "찰떡/떡",
  CAKE: "케이크",
  BREAD: "빵",
  COOKIE: "쿠키",
  CHOCOLATE: "초콜릿",
  ICE_CREAM: "아이스크림",
  BEVERAGE: "음료",
  GIFT_SET: "선물세트",
  OTHER: "기타",
};

export interface ProductCreateRequest {
  name: string;
  price: number;
  initialStockQty: number;
  safetyStock: number;
}

export interface StockUpdateRequest {
  stockQty: number;
  safetyStock: number;
  memo?: string;
}

// Order 관련
export type OrderStatus = "CREATED" | "PAID" | "CONFIRMED" | "COMPLETED" | "CANCELED";
export type FulfillmentType = "DELIVERY" | "PICKUP";
export type DeliveryStatus = "NONE" | "READY" | "DELIVERING" | "DELIVERED";
export type PaymentMethod = "BANK_TRANSFER" | "CARD";

export interface OrderItemCreateRequest {
  productName: string;
  unitPrice: number;
  quantity: number;
  productId: number;
}

export interface OrderCreateRequest {
  paymentMethod: PaymentMethod;
  items: OrderItemCreateRequest[];
  cashReceipt?: boolean;
  receiptType?: "personal" | "business";
  receiptValue?: string;
  deliveryFee?: number;
  finalAmount: number;
}

export interface OrderItemResponse {
  orderItemId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderResponse {
  orderId: number;
  customerId: number;
  orderNo: string;
  status: OrderStatus;
  canceledBy?: "CUSTOMER" | "ADMIN";
  cancelReason?: string;
  canceledAt?: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address1: string;
  address2: string;
  subtotalAmount: number;
  deliveryFee: number;
  discountAmount: number;
  finalAmount: number;
  cashReceipt: boolean;
  cashReceiptNo?: string;
  fulfillmentType: FulfillmentType;
  deliveryStatus: DeliveryStatus;
  trackingNo?: string;
  items: OrderItemResponse[];
}

export interface OrderDeliveryStartRequest {
  trackingNo: string;
}

export interface OrderCancelRequest {
  reason: string;
}

// Pricing 관련
export interface PricingItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface PricingRequest {
  paymentMethod: PaymentMethod;
  zipCode?: string;
  items: PricingItem[];
}

export interface DiscountLine {
  label: string;
  amount: number;
}

export interface ItemAvailability {
  stockQty: number;
  safetyStock: number;
  soldOutStatus: "IN_STOCK" | "LOW_STOCK" | "SOLD_OUT";
  orderable: boolean;
  blockReason?: string;
}

export interface ItemPricingBreakdown {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  itemSubtotal: number;
  discounts: DiscountLine[];
  itemDiscountTotal: number;
  itemFinal: number;
  availability: ItemAvailability;
}

export interface OrderPricingResponse {
  items: ItemPricingBreakdown[];
  subtotalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  finalAmount: number;
}

// Payment 관련
export type PaymentStatus = "READY" | "PAID" | "FAILED" | "CANCELED";

export interface PaymentCreateRequest {
  method: PaymentMethod;
  memo?: string;
}

export interface PaymentMarkPaidRequest {
  pgPaymentKey?: string;
}

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  memo?: string;
  pgPaymentKey?: string;
}

// Discount Policy 관련
export type DiscountRuleType =
  | "BANK_TRANSFER_FIXED"
  | "BANK_TRANSFER_RATE"
  | "QTY_FIXED"
  | "QTY_RATE";

export type ApplyScope = "ALL" | "PICKUP";

export interface DiscountRule {
  id: number;
  createDate: string;
  updateDate: string;
  policy: DiscountPolicy;
  type: DiscountRuleType;
  targetProductId: number;
  label: string;
  discountRate?: number;
  amountOff?: number;
  minAmount: number;
  minQty: number;
  active: boolean;
  rateType: boolean;
  fixedType: boolean;
}

export interface DiscountRuleResponse {
  id: number;
  type: DiscountRuleType;
  label: string;
  targetProductId: number;
  discountRate?: number;
  amountOff?: number;
  minAmount: number;
  minQty: number;
  active: boolean;
  applyScope?: ApplyScope;
}

export interface DiscountRuleCreateRequest {
  policyId: number;
  type: DiscountRuleType;
  targetProductId: number;
  label: string;
  discountRate?: number;
  amountOff?: number;
  minAmount?: number;
  minQty?: number;
  active?: boolean;
}

export interface DiscountRuleUpdateRequest {
  label?: string;
  type?: DiscountRuleType;
  targetProductId?: number;
  discountRate?: number;
  minAmount?: number;
  minQty?: number;
  active?: boolean;
}

export interface DiscountPolicy {
  id: number;
  createDate: string;
  updateDate: string;
  name: string;
  policyStartDate: string;
  policyEndDate: string;
  active: boolean;
  rules: DiscountRule[];
}

export interface DiscountPolicyResponse {
  id: number;
  name: string;
  startAt: string;
  endAt: string;
  active: boolean;
  rules: DiscountRuleResponse[];
}

export interface DiscountPolicyCreateRequest {
  name: string;
  startAt: string;
  endAt: string;
  active?: boolean;
}

// Shipping Policy 관련
export type ShippingRuleType = "ZIP_PREFIX_FEE" | "FREE_OVER_AMOUNT" | "DEFAULT_FEE";

export interface ShippingRule {
  id: number;
  createDate: string;
  updateDate: string;
  policy: ShippingPolicy;
  type: ShippingRuleType;
  label: string;
  zipPrefix?: string;
  fee?: number;
  freeOverAmount?: number;
  active: boolean;
}

export interface ShippingRuleResponse {
  id: number;
  policyId: number;
  type: ShippingRuleType;
  label: string;
  zipPrefix?: string;
  fee?: number;
  freeOverAmount?: number;
  active: boolean;
}

export interface ShippingRuleCreateRequest {
  policyId: number;
  type: ShippingRuleType;
  label: string;
  zipPrefix?: string;
  fee?: number;
  freeOverAmount?: number;
  active?: boolean;
}

export interface ShippingPolicy {
  id: number;
  createDate: string;
  updateDate: string;
  name: string;
  startAt: string;
  endAt: string;
  active: boolean;
  rules: ShippingRule[];
}

export interface ShippingPolicyResponse {
  id: number;
  name: string;
  startAt: string;
  endAt: string;
  active: boolean;
  rules: ShippingRuleResponse[];
}

export interface ShippingPolicyCreateRequest {
  name: string;
  startAt: string;
  endAt: string;
  active?: boolean;
}

// Feature 관련
export interface FeatureFlagResponse {
  key: string;
  enabled: boolean;
  description?: string;
}
