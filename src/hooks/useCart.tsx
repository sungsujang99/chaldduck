import { useState } from "react";
import type { CartItem, FetchedMenuItem } from "../types/types";

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const changeQty = (item: FetchedMenuItem, delta: number) => {
        const { productId, name, price } = item;
        setCart((prev) => {
            const existing = prev.find((x) => x.id === productId);

            if (!existing && delta > 0) return [...prev, { id: productId, name: name, price: price, qty: 1 }];

            if (existing) {
                const newQty = Math.max(0, existing.qty + delta);
                if (newQty === 0) return prev.filter((x) => x.id !== productId);
                return prev.map((x) => (x.id === productId ? { ...x, qty: newQty } : x));
            }

            return prev;
        });
    };

    return { cart, setCart, changeQty };
};

export default useCart;
