import { useEffect, useState } from "react";
import { Discount, DiscountRule, FetchedMenuItem, MenuItem } from "../types/types";
import { getProducts } from "../api/product";
import { getActiveDiscountPolicies } from "../api/discount";
import type { DiscountRuleResponse } from "../types/api";

export const useItems = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    const convertRuleToDiscount = (rule: DiscountRuleResponse): Discount => ({
        label: rule.label,
        type: rule.type.includes("RATE") ? "RATE" : "FIXED",
        value: rule.type.includes("RATE") ? (rule.discountRate || 0) : (rule.amountOff || 0),
        minAmount: rule.minAmount,
        minQty: rule.minQty,
        applyScope: rule.applyScope || "ALL",
    });

    useEffect(() => {
        const init = async () => {
            try {
                const [itemsRes, rulesRes] = await Promise.all([
                    getProducts(),
                    getActiveDiscountPolicies(),
                ]);

                // 삭제된 상품 및 안전재고 이하인 상품은 제외
                const items: MenuItem[] = itemsRes.data
                    .filter((i) => i.active !== false && !i.deletedAt) // 삭제된 상품 제외
                    .filter((i) => i.stockQty > i.safetyStock) // 안전재고 이하 제외
                    .map((i) => ({
                        productId: String(i.productId),
                        name: i.name,
                        price: i.price,
                        stockQty: i.stockQty,
                        safetyStock: i.safetyStock,
                        soldOutStatus: i.soldOutStatus,
                        category: i.category,
                        taxType: i.taxType,
                        bankDiscount: [],
                        qtyDiscount: [],
                    }));

                const rules: DiscountRuleResponse[] = rulesRes.data.flatMap(
                    (d) => d.rules
                );

                // merge
                rules.forEach((rule) => {
                    const idx = items.findIndex(
                        (it) => it.productId === String(rule.targetProductId)
                    );
                    if (idx !== -1) {
                        const discount = convertRuleToDiscount(rule);
                        if (rule.type.startsWith("BANK")) {
                            items[idx].bankDiscount.push(discount);
                        } else {
                            items[idx].qtyDiscount.push(discount);
                        }
                    }
                });

                setMenuItems(items);
            } catch (error) {
                console.error("Failed to load items:", error);
            }
        };

        init();
    }, []);

    return { menuItems, setMenuItems };
};

export default useItems;
