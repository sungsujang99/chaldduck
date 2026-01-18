import { FetchedMenuItem } from "../types/types";

export const FREE_SHIPPING_THRESHOLD = 40000;
export const DELIVERY_FEE = 3000;

export const products_default = [
    { id: "cake001", name: "찰떡케이크", price: 28000, bankDiscount: 2000, bulkThreshold: 3, bulkDiscount: 1000 },
    { id: "cake002", name: "딸기찰떡케이크", price: 32000, bankDiscount: 3000, bulkThreshold: 3, bulkDiscount: 1500 },
    { id: "cake003", name: "초코찰떡롤", price: 26000, bankDiscount: 1500, bulkThreshold: 2, bulkDiscount: 800 },
    { id: "pudding001", name: "흑임자푸딩", price: 6500, bankDiscount: 500, bulkThreshold: 5, bulkDiscount: 300 },
];

export const BANK_ACCOUNT = "우리은행 1005904547315 (찰떡상회)";
export const SHOP_ADDRESS = "경상남도 김해시 율하2로 126번길 8, 1층(율하동)";
export const SHOP_PHONE = "010-4144-0933";
