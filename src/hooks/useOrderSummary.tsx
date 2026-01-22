import { useState, useEffect } from "react";
import { calculatePricing } from "../api/order";
import type { SummaryInput } from "../types/types";
import type { OrderPricingResponse } from "../types/api";
import caculateDiscount from "../utils/calculateDiscount";

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

interface UseOrderSummaryInput extends SummaryInput {
    zipCode?: string; // 배송 주문인 경우 우편번호
}

export const useOrderSummary = ({ cart, paymentMethod, purchaseType, menuItems, zipCode }: UseOrderSummaryInput): UpdatedSummaryOutput | null => {
    const [pricing, setPricing] = useState<OrderPricingResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!cart.length) {
            setPricing(null);
            return;
        }

        const fetchPricing = async () => {
            setLoading(true);
            try {
                const pricingRequest: any = {
                    paymentMethod: paymentMethod,
                    items: cart.map((item) => {
                        const menuItem = menuItems.find((m) => m.productId === item.id);
                        return {
                            productId: Number(item.id),
                            productName: item.name,
                            unitPrice: item.price,
                            quantity: item.qty,
                        };
                    }),
                };
                
                // 배송일 때만 zipCode 전달 (픽업일 때는 전달하지 않음)
                if (purchaseType === "delivery" && zipCode) {
                    pricingRequest.zipCode = zipCode.trim();
                }

                console.log("Pricing request:", {
                    purchaseType,
                    zipCodeFromProps: zipCode,
                    zipCodeInRequest: pricingRequest.zipCode,
                    pricingRequest
                });

                const response = await calculatePricing(pricingRequest);
                if (response.data) {
                    console.log("Pricing response:", { 
                        fulfillmentType: pricingRequest.fulfillmentType,
                        deliveryFee: response.data.deliveryFee,
                        purchaseType 
                    });
                    setPricing(response.data);
                }
            } catch (error) {
                console.error("Failed to calculate pricing:", error);
                setPricing(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPricing();
    }, [cart, paymentMethod, purchaseType, menuItems, zipCode]);

    if (!pricing || loading) {
        return null;
    }

    // 서버 응답을 클라이언트 형식으로 변환하고, 픽업 할인 추가 적용
    const items: SummaryItem[] = pricing.items.map((item) => {
        const cartItem = cart.find((c) => Number(c.id) === item.productId);
        const menuItem = menuItems.find((m) => m.productId === item.productId.toString());
        
        if (!cartItem || !menuItem) {
            return {
                name: item.productName,
                qty: item.quantity,
                originPrice: item.itemSubtotal,
                finalPrice: item.itemFinal,
                info: item.discounts.map((disc) => `${disc.label} -₩${disc.amount.toLocaleString()}`),
            };
        }

        let additionalDiscount = 0;
        const additionalDiscountInfo: string[] = [];
        const unitPrice = item.unitPrice;
        const original = unitPrice * item.quantity;

        // 픽업인 경우 픽업 전용 할인 추가 적용
        if (purchaseType === "pickup") {
            // 수량 할인 중 픽업 전용 할인 적용
            menuItem.qtyDiscount.forEach((disc) => {
                if (disc.applyScope === "PICKUP") {
                    if (cartItem.qty >= disc.minQty && original >= disc.minAmount) {
                        const unitDiscAmount = caculateDiscount({ discount: disc, originalPrice: unitPrice });
                        if (unitDiscAmount > 0) {
                            const discAmount = unitDiscAmount * cartItem.qty;
                            additionalDiscount += discAmount;
                            additionalDiscountInfo.push(`${disc.label} -₩${discAmount.toLocaleString()}`);
                        }
                    }
                }
            });

            // 무통장 할인 중 픽업 전용 할인 적용
            if (paymentMethod === "BANK_TRANSFER") {
                menuItem.bankDiscount.forEach((disc) => {
                    if (disc.applyScope === "PICKUP") {
                        if (cartItem.qty >= disc.minQty && original >= disc.minAmount) {
                            const unitDiscAmount = caculateDiscount({ discount: disc, originalPrice: unitPrice });
                            if (unitDiscAmount > 0) {
                                const discAmount = unitDiscAmount * cartItem.qty;
                                additionalDiscount += discAmount;
                                additionalDiscountInfo.push(`${disc.label} -₩${discAmount.toLocaleString()}`);
                            }
                        }
                    }
                });
            }
        }

        return {
            name: item.productName,
            qty: item.quantity,
            originPrice: item.itemSubtotal,
            finalPrice: item.itemFinal - additionalDiscount,
            info: [...item.discounts.map((disc) => `${disc.label} -₩${disc.amount.toLocaleString()}`), ...additionalDiscountInfo],
        };
    });

    const origin = pricing.items.reduce((sum, item) => sum + item.itemSubtotal, 0);
    
    // 클라이언트에서 추가로 적용한 할인 금액 계산
    const additionalDiscountAmount = items.reduce((sum, item, idx) => {
        const originalFinal = pricing.items[idx]?.itemFinal || 0;
        return sum + (originalFinal - item.finalPrice);
    }, 0);
    
    // 총 할인 금액 = 서버 할인 + 클라이언트 추가 할인
    const totalDiscount = pricing.discountAmount + additionalDiscountAmount;
    
    // 할인 후 상품 합계
    const totalAfterDiscount = pricing.subtotalAmount - totalDiscount;
    
    // 배송비: 픽업이면 0, 배송이면 서버에서 계산한 값 사용
    const shipping = purchaseType === "pickup" ? 0 : pricing.deliveryFee;
    
    // 최종 결제 금액 = 할인 후 상품 합계 + 배송비
    const finalPrice = totalAfterDiscount + shipping;

    return {
        items,
        origin,
        total: totalAfterDiscount,
        disc: totalDiscount,
        shipping: shipping,
        finalPrice: finalPrice,
    };
};
