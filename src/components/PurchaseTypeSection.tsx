// src/components/PurchaseTypeSection.tsx
import React from "react";
import { Address, PurchaseType } from "../types/types";
import { SHOP_ADDRESS, SHOP_PHONE } from "../constants/index";

interface Props {
    purchaseType: PurchaseType;
    setPurchaseType: (v: PurchaseType) => void;
    address: Address;
    setAddress: React.Dispatch<React.SetStateAction<Address>>;
    entranceCode: string;
    setEntranceCode: (v: string) => void;
    openAddressModal: () => void;
    defaultAddress: Address;
    bankTransferEnabled?: boolean;
}

export const PurchaseTypeSection: React.FC<Props> = ({ purchaseType, setPurchaseType, address, setAddress, entranceCode, setEntranceCode, openAddressModal, defaultAddress, bankTransferEnabled = true }) => {
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
                        if (!bankTransferEnabled) {
                            alert("⚠️ 현재 배송 주문이 불가능합니다. 무통장 입금 기능이 비활성화되어 있습니다.");
                            return;
                        }
                        setPurchaseType("delivery");
                    }}
                    disabled={!bankTransferEnabled}
                    style={{
                        padding: "12px",
                        border: purchaseType === "delivery" ? "1px solid #111" : "1px solid #ccc",
                        borderRadius: "12px",
                        cursor: bankTransferEnabled ? "pointer" : "not-allowed",
                        fontWeight: 600,
                        background: purchaseType === "delivery" ? "#111" : (bankTransferEnabled ? "#fff" : "#f5f5f5"),
                        color: purchaseType === "delivery" ? "#fff" : (bankTransferEnabled ? "#000" : "#999"),
                        opacity: bankTransferEnabled ? 1 : 0.6,
                    }}
                >
                    배달{!bankTransferEnabled && " (불가)"}
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
                    {defaultAddress.address1 && (
                        <div 
                            style={{ 
                                fontWeight: 500, 
                                color: "#1E6EFF", 
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "8px",
                                marginBottom: "8px",
                                background: "#f0f7ff",
                                border: "1px solid #1E6EFF",
                                transition: "all 0.2s"
                            }} 
                            onClick={() => {
                                setAddress({
                                    ...defaultAddress,
                                    addressId: defaultAddress.addressId || "",
                                });
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#e0f0ff";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#f0f7ff";
                            }}
                        >
                            📍 기본 배송지 불러오기
                        </div>
                    )}
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
                        🚚 <b>배송정책:</b> 4만원 이상 무료배송 / 4만원 미만 3,000원
                    </div>
                </div>
            )}
        </div>
    );
};
