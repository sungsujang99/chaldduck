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
        
        console.log("🚚 배송비 정책 확인 시작:", {
            totalPolicies: shippingPolicies.length,
            zipCode,
            comparisonAmount,
            serverDeliveryFee: pricing.deliveryFee
        });
        
        // 활성 정책 수집 (현재 날짜 기준)
        const now = new Date();
        const activePolicies = shippingPolicies.filter((policy) => {
            if (!policy.active) return false;
            const startAt = new Date(policy.startAt);
            const endAt = new Date(policy.endAt);
            return now >= startAt && now <= endAt;
        });
        
        console.log("활성 정책:", activePolicies.length, activePolicies.map(p => ({ 
            name: p.name, 
            rulesCount: p.rules?.length || 0,
            rules: p.rules?.map(r => ({ type: r.type, label: r.label, active: r.active }))
        })));
        
        // 배송비 룰 우선순위:
        // 1. ZIP_CODE_DISCOUNT (우편번호 기반)
        // 2. FREE_OVER_AMOUNT (금액 기반 무료 배송)
        // 3. DEFAULT_FEE (기본 배송비)
        
        let ruleApplied = false;
        
        // 1단계: ZIP_CODE_DISCOUNT 확인 (최우선)
        // 우편번호가 일치하면 이 규칙만 적용하고 다른 규칙은 무시
        if (zipCode && !ruleApplied) {
            for (const policy of activePolicies) {
                if (!policy.rules || policy.rules.length === 0) continue;
                
                for (const rule of policy.rules) {
                    if (!rule.active || rule.type !== "ZIP_CODE_DISCOUNT" || !rule.zipCode) continue;
                    if (rule.applyScope && rule.applyScope !== "ALL") continue;
                    
                    // 우편번호 5자리 비교
                    const userZip = zipCode.substring(0, 5);
                    const ruleZip = rule.zipCode.substring(0, 5);
                    
                    console.log(`ZIP_CODE_DISCOUNT 룰 확인: ${rule.label}`, {
                        userZip,
                        ruleZip,
                        match: userZip === ruleZip,
                        fee: rule.fee,
                        freeOverAmount: rule.freeOverAmount,
                        comparisonAmount
                    });
                    
                    if (userZip !== ruleZip) continue;
                    
                    // ✅ 우편번호 일치! 이 규칙만 적용 (다른 FREE_OVER_AMOUNT, DEFAULT_FEE 무시)
                    ruleApplied = true;
                    
                    // 무료 배송 조건 확인
                    if (rule.freeOverAmount && comparisonAmount >= rule.freeOverAmount) {
                        shipping = 0;
                        console.log(`✅ ZIP_CODE_DISCOUNT 무료 배송 적용: ${rule.label}`, {
                            주문금액: `${comparisonAmount.toLocaleString()}원`,
                            무료배송조건: `${rule.freeOverAmount.toLocaleString()}원 이상`,
                            배송비: '0원'
                        });
                    } else {
                        // 무료 조건 미충족 → 해당 룰의 배송비 적용
                        shipping = rule.fee !== undefined ? rule.fee : 0;
                        console.log(`✅ ZIP_CODE_DISCOUNT 배송비 적용: ${rule.label}`, {
                            주문금액: `${comparisonAmount.toLocaleString()}원`,
                            무료배송조건: `${rule.freeOverAmount?.toLocaleString()}원 이상`,
                            설정된배송비: `${rule.fee}원`,
                            적용된배송비: `${shipping.toLocaleString()}원`
                        });
                        
                        // ⚠️ 서버에서 fee가 0이거나 없으면 경고
                        if (!rule.fee || rule.fee === 0) {
                            console.warn(`⚠️ 경고: 배송비 룰 "${rule.label}"의 fee가 ${rule.fee}원입니다. 서버 설정을 확인하세요!`);
                        }
                    }
                    
                    break; // 우편번호 일치하는 규칙 찾았으므로 종료
                }
                if (ruleApplied) break;
            }
        }
        
        // 2단계: FREE_OVER_AMOUNT 확인 (ZIP_CODE_DISCOUNT 적용 안된 경우만)
        if (!ruleApplied) {
            for (const policy of activePolicies) {
                if (!policy.rules || policy.rules.length === 0) continue;
                
                for (const rule of policy.rules) {
                    if (!rule.active || rule.type !== "FREE_OVER_AMOUNT") continue;
                    if (rule.applyScope && rule.applyScope !== "ALL") continue;
                    
                    console.log(`FREE_OVER_AMOUNT 룰 확인: ${rule.label}`, {
                        freeOverAmount: rule.freeOverAmount,
                        comparisonAmount,
                        eligible: rule.freeOverAmount && comparisonAmount >= rule.freeOverAmount
                    });
                    
                    if (rule.freeOverAmount && comparisonAmount >= rule.freeOverAmount) {
                        shipping = 0;
                        ruleApplied = true;
                        console.log(`✅ FREE_OVER_AMOUNT 무료 배송: ${rule.label} (${comparisonAmount} >= ${rule.freeOverAmount})`);
                        break;
                    }
                }
                if (ruleApplied) break;
            }
        }
        
        // 3단계: DEFAULT_FEE 확인 (위의 룰들이 적용 안된 경우)
        if (!ruleApplied) {
            console.log("DEFAULT_FEE 룰 확인 중...");
            for (const policy of activePolicies) {
                if (!policy.rules || policy.rules.length === 0) continue;
                
                for (const rule of policy.rules) {
                    if (!rule.active || rule.type !== "DEFAULT_FEE") continue;
                    if (rule.applyScope && rule.applyScope !== "ALL") continue;
                    if (rule.fee === undefined) continue;
                    
                    shipping = rule.fee;
                    ruleApplied = true;
                    console.log(`✅ DEFAULT_FEE 기본 배송비: ${rule.label} = ${rule.fee}원`);
                    break;
                }
                if (ruleApplied) break;
            }
        }
        
        // 어떤 룰도 적용되지 않은 경우
        if (!ruleApplied) {
            console.log("⚠️ 적용된 배송비 룰 없음 - 배송비 0원");
        }
        
        console.log("🚚 최종 배송비:", shipping);
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
