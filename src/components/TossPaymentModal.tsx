// src/components/TossPaymentModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { loadPaymentWidget, ANONYMOUS } from "@tosspayments/payment-widget-sdk";
import { TOSS_CLIENT_KEY } from "../constants/index";

const TOSS_PENDING_ORDER_KEY = "toss_pending_order";

export interface TossPendingOrderData {
    orderNo: string;
    finalAmount: number;
    buyerName: string;
    productAmount: number;
    discountAmount: number;
    deliveryFee: number;
}

export const getTossPendingOrder = (): TossPendingOrderData | null => {
    try {
        const data = sessionStorage.getItem(TOSS_PENDING_ORDER_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const clearTossPendingOrder = () => {
    sessionStorage.removeItem(TOSS_PENDING_ORDER_KEY);
};

interface TossPaymentModalProps {
    show: boolean;
    amount: number;
    orderNo: string;
    orderName: string;
    customerName: string;
    customerPhone: string;
    pendingOrderData: TossPendingOrderData;
    onClose: () => void;
    onSuccess: () => void;
    onFail: (message: string) => void;
}

export const TossPaymentModal: React.FC<TossPaymentModalProps> = ({
    show,
    amount,
    orderNo,
    orderName,
    customerName,
    customerPhone,
    pendingOrderData,
    onClose,
    onSuccess,
    onFail,
}) => {
    const paymentWidgetRef = useRef<any>(null);
    const paymentMethodsWidgetRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        if (!show || amount <= 0) return;

        const initWidget = async () => {
            try {
                const paymentWidget = await loadPaymentWidget(TOSS_CLIENT_KEY, ANONYMOUS);
                paymentWidgetRef.current = paymentWidget;

                const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
                    "#payment-method",
                    { value: amount, currency: "KRW", country: "KR" }
                );
                paymentMethodsWidgetRef.current = paymentMethodsWidget;

                paymentWidget.renderAgreement("#agreement");

                paymentMethodsWidget.on("ready", () => {
                    setIsReady(true);
                });
            } catch (err) {
                console.error("Toss Payment Widget init error:", err);
                onFail("결제 위젯을 불러올 수 없습니다.");
            }
        };

        initWidget();

        return () => {
            paymentWidgetRef.current = null;
            paymentMethodsWidgetRef.current = null;
            setIsReady(false);
        };
    }, [show, amount]);

    useEffect(() => {
        if (!show || !paymentMethodsWidgetRef.current || amount <= 0) return;
        paymentMethodsWidgetRef.current.updateAmount(amount);
    }, [amount, show]);

    const handlePayment = async () => {
        if (!paymentWidgetRef.current || !isReady || isRequesting) return;

        setIsRequesting(true);
        try {
            sessionStorage.setItem(TOSS_PENDING_ORDER_KEY, JSON.stringify(pendingOrderData));

            const baseUrl = window.location.origin + (window.location.pathname || "/");
            const successUrl = `${baseUrl}?payment_success=1`;
            const failUrl = `${baseUrl}?payment_fail=1`;

            await paymentWidgetRef.current.requestPayment({
                orderId: orderNo,
                orderName: orderName,
                successUrl: successUrl,
                failUrl: failUrl,
                customerName: customerName,
                customerMobilePhone: customerPhone.replace(/[^0-9]/g, ""),
            });
        } catch (err: any) {
            console.error("Payment request error:", err);
            if (err.code === "USER_CANCEL") {
                onClose();
            } else {
                onFail(err.message || "결제 요청에 실패했습니다.");
            }
        } finally {
            setIsRequesting(false);
        }
    };

    if (!show) return null;

    return (
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
            onClick={onClose}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: "16px",
                    padding: "24px",
                    maxWidth: "500px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>💳 결제하기</h3>
                    <button
                        onClick={onClose}
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

                <div style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "bold" }}>
                    결제 금액: ₩{amount.toLocaleString()}
                </div>

                <div id="payment-method" style={{ minHeight: "200px", marginBottom: "16px" }} />
                <div id="agreement" style={{ marginBottom: "20px" }} />

                <button
                    onClick={handlePayment}
                    disabled={!isReady || isRequesting}
                    style={{
                        width: "100%",
                        padding: "16px",
                        background: isReady && !isRequesting ? "#111" : "#ccc",
                        color: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: isReady && !isRequesting ? "pointer" : "not-allowed",
                        opacity: isReady && !isRequesting ? 1 : 0.6,
                    }}
                >
                    {isRequesting ? "결제 진행 중..." : "₩" + amount.toLocaleString() + " 결제하기"}
                </button>
            </div>
        </div>
    );
};
