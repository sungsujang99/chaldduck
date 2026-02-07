import { useState } from "react";
import type { CartItem, FetchedMenuItem } from "../types/types";

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const changeQty = (item: FetchedMenuItem, delta: number) => {
        const { productId, name, price, stockQty, safetyStock } = item;
        
        // 사용 가능한 최대 재고 (재고 - 안전재고)
        const maxAvailableQty = stockQty - safetyStock;
        
        setCart((prev) => {
            const existing = prev.find((x) => x.id === productId);

            if (!existing && delta > 0) {
                // 재고 체크: 최소 1개 이상 있어야 추가 가능
                if (maxAvailableQty < 1) {
                    alert(`⚠️ "${name}" 상품의 재고가 부족합니다. (재고: ${stockQty}, 안전재고: ${safetyStock})`);
                    return prev;
                }
                return [...prev, { id: productId, name: name, price: price, qty: 1 }];
            }

            if (existing) {
                const newQty = Math.max(0, existing.qty + delta);
                
                // 재고 체크: 사용 가능한 최대 재고를 초과할 수 없음
                if (newQty > maxAvailableQty) {
                    alert(`⚠️ "${name}" 상품의 재고가 부족합니다. (최대 주문 가능: ${maxAvailableQty}개)`);
                    return prev;
                }
                
                if (newQty === 0) return prev.filter((x) => x.id !== productId);
                return prev.map((x) => (x.id === productId ? { ...x, qty: newQty } : x));
            }

            return prev;
        });
    };

    return { cart, setCart, changeQty };
};

export default useCart;
