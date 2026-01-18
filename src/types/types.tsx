// src/types/index.ts
import type { PaymentMethod, ProductCategory, ApplyScope } from "./api";

export type PurchaseType = "pickup" | "delivery" | "";

export interface Product {
    id: string;
    name: string;
    price: number;
    bankDiscount: number;
    bulkThreshold: number;
    bulkDiscount: number;
}

export interface CartItem {
    id: string;
    qty: number;
    name: string;
    price: number;
}
export type MenuItem = FetchedMenuItem & { bankDiscount: Discount[]; qtyDiscount: Discount[] };

export type FetchedMenuItem = { productId: string; name: string; price: number; stockQty: number; safetyStock: number; soldOutStatus: string; category?: ProductCategory };
export type DiscountRule = {
    id: string;
    type: DiscountType;
    label: string;
    targetProductId: string;
    discountRate: number;
    amountOff: number;
    minAmount: number;
    minQty: number;
    active: boolean;
};
export type DiscountType = "BANK_TRANSFER_FIXED" | "BANK_TRANSFER_RATE" | "QTY_FIXED" | "QTY_RATE";
export type Discount = {
    label: string;
    type: "RATE" | "FIXED";
    value: number;
    minAmount: number;
    minQty: number;
    applyScope?: ApplyScope;
};

export type ReceiptType = "personal" | "business" | "";

export type SummaryInput = {
    menuItems: MenuItem[];
    cart: CartItem[];
    paymentMethod: PaymentMethod;
    purchaseType: PurchaseType;
};

export interface SummaryOutput {
    total: number;
    finalPrice: number;
    disc: number;
    shipping: number;
    items: {
        name: string;
        qty: number;
        unitPrice: number;
        finalPrice: number;
        info: string[];
    }[];
}

export interface OrderData {
    buyerName: string;
    buyerPhone: string;
    purchaseType: PurchaseType;
    address: string;
    addressDetail: string;
    entranceCode: string;
    cart: CartItem[];
    paymentMethod: PaymentMethod;
    showReceipt: boolean;
    receiptType: ReceiptType;
    receiptValue: string;
    deliveryCode: string;
    summary: SummaryOutput | null;
    isConfirmed: boolean;
    orderDate?: string;
}

export type Address = {
    addressId: string;
    label: string;
    recipientName: string;
    recipientPhone: string;
    zipCode: string;
    address1: string;
    address2: string;
    isDefault: boolean;
};

// API 타입과의 호환성을 위한 타입
export type { PaymentMethod, OrderStatus, FulfillmentType, DeliveryStatus } from "./api";

export type Order = {
    orderId: string;
    customerId: string;
    orderNo: string;
    status: string;
    recipientName: string;
    recipientPhone: string;
    zipcode: string;
    address1: string;
    address2: string;
    subtotalAmount: string;
    deliveryFee: string;
    discountAmount: string;
    finalAmount: string;
    items: {
        orderItemId: number;
        productName: string;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
    }[];
};
