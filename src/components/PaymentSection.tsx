// src/components/PaymentSection.tsx
import React from "react";
import { PaymentMethod, ReceiptType } from "../types/types";
import { BANK_ACCOUNT } from "../constants/index";

interface Props {
    paymentMethod: PaymentMethod;
    setPaymentMethod: (v: PaymentMethod) => void;
    showReceipt: boolean;
    setShowReceipt: (v: boolean) => void;
    receiptType: ReceiptType;
    setReceiptType: (v: ReceiptType) => void;
    receiptValue: string;
    setReceiptValue: (v: string) => void;
    deliveryOrderEnabled?: boolean;
}

export const PaymentSection: React.FC<Props> = ({
    paymentMethod,
    setPaymentMethod,
    showReceipt,
    setShowReceipt,
    receiptType,
    setReceiptType,
    receiptValue,
    setReceiptValue,
    deliveryOrderEnabled = true,
}) => {
    const toggleReceipt = (show: boolean) => {
        setShowReceipt(show);
        if (!show) {
            setReceiptType("");
            setReceiptValue("");
        }
    };

    return (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: "16px", padding: "16px", marginBottom: "18px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>💳 결제 방식</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                    onClick={() => setPaymentMethod("BANK_TRANSFER")}
                    style={{
                        padding: "12px",
                        border: paymentMethod === "BANK_TRANSFER" ? "1px solid #111" : "1px solid #ccc",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: 600,
                        background: paymentMethod === "BANK_TRANSFER" ? "#111" : "#fff",
                        color: paymentMethod === "BANK_TRANSFER" ? "#fff" : "#000",
                    }}
                >
                    무통장입금
                </button>
                <button
                    onClick={() => {
                        setPaymentMethod("CARD");
                        //alert("카드 도입 심사용");
                    }}
                    style={{
                        padding: "12px",
                        border: paymentMethod === "CARD" ? "1px solid #111" : "1px solid #ccc",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontWeight: 600,
                        background: paymentMethod === "CARD" ? "#111" : "#fff",
                        color: paymentMethod === "CARD" ? "#fff" : "#000",
                    }}
                >
                    카드/간편결제
                </button>
            </div>

            {paymentMethod === "BANK_TRANSFER" && (
                <div style={{ marginTop: "10px" }}>
                    <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                        <b>입금 계좌:</b> {BANK_ACCOUNT}
                    </div>
                    <div style={{ marginTop: "8px" }}>
                        <label style={{ fontWeight: "bold", fontSize: "14px" }}>현금영수증</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                            <button
                                onClick={() => toggleReceipt(true)}
                                style={{
                                    padding: "12px",
                                    border: showReceipt ? "1px solid #111" : "1px solid #ccc",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    background: showReceipt ? "#111" : "#fff",
                                    color: showReceipt ? "#fff" : "#000",
                                }}
                            >
                                발급
                            </button>
                            <button
                                onClick={() => toggleReceipt(false)}
                                style={{
                                    padding: "12px",
                                    border: !showReceipt ? "1px solid #111" : "1px solid #ccc",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    background: !showReceipt ? "#111" : "#fff",
                                    color: !showReceipt ? "#fff" : "#000",
                                }}
                            >
                                미발급
                            </button>
                        </div>
                        {showReceipt && (
                            <div style={{ marginTop: "8px" }}>
                                <select
                                    value={receiptType}
                                    onChange={(e) => {
                                        setReceiptType(e.target.value as ReceiptType);
                                        setReceiptValue("");
                                    }}
                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginTop: "8px", boxSizing: "border-box" }}
                                >
                                    <option value="">발급 유형 선택</option>
                                    <option value="personal">개인소득공제</option>
                                    <option value="business">사업자증빙</option>
                                </select>
                                {receiptType === "personal" && (
                                    <input
                                        type="tel"
                                        placeholder="휴대폰 번호 입력"
                                        value={receiptValue}
                                        onChange={(e) => setReceiptValue(e.target.value)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginTop: "8px", boxSizing: "border-box" }}
                                    />
                                )}
                                {receiptType === "business" && (
                                    <input
                                        type="text"
                                        placeholder="사업자등록번호 입력"
                                        value={receiptValue}
                                        onChange={(e) => setReceiptValue(e.target.value)}
                                        style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginTop: "8px", boxSizing: "border-box" }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {paymentMethod === "CARD" && (
                <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
                    <p style={{ margin: 0 }}>주문하기 버튼을 누르면 토스페이먼츠 결제창이 열립니다.</p>
                    <p style={{ margin: "4px 0 0 0" }}>카드, 계좌이체, 간편결제(토스페이, 카카오페이 등)를 이용할 수 있습니다.</p>
                </div>
            )}
        </div>
    );
};
