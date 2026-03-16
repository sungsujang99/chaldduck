import { useEffect, useRef } from "react";
import { TOSS_CLIENT_KEY } from "../constants";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { TossPendingOrderData } from "./TossPaymentModal";
import urlAxios from "../utils/urlAxios";

interface OwnProps {
    show: boolean;
    buyerId: number | null;
    orderId: number;
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

interface TossCheckoutResponse {
    status: number;
    message: string;
    data: {
        orderId: string;
        amount: number;
        orderName: string;
        successUrl: string;
        failUrl: string;
    };
}

export const TossTest = ({ show, buyerId, amount, orderNo, orderName, orderId, customerName, customerPhone, pendingOrderData, onClose, onSuccess, onFail }: OwnProps) => {
    const callbacksRef = useRef({ onClose, onSuccess, onFail });
    callbacksRef.current = { onClose, onSuccess, onFail };
    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (!show) {
            hasStartedRef.current = false;
            return;
        }
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        const requestPayment = async () => {
            if (!buyerId) {
                callbacksRef.current.onFail("구매자 정보를 먼저 입력해주세요. 이름과 연락처 입력 후 주문확인을 눌러주세요.");
                callbacksRef.current.onClose();
                return;
            }
            try {
                const { data: checkout } = await urlAxios.get<TossCheckoutResponse>(`payments/toss/checkout/${orderId}`);

                const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
                const payment = tossPayments.payment({ customerKey: "USER_ID_" + buyerId });

                await payment.requestPayment({
                    method: "CARD",
                    amount: {
                        currency: "KRW",
                        value: checkout.data.amount,
                    },
                    orderId: checkout.data.orderId,
                    orderName: checkout.data.orderName,
                    successUrl: checkout.data.successUrl,
                    failUrl: checkout.data.failUrl,
                    //customerEmail: "customer123@gmail.com",
                    customerName: customerName,
                    card: {
                        useEscrow: false,
                        flowMode: "DEFAULT",
                        useCardPoint: false,
                        useAppCardOnly: false,
                    },
                });

                callbacksRef.current.onSuccess();
            } catch (error: any) {
                const message = error?.message ?? "결제 요청 중 오류가 발생했습니다.";
                callbacksRef.current.onFail(message);
            } finally {
                callbacksRef.current.onClose();
            }
        };

        void requestPayment();
    }, [show, amount, orderNo, orderName, customerName, buyerId, orderId]);

    return null;
};
