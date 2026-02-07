// src/components/OrderSummary.tsx
import React, { useState } from "react";
import { SummaryOutput, PaymentMethod } from "../types/types";
import { UpdatedSummaryOutput } from "../hooks/useOrderSummary";

interface Props {
    summary: UpdatedSummaryOutput | null;
    onSubmit: () => void;
    agreeTerms: boolean;
    setAgreeTerms: (value: boolean) => void;
    agreePrivacy: boolean;
    setAgreePrivacy: (value: boolean) => void;
    isSubmitting?: boolean;
    paymentMethod: PaymentMethod;
}

export const OrderSummary: React.FC<Props> = ({ 
    summary, 
    onSubmit, 
    agreeTerms, 
    setAgreeTerms, 
    agreePrivacy, 
    setAgreePrivacy,
    isSubmitting = false,
    paymentMethod
}) => {
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    return (
        <>
            {/* 동의 체크박스 */}
            <div style={{ marginTop: "20px", padding: "16px", background: "#f9f9f9", borderRadius: "12px", border: "1px solid #eee" }}>
                <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "14px" }}>
                        <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            style={{ width: "18px", height: "18px", marginRight: "8px", cursor: "pointer" }}
                        />
                        <span>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowTermsModal(true);
                                }}
                                style={{ color: "#0066cc", textDecoration: "underline", marginRight: "4px" }}
                            >
                                이용약관
                        </a>
                            에 동의합니다. (필수)
                        </span>
                    </label>
                </div>
                <div>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "14px" }}>
                        <input
                            type="checkbox"
                            checked={agreePrivacy}
                            onChange={(e) => setAgreePrivacy(e.target.checked)}
                            style={{ width: "18px", height: "18px", marginRight: "8px", cursor: "pointer" }}
                        />
                        <span>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowPrivacyModal(true);
                                }}
                                style={{ color: "#0066cc", textDecoration: "underline", marginRight: "4px" }}
                            >
                                개인정보 처리방침
                        </a>
                            에 동의합니다. (필수)
                        </span>
                    </label>
                </div>
            </div>

            {/* 이용약관 모달 */}
            {showTermsModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                        padding: "20px",
                    }}
                    onClick={() => setShowTermsModal(false)}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "12px",
                            padding: "24px",
                            maxWidth: "600px",
                            width: "100%",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>이용약관</h3>
                            <button
                                onClick={() => setShowTermsModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    padding: "0",
                                    width: "30px",
                                    height: "30px",
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ fontSize: "12px", lineHeight: "1.6", color: "#333" }}>
                            <p>이용약관 내용을 확인하시려면 페이지 하단의 "📋 이용약관" 버튼을 클릭해주세요.</p>
                        </div>
                        <button
                            onClick={() => {
                                setAgreeTerms(true);
                                setShowTermsModal(false);
                            }}
                            style={{
                                width: "100%",
                                padding: "12px",
                                marginTop: "16px",
                                background: "#111",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "bold",
                                cursor: "pointer",
                            }}
                        >
                            동의하기
                        </button>
                    </div>
                </div>
            )}

            {/* 개인정보 처리방침 모달 */}
            {showPrivacyModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                        padding: "20px",
                    }}
                    onClick={() => setShowPrivacyModal(false)}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "12px",
                            padding: "24px",
                            maxWidth: "600px",
                            width: "100%",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>개인정보 처리방침</h3>
                            <button
                                onClick={() => setShowPrivacyModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    padding: "0",
                                    width: "30px",
                                    height: "30px",
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ fontSize: "12px", lineHeight: "1.6", color: "#333" }}>
                            <p>개인정보 처리방침 내용을 확인하시려면 페이지 하단의 "🔒 개인정보 처리방침" 버튼을 클릭해주세요.</p>
                        </div>
                        <button
                            onClick={() => {
                                setAgreePrivacy(true);
                                setShowPrivacyModal(false);
                            }}
                            style={{
                                width: "100%",
                                padding: "12px",
                                marginTop: "16px",
                                background: "#111",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "bold",
                                cursor: "pointer",
                            }}
                        >
                            동의하기
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => {
                    if (paymentMethod === "CARD") {
                        alert("⚠️ 카드/간편결제는 준비 중입니다. 무통장입금을 이용해주세요.");
                        return;
                    }
                    onSubmit();
                }}
                disabled={!agreeTerms || !agreePrivacy || isSubmitting || paymentMethod === "CARD"}
                style={{
                    width: "100%",
                    padding: "16px",
                    background: agreeTerms && agreePrivacy && !isSubmitting && paymentMethod !== "CARD" ? "#111" : "#ccc",
                    color: "#fff",
                    border: "none",
                    borderRadius: "16px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: agreeTerms && agreePrivacy && !isSubmitting && paymentMethod !== "CARD" ? "pointer" : "not-allowed",
                    marginTop: "20px",
                    marginBottom: "20px",
                    boxShadow: agreeTerms && agreePrivacy && !isSubmitting && paymentMethod !== "CARD" ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                    opacity: agreeTerms && agreePrivacy && !isSubmitting && paymentMethod !== "CARD" ? 1 : 0.6,
                }}
            >
                {isSubmitting ? "주문 처리 중..." : (summary ? `₩${summary.finalPrice.toLocaleString()} 주문하기` : "주문하기")}
            </button>
        </>
    );
};
