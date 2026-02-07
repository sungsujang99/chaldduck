// src/components/PurchaseTypeSection.tsx
import React, { useEffect, useState } from "react";
import { Address, PurchaseType } from "../types/types";
import { SHOP_ADDRESS, SHOP_PHONE } from "../constants/index";
import { getActiveShippingPolicies } from "../api/shipping";
import { ShippingPolicyResponse } from "../types/api";

interface Props {
    purchaseType: PurchaseType;
    setPurchaseType: (v: PurchaseType) => void;
    address: Address;
    setAddress: React.Dispatch<React.SetStateAction<Address>>;
    entranceCode: string;
    setEntranceCode: (v: string) => void;
    openAddressModal: () => void;
    deliveryOrderEnabled?: boolean;
}

export const PurchaseTypeSection: React.FC<Props> = ({ purchaseType, setPurchaseType, address, setAddress, entranceCode, setEntranceCode, openAddressModal, deliveryOrderEnabled = true }) => {
    const [shippingPolicyText, setShippingPolicyText] = useState<string>("배송비 정책을 불러오는 중...");

    useEffect(() => {
        const fetchShippingPolicy = async () => {
            try {
                const res = await getActiveShippingPolicies();
                const policies: ShippingPolicyResponse[] = res.data;

                // 활성 정책 필터링
                const now = new Date();
                const activePolicies = policies.filter((policy) => {
                    if (!policy.active) return false;
                    const startAt = new Date(policy.startAt);
                    const endAt = new Date(policy.endAt);
                    return now >= startAt && now <= endAt;
                });

                // FREE_OVER_AMOUNT와 DEFAULT_FEE 룰 찾기
                let freeOverAmount: number | null = null;
                let defaultFee: number | null = null;

                for (const policy of activePolicies) {
                    if (!policy.rules || policy.rules.length === 0) continue;

                    for (const rule of policy.rules) {
                        if (!rule.active) continue;
                        if (rule.applyScope && rule.applyScope !== "ALL") continue;

                        if (rule.type === "FREE_OVER_AMOUNT" && rule.freeOverAmount) {
                            freeOverAmount = rule.freeOverAmount;
                        }
                        if (rule.type === "DEFAULT_FEE" && rule.fee !== undefined) {
                            defaultFee = rule.fee;
                        }
                    }
                }

                // 배송비 정책 텍스트 생성
                if (freeOverAmount !== null && defaultFee !== null) {
                    setShippingPolicyText(
                        `${freeOverAmount.toLocaleString()}원 이상 무료배송 / ${freeOverAmount.toLocaleString()}원 미만 ${defaultFee.toLocaleString()}원`
                    );
                } else if (freeOverAmount !== null) {
                    setShippingPolicyText(`${freeOverAmount.toLocaleString()}원 이상 무료배송`);
                } else if (defaultFee !== null) {
                    setShippingPolicyText(`배송비 ${defaultFee.toLocaleString()}원`);
                } else {
                    setShippingPolicyText("배송비 정책이 없습니다");
                }
            } catch (error) {
                console.error("Failed to fetch shipping policy:", error);
                setShippingPolicyText("배송비 정책을 불러올 수 없습니다");
            }
        };

        if (purchaseType === "delivery") {
            fetchShippingPolicy();
        }
    }, [purchaseType]);
    return (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "16px", padding: "16px", marginBottom: "18px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>🏪 구매 방식</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                    onClick={() => setPurchaseType("pickup")}
                    style={{
                        padding: "12px",
                        border: purchaseType === "pickup" ? "1px solid #111" : "1px solid #ccc",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: 600,
                        background: purchaseType === "pickup" ? "#111" : "#fff",
                        color: purchaseType === "pickup" ? "#fff" : "#000",
                    }}
                >
                    픽업
                </button>
                <button
                    onClick={() => {
                        if (!deliveryOrderEnabled) {
                            alert("⚠️ 현재 배송 주문이 불가능합니다.");
                            return;
                        }
                        setPurchaseType("delivery");
                    }}
                    disabled={!deliveryOrderEnabled}
                    style={{
                        padding: "12px",
                        border: purchaseType === "delivery" ? "1px solid #111" : "1px solid #ccc",
                        borderRadius: "12px",
                        cursor: deliveryOrderEnabled ? "pointer" : "not-allowed",
                        fontWeight: 600,
                        background: purchaseType === "delivery" ? "#111" : (deliveryOrderEnabled ? "#fff" : "#f5f5f5"),
                        color: purchaseType === "delivery" ? "#fff" : (deliveryOrderEnabled ? "#000" : "#999"),
                        opacity: deliveryOrderEnabled ? 1 : 0.6,
                    }}
                >
                    배달{!deliveryOrderEnabled && " (불가)"}
                </button>
            </div>

            {purchaseType === "pickup" && (
                <div style={{ marginTop: "10px", fontSize: "14px", lineHeight: "1.6" }}>
                    📍 <b>찰떡상회 본점</b>
                    <br />
                    {SHOP_ADDRESS}
                    <br />
                    ☎️ {SHOP_PHONE}
                </div>
            )}

            {purchaseType === "delivery" && (
                <div style={{ marginTop: "10px" }}>
                    <input
                        type="text"
                        value={address.address1}
                        placeholder="배달 주소를 입력하세요"
                        readOnly
                        style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginTop: "8px", boxSizing: "border-box" }}
                    />
                    <button
                        onClick={openAddressModal}
                        style={{
                            padding: "12px",
                            border: "1px solid #ccc",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontWeight: 600,
                            width: "100%",
                            marginTop: "8px",
                            background: "#fff",
                        }}
                    >
                        📍 주소찾기
                    </button>
                    <input
                        type="text"
                        value={address.address2}
                        onChange={(e) => setAddress((prev) => ({ ...prev, address2: e.target.value }))}
                        placeholder="상세주소를 입력하세요 (동/호수 등)"
                        style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginTop: "8px", boxSizing: "border-box" }}
                    />
                    <input
                        type="text"
                        value={entranceCode}
                        onChange={(e) => setEntranceCode(e.target.value)}
                        placeholder="공동현관 비밀번호 (선택)"
                        style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginTop: "8px", boxSizing: "border-box" }}
                    />
                    <div style={{ fontSize: "13px", color: "#000", background: "#f9f9f9", borderRadius: "10px", padding: "8px", marginTop: "8px", border: "1px dashed #ddd" }}>
                        🚚 <b>배송정책:</b> {shippingPolicyText}
                    </div>
                </div>
            )}
        </div>
    );
};
