import { useState, useEffect } from "react";
import { calculatePricing } from "../api/order";
import { getActiveShippingPolicies } from "../api/shipping";
import type { SummaryInput } from "../types/types";
import type { OrderPricingResponse, PricingRequest, ShippingPolicyResponse } from "../types/api";
import caculateDiscount from "../utils/calculateDiscount";

interface SummaryItem {
    name: string;
    qty: number;
    originPrice: number;
    finalPrice: number;
    info: string[]; // 할인 내역 설명 배열
    taxType?: "TAXABLE" | "TAX_EXEMPT"; // 세금 유형
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
    // 배송비 정책과 가격 정보를 함께 저장
    const [pricingData, setPricingData] = useState<{
        pricing: OrderPricingResponse;
        shippingPolicies: ShippingPolicyResponse[];
    } | null>(null);

    useEffect(() => {
        if (!cart.length) {
            setPricing(null);
            setPricingData(null);
            return;
        }

        const fetchPricing = async () => {
            setLoading(true);
            try {
                // 가격 계산과 배송비 정책을 동시에 가져옴 (항시 확인)
                const [pricingResponse, shippingPoliciesResponse] = await Promise.all([
                    (async () => {
                        const pricingRequest: PricingRequest = {
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

                        return await calculatePricing(pricingRequest);
                    })(),
                    // 배송비 정책도 항시 확인
                    getActiveShippingPolicies().catch((error) => {
                        console.error("Failed to fetch shipping policies:", error);
                        return { data: [] };
                    })
                ]);

                const shippingPolicies = shippingPoliciesResponse.data || [];
                console.log("Shipping policies loaded:", shippingPolicies);

                if (pricingResponse.data) {
                    console.log("Pricing response:", { 
                        deliveryFee: pricingResponse.data.deliveryFee,
                        subtotalAmount: pricingResponse.data.subtotalAmount,
                        discountAmount: pricingResponse.data.discountAmount,
                        finalAmount: pricingResponse.data.finalAmount,
                        purchaseType,
                        fullResponse: pricingResponse.data
                    });
                    setPricing(pricingResponse.data);
                    // 가격 정보와 배송비 정책을 함께 저장
                    setPricingData({
                        pricing: pricingResponse.data,
                        shippingPolicies: shippingPolicies
                    });
                }
            } catch (error) {
                console.error("Failed to calculate pricing:", error);
                setPricing(null);
                setPricingData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPricing();
    }, [cart, paymentMethod, purchaseType, menuItems, zipCode]);

    if (!pricing || !pricingData || loading) {
        return null;
    }

    const shippingPolicies = pricingData.shippingPolicies;

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
                taxType: menuItem?.taxType, // menuItem이 없어도 undefined로 설정
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

        // 상품의 세금 유형 확인
        const productTaxType = menuItem?.taxType;

        return {
            name: item.productName,
            qty: item.quantity,
            originPrice: item.itemSubtotal,
            finalPrice: item.itemFinal - additionalDiscount,
            info: [...item.discounts.map((disc) => `${disc.label} -₩${disc.amount.toLocaleString()}`), ...additionalDiscountInfo],
            taxType: productTaxType,
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
    
    // 배송비 계산: 서버에서 받은 배송비를 기준으로 무료 배송 정책 확인
    // 서버가 이미 배송비를 계산했지만, 클라이언트에서 배송비 정책을 다시 확인하여 보정
    let shipping = pricing.deliveryFee;
    
    // 픽업인 경우 배송비는 항상 0
    if (purchaseType === "pickup") {
        shipping = 0;
    }
    // 배달인 경우에만 배송비 정책 확인
    else if (purchaseType === "delivery" && shippingPolicies.length > 0) {
        const comparisonAmount = pricing.subtotalAmount;
        let shippingRuleApplied = false;
        
        console.log("Checking shipping policies:", {
            totalPolicies: shippingPolicies.length,
            zipCode,
            comparisonAmount,
            serverDeliveryFee: pricing.deliveryFee
        });
        
        // 활성 정책 수집
        const activePolicies = shippingPolicies.filter((policy) => {
            if (!policy.active) return false;
            const now = new Date();
            const startAt = new Date(policy.startAt);
            const endAt = new Date(policy.endAt);
            return now >= startAt && now <= endAt;
        });
        
        console.log("Active policies:", activePolicies.length, activePolicies.map(p => ({ name: p.name, rulesCount: p.rules?.length || 0 })));
        
        // ZIP_CODE_DISCOUNT 룰만 확인 (지역별 배송비 룰)
        if (zipCode) {
            for (const policy of activePolicies) {
                if (!policy.rules || policy.rules.length === 0) continue;
                
                for (const rule of policy.rules) {
                    // ZIP_CODE_DISCOUNT 타입이고, 활성이고, zipPrefix가 있는 룰만 확인
                    if (!rule.active || rule.type !== "ZIP_CODE_DISCOUNT" || !rule.zipPrefix) continue;
                    
                    // applyScope 확인
                    if (rule.applyScope && rule.applyScope !== "ALL") continue;
                    
                    // 우편번호 비교 (5자리 전체)
                    const zipCodePrefix = zipCode.substring(0, Math.min(5, rule.zipPrefix.length));
                    const rulePrefix = rule.zipPrefix.substring(0, Math.min(5, rule.zipPrefix.length));
                    
                    console.log("Checking ZIP_CODE_DISCOUNT rule:", {
                        ruleLabel: rule.label,
                        zipCode,
                        ruleZipPrefix: rule.zipPrefix,
                        zipCodePrefix,
                        rulePrefix,
                        match: zipCodePrefix === rulePrefix,
                        freeOverAmount: rule.freeOverAmount,
                        fee: rule.fee,
                        comparisonAmount
                    });
                    
                    if (zipCodePrefix !== rulePrefix) continue;
                    
                    // 우편번호가 일치하면 해당 룰의 배송비 적용
                    // 1. 무료 배송 조건 확인 (freeOverAmount가 있고 조건 만족)
                    if (rule.freeOverAmount && comparisonAmount >= rule.freeOverAmount) {
                        shipping = 0;
                        shippingRuleApplied = true;
                        console.log("✅ ZIP_CODE_DISCOUNT free shipping applied:", {
                            ruleLabel: rule.label,
                            zipCode,
                            freeOverAmount: rule.freeOverAmount,
                            comparisonAmount
                        });
                        break;
                    }
                    // 2. 무료 배송 조건을 만족하지 않으면 해당 룰의 배송비 적용
                    else if (rule.fee !== undefined) {
                        shipping = rule.fee;
                        shippingRuleApplied = true;
                        console.log("✅ ZIP_CODE_DISCOUNT fee applied:", {
                            ruleLabel: rule.label,
                            zipCode,
                            fee: rule.fee,
                            comparisonAmount,
                            freeOverAmount: rule.freeOverAmount
                        });
                        break;
                    }
                }
                
                if (shippingRuleApplied) break;
            }
        }
        
        // ZIP_CODE_DISCOUNT가 적용되지 않은 경우에만 DEFAULT_FEE 확인
        // (우편번호가 일치하지 않거나 ZIP_CODE_DISCOUNT 룰이 없는 경우)
        
        // 무료 배송이 적용되지 않은 경우 DEFAULT_FEE 확인
        // 서버가 deliveryFee를 0으로 반환했어도 클라이언트에서 배송비 정책 확인하여 설정
        if (!shippingRuleApplied) {
            console.log("No free shipping applied, checking DEFAULT_FEE...");
            for (const policy of activePolicies) {
                if (!policy.rules || policy.rules.length === 0) continue;
                
                const defaultFeeRule = policy.rules.find(
                    (rule) => rule.type === "DEFAULT_FEE" && rule.active && rule.fee !== undefined && (!rule.applyScope || rule.applyScope === "ALL")
                );
                
                if (defaultFeeRule && defaultFeeRule.fee !== undefined) {
                    shipping = defaultFeeRule.fee;
                    console.log("✅ DEFAULT_FEE applied:", {
                        ruleLabel: defaultFeeRule.label,
                        fee: defaultFeeRule.fee,
                        serverDeliveryFee: pricing.deliveryFee,
                        finalShipping: shipping
                    });
                    break;
                }
            }
            
            // DEFAULT_FEE도 없고 서버가 0을 반환한 경우, 서버 값을 그대로 사용
            if (shipping === 0 && pricing.deliveryFee === 0) {
                console.log("❌ No shipping policy applied, using server deliveryFee: 0");
            }
        }
        
        console.log("Final shipping calculation:", {
            shippingRuleApplied,
            finalShipping: shipping,
            serverDeliveryFee: pricing.deliveryFee
        });
    }
    
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
