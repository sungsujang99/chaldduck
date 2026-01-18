// src/hooks/useOrderSummary.ts (또는 적절한 경로)

import { FREE_SHIPPING_THRESHOLD, DELIVERY_FEE } from "../constants";
import type { SummaryInput, SummaryOutput } from "../types/types";
import caculateDiscount from "../utils/calculateDiscount";

// SummaryOutput 타입도 info 추가 반영 필요 (아래에서 수정 제안할게요)

interface SummaryItem {
    name: string;
    qty: number;
    originPrice: number;
    finalPrice: number;
    info: string[]; // 할인 내역 설명 배열
}

export interface UpdatedSummaryOutput {
    items: SummaryItem[];
    origin: number;
    total: number;
    disc: number;
    shipping: number;
    finalPrice: number;
}

export const useOrderSummary = ({ cart, paymentMethod, purchaseType, menuItems }: SummaryInput): UpdatedSummaryOutput | null => {
    if (!cart.length) return null;

    let origin = 0;
    let total = 0;
    let disc = 0;

    const items = cart.map((it) => {
        const p = menuItems.find((x) => x.productId === it.id)!;
        const original = p.price * it.qty;
        origin += original;
        let d = 0;
        const info: string[] = [];
        // 할인 적용 범위 체크 함수
        const isApplicable = (applyScope?: string) => {
            if (!applyScope || applyScope === "ALL") return true;
            if (applyScope === "PICKUP" && purchaseType === "pickup") return true;
            return false;
        };

        if (paymentMethod === "BANK_TRANSFER") {
            p.bankDiscount.forEach((e) => {
                if (!isApplicable(e.applyScope)) return; // 픽업 전용 할인 체크
                if (it.qty < e.minQty || original < e.minAmount) return;
                let discAmount = caculateDiscount({ discount: e, originalPrice: original });
                if (discAmount === 0) return;
                d += discAmount;
                disc += discAmount;
                info.push(`${e.label} -₩${discAmount.toLocaleString()}`);
            });
        }

        p.qtyDiscount.forEach((e) => {
            if (!isApplicable(e.applyScope)) return; // 픽업 전용 할인 체크
            if (it.qty < e.minQty || original < e.minAmount) return;
            let discAmount = caculateDiscount({ discount: e, originalPrice: original });
            if (discAmount === 0) return;
            d += discAmount;
            disc += discAmount;
            info.push(`${e.label} -₩${discAmount.toLocaleString()}`);
        });

        const final = original - d;
        total += final;

        return {
            name: p.name,
            qty: it.qty,
            originPrice: original,
            finalPrice: final,
            info, // ← 여기 추가!
        };
    });

    const shipping = total >= FREE_SHIPPING_THRESHOLD || purchaseType === "pickup" ? 0 : DELIVERY_FEE;
    const finalPrice = total + shipping;

    return {
        items,
        total,
        disc,
        origin,
        shipping,
        finalPrice,
    };
};
