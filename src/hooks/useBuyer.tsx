import { useState } from "react";
import { identifyCustomer } from "../api/customer";

export const useBuyer = () => {
    const [buyerName, setBuyerName] = useState("");
    const [buyerPhone, setBuyerPhone] = useState("");
    const [buyerId, setBuyerId] = useState<number | null>(null);

    const handleLogin = async () => {
        if (!buyerName.trim() || !buyerPhone.trim()) {
            alert("⚠️ 이름과 연락처를 모두 입력해주세요.");
            return;
        }
        try {
            const res = await identifyCustomer({
                name: buyerName,
                phone: buyerPhone,
            });
            setBuyerId(res.data.customerId);
            console.log("Identify response:", res.data);
            console.log("Customer blocked status:", res.data.blocked);
        } catch (e: any) {
            console.error("identify error:", e.response?.data || e.message);
            alert("고객 정보 확인 중 오류가 발생했습니다.");
        }
    };

    return {
        buyerName,
        setBuyerName,
        buyerPhone,
        setBuyerPhone,
        buyerId,
        setBuyerId,
        handleLogin,
    };
};

export default useBuyer;
