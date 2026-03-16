import React, { useState, useEffect } from "react";
import { BuyerInfo } from "../components/BuyerInfo";
import { PurchaseTypeSection } from "../components/PurchaseTypeSection";
import { ProductSelection } from "../components/ProductSelection";
import { PaymentSection } from "../components/PaymentSection";
import { OrderSummary } from "../components/OrderSummary";
import FooterInfo from "../components/FooterInfo";
import useBuyer from "../hooks/useBuyer";
import { useAddress } from "../hooks/useAddress";
import { Address, PurchaseType } from "../types/types";
import useCart from "../hooks/useCart";
import { usePayment } from "../hooks/usePayment";
import { useOrderSummary } from "../hooks/useOrderSummary";
import { OrderConfirmModal } from "../components/OrderConfirmModal";
import { OrderCompleteModal } from "../components/OrderCompleteModal";
import { OrderFormNotice } from "../components/OrderFormNotice";
import { createOrder, createPickupOrder } from "../api/order";
import { createPayment, getPaymentByOrder, confirmTossPayment } from "../api/payment";
import { TossPaymentModal, getTossPendingOrder, clearTossPendingOrder, type TossPendingOrderData } from "../components/TossPaymentModal";
import { addAddress, updateAddress, identifyCustomer, getCustomerProfile } from "../api/customer";
import { isOrderEnabled, isDeliveryOrderEnabled, getOrderFeatureInfo } from "../api/feature";
import type { FeatureFlagResponse } from "../types/api";
import { validatePhoneNumber, validatePersonalReceiptNumber, getPhoneValidationMessage, getPersonalReceiptValidationMessage } from "../utils/validation";
import Instagram from "../assets/instagram.svg?react";
import Thread from "../assets/thread.svg?react";
import Naver from "../assets/naverblog.svg?react";
import Logo from "../assets/logo.svg?react";
import useItems from "../hooks/useItems";
import { TossTest } from "../components/TossTest";

export default function HomePage() {
    const { buyerName, setBuyerName, buyerPhone, setBuyerPhone, buyerId, setBuyerId, handleLogin } = useBuyer();
    const { address, setAddress, entranceCode, setEntranceCode, openAddressModal, saveAddress } = useAddress(buyerId, buyerName, buyerPhone);
    const { cart, setCart, changeQty } = useCart();
    const { paymentMethod, setPaymentMethod, showReceipt, setShowReceipt, receiptType, setReceiptType, receiptValue, setReceiptValue } = usePayment();
    const [purchaseType, setPurchaseType] = useState<PurchaseType>("pickup");
    const { menuItems } = useItems();
    const summary = useOrderSummary({ cart, paymentMethod, purchaseType, menuItems, zipCode: address.zipCode });
    const [orderEnabled, setOrderEnabled] = useState<boolean>(true);
    const [deliveryOrderEnabled, setDeliveryOrderEnabled] = useState<boolean>(true);
    const [orderFeatureInfo, setOrderFeatureInfo] = useState<FeatureFlagResponse | null>(null);

    const [showOrderConfirm, setShowOrderConfirm] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [showOrderComplete, setShowOrderComplete] = useState(false);
    const [completedOrderNo, setCompletedOrderNo] = useState<string>("");
    const [completedFinalAmount, setCompletedFinalAmount] = useState<number>(0);
    const [completedProductAmount, setCompletedProductAmount] = useState<number>(0);
    const [completedDiscountAmount, setCompletedDiscountAmount] = useState<number>(0);
    const [completedDeliveryFee, setCompletedDeliveryFee] = useState<number>(0);
    const [completedPaymentMethod, setCompletedPaymentMethod] = useState<"BANK_TRANSFER" | "CARD">("BANK_TRANSFER");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [showTossPaymentModal, setShowTossPaymentModal] = useState(false);
    const [tossPaymentData, setTossPaymentData] = useState<{
        orderNo: string;
        orderId: number;
        amount: number;
        orderName: string;
        finalAmount: number;
        subtotalAmount: number;
        discountAmount: number;
        deliveryFee: number;
    } | null>(null);

    // 토스페이먼츠 결제 성공/실패 리다이렉트 처리
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paymentSuccess = params.get("payment_success");
        const paymentFail = params.get("payment_fail");
        const paymentKey = params.get("paymentKey");
        const orderId = params.get("orderId");
        const amountStr = params.get("amount");
        const failCode = params.get("code");
        const failMessage = params.get("message");

        if (paymentFail === "1") {
            window.history.replaceState({}, "", window.location.pathname || "/");
            alert(`결제가 실패했습니다.${failMessage ? `\n${failMessage}` : ""}${failCode ? ` (${failCode})` : ""}`);
            return;
        }

        if (paymentSuccess === "1" && paymentKey && orderId && amountStr) {
            const amount = parseInt(amountStr, 10);
            const pendingOrder = getTossPendingOrder();

            const handleConfirm = async () => {
                try {
                    await confirmTossPayment({ paymentKey, orderId, amount });
                    window.history.replaceState({}, "", window.location.pathname || "/");
                    clearTossPendingOrder();
                    if (pendingOrder) {
                        setCompletedOrderNo(pendingOrder.orderNo);
                        setCompletedFinalAmount(pendingOrder.finalAmount);
                        setCompletedProductAmount(pendingOrder.productAmount);
                        setCompletedDiscountAmount(pendingOrder.discountAmount);
                        setCompletedDeliveryFee(pendingOrder.deliveryFee);
                    } else {
                        setCompletedOrderNo(orderId);
                        setCompletedFinalAmount(amount);
                        setCompletedProductAmount(amount);
                        setCompletedDiscountAmount(0);
                        setCompletedDeliveryFee(0);
                    }
                    setCompletedPaymentMethod("CARD");
                    setShowOrderComplete(true);
                    setCart([]);
                } catch (err: any) {
                    console.error("Toss confirm error:", err);
                    const errorMessage = err.response?.data?.message || err.message || "알 수 없는 오류";
                    alert(`결제 승인에 실패했습니다: ${errorMessage}`);
                }
            };

            handleConfirm();
        }
    }, []);

    // 모바일 여부 감지
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // 주문 기능 활성화 여부 확인 및 오픈시간 정보 조회
    useEffect(() => {
        const checkOrderFeature = async () => {
            try {
                const featureInfo = await getOrderFeatureInfo();
                if (featureInfo) {
                    setOrderEnabled(featureInfo.enabled);
                    setOrderFeatureInfo(featureInfo);
                } else {
                    const enabled = await isOrderEnabled();
                    setOrderEnabled(enabled);
                }
            } catch (error) {
                console.error("Failed to check order feature:", error);
                // 기본값은 true로 설정 (에러 시에도 주문 가능하도록)
                setOrderEnabled(true);
            }
        };
        checkOrderFeature();
    }, []);

    // 고객 차단 상태 확인 (buyerId가 변경될 때마다)
    useEffect(() => {
        const checkCustomerBlocked = async () => {
            if (!buyerId) {
                // buyerId가 없으면 주문 기능 상태만 확인
                try {
                    const featureInfo = await getOrderFeatureInfo();
                    if (featureInfo) {
                        setOrderEnabled(featureInfo.enabled);
                        setOrderFeatureInfo(featureInfo);
                    } else {
                        const enabled = await isOrderEnabled();
                        setOrderEnabled(enabled);
                    }
                } catch (error) {
                    console.error("Failed to check order feature:", error);
                    setOrderEnabled(true);
                }
                return;
            }
            try {
                const profileRes = await getCustomerProfile(buyerId);

                // 프로필의 blockInfo에 blocked 필드가 있으면 확인
                // 차단되어 있으면 주문 기능 비활성화
                if (profileRes.data?.blockInfo?.blocked === true) {
                    setOrderEnabled(false);
                } else {
                    // 차단되지 않았으면 주문 기능 상태를 다시 확인
                    try {
                        const featureInfo = await getOrderFeatureInfo();
                        if (featureInfo) {
                            setOrderEnabled(featureInfo.enabled);
                            setOrderFeatureInfo(featureInfo);
                        } else {
                            const enabled = await isOrderEnabled();
                            setOrderEnabled(enabled);
                        }
                    } catch (error) {
                        console.error("Failed to check order feature:", error);
                        setOrderEnabled(true);
                    }
                }
            } catch (error) {
                console.error("Failed to check customer blocked status:", error);
                // 에러 시에는 차단 상태를 확인할 수 없으므로 기본 동작 유지
                try {
                    const featureInfo = await getOrderFeatureInfo();
                    if (featureInfo) {
                        setOrderEnabled(featureInfo.enabled);
                        setOrderFeatureInfo(featureInfo);
                    } else {
                        const enabled = await isOrderEnabled();
                        setOrderEnabled(enabled);
                    }
                } catch (err) {
                    console.error("Failed to check order feature:", err);
                    setOrderEnabled(true);
                }
            }
        };
        checkCustomerBlocked();
    }, [buyerId]);

    // 배송 주문 기능 활성화 여부 확인
    useEffect(() => {
        const checkDeliveryOrderFeature = async () => {
            try {
                const enabled = await isDeliveryOrderEnabled();
                setDeliveryOrderEnabled(enabled);
            } catch (error) {
                console.error("Failed to check delivery order feature:", error);
                // 기본값은 true로 설정
                setDeliveryOrderEnabled(true);
            }
        };
        checkDeliveryOrderFeature();
    }, []);

    // 배송 주문이 비활성화되면 자동으로 픽업으로 전환
    useEffect(() => {
        if (!deliveryOrderEnabled && purchaseType === "delivery") {
            console.log("배송 주문이 비활성화되어 픽업으로 전환합니다.");
            setPurchaseType("pickup");
        }
    }, [deliveryOrderEnabled, purchaseType]);

    // 다음 우편번호 API 스크립트 로드
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const cancelOrder = async (orderId: number, reason: string) => {
        if (!buyerId) {
            alert("⚠️ 고객 정보가 없습니다.");
            return;
        }

        if (!reason || reason.trim() === "") {
            alert("⚠️ 취소 사유를 입력해주세요.");
            return;
        }

        try {
            const { cancelOrderByCustomer } = await import("../api/order");
            const cancelData = { reason: reason.trim() };
            await cancelOrderByCustomer(buyerId, orderId, cancelData);
            alert("✅ 주문이 취소되었습니다.");
            // 주문 목록 새로고침은 OrderConfirmModal에서 처리
        } catch (err: any) {
            console.error("Order cancel error:", err);
            console.error("Error response:", err.response?.data);
            const errorMessage = err.response?.data?.message || err.message || "알 수 없는 오류";
            alert(`⚠️ 주문 취소 중 오류가 발생했습니다: ${errorMessage}`);
            throw err; // 에러를 다시 throw하여 모달에서 처리할 수 있도록
        }
    };

    const submitOrder = async () => {
        // 중복 주문 방지
        if (isSubmitting) {
            alert("⚠️ 주문 처리 중입니다. 잠시만 기다려주세요.");
            return;
        }

        // 입력 검증
        if (!buyerName.trim() || !buyerPhone.trim()) {
            alert("⚠️ 이름과 연락처를 입력해주세요.");
            return;
        }

        // 전화번호 형식 검증
        if (!validatePhoneNumber(buyerPhone)) {
            alert(getPhoneValidationMessage());
            return;
        }
        if (cart.length === 0) {
            alert("⚠️ 상품을 선택해주세요.");
            return;
        }
        if (!agreeTerms) {
            alert("⚠️ 이용약관에 동의해주세요.");
            return;
        }
        if (!agreePrivacy) {
            alert("⚠️ 개인정보 처리방침에 동의해주세요.");
            return;
        }

        // bankTransferEnabled 체크 제거 - 배송은 UI에서 막고, 주문 제출은 허용

        if (purchaseType === "delivery") {
            if (!address.address1 || !address.address2) {
                alert("⚠️ 배달 주소를 입력해주세요.");
                return;
            }
            if (!address.recipientName || !address.recipientPhone) {
                alert("⚠️ 수령인 정보를 입력해주세요.");
                return;
            }
            // 수령인 전화번호 형식 검증
            if (!validatePhoneNumber(address.recipientPhone)) {
                alert("⚠️ 수령인 전화번호 형식이 올바르지 않습니다.\n올바른 형식: 010-xxxx-xxxx 또는 010xxxxxxxx");
                return;
            }
        }
        // 현금영수증 발급 선택 시 유형과 번호 확인
        if (showReceipt) {
            if (!receiptType) {
                alert("⚠️ 현금영수증 발급 유형을 선택해주세요.");
                return;
            }
            if (!receiptValue || receiptValue.trim() === "") {
                alert("⚠️ 현금영수증 번호를 입력해주세요.");
                return;
            }
            // 개인소득공제인 경우 휴대폰 번호 형식 검증 (사업자번호는 검증하지 않음)
            if (receiptType === "personal") {
                if (!validatePersonalReceiptNumber(receiptValue)) {
                    alert(getPersonalReceiptValidationMessage());
                    return;
                }
            }
        }

        setIsSubmitting(true);
        try {
            // 고객 정보 자동 식별/생성 (buyerId가 없으면)
            let currentBuyerId = buyerId;
            if (!currentBuyerId) {
                try {
                    const customerRes = await identifyCustomer({
                        name: buyerName,
                        phone: buyerPhone.replace(/[^0-9]/g, ""), // 하이픈 제거
                    });
                    if (!customerRes.data || !customerRes.data.customerId) {
                        alert("⚠️ 고객 정보 저장에 실패했습니다. 다시 시도해주세요.");
                        setIsSubmitting(false);
                        return;
                    }
                    currentBuyerId = customerRes.data.customerId;
                    // buyerId 상태 업데이트
                    setBuyerId(currentBuyerId);
                } catch (err: any) {
                    console.error("Customer identify error:", err);
                    alert(`⚠️ 고객 정보 저장 중 오류가 발생했습니다: ${err.response?.data?.message || err.message}`);
                    setIsSubmitting(false);
                    return;
                }
            }
            // 배송 주문인 경우 주소 자동 저장/확인
            let addressId: number | null = null;
            if (purchaseType === "delivery") {
                try {
                    // 주소 정보가 입력되어 있으면 자동으로 저장/업데이트
                    if (address.address1 && address.address2) {
                        // address2 끝에 공동현관 비밀번호 추가
                        let finalAddress2 = address.address2.trim();
                        if (entranceCode && entranceCode.trim()) {
                            finalAddress2 = finalAddress2 ? `${finalAddress2}\n공동현관: ${entranceCode.trim()}` : `공동현관: ${entranceCode.trim()}`;
                        }

                        const addressData = {
                            label: address.label || "집",
                            recipientName: address.recipientName || buyerName,
                            recipientPhone: address.recipientPhone || buyerPhone,
                            zipCode: address.zipCode,
                            address1: address.address1,
                            address2: finalAddress2,
                            isDefault: address.isDefault !== false, // 기본값은 true
                        };

                        if (address.addressId) {
                            // 기존 주소 업데이트
                            const updateRes = await updateAddress(currentBuyerId, Number(address.addressId), addressData);
                            if (!updateRes.data || !updateRes.data.addressId) {
                                alert("⚠️ 주소 업데이트에 실패했습니다. 다시 시도해주세요.");
                                setIsSubmitting(false);
                                return;
                            }
                            addressId = updateRes.data.addressId;
                        } else {
                            // 새 주소 저장
                            const res = await addAddress(currentBuyerId, addressData);
                            if (!res.data || !res.data.addressId) {
                                alert("⚠️ 주소 저장에 실패했습니다. 다시 시도해주세요.");
                                setIsSubmitting(false);
                                return;
                            }
                            addressId = res.data.addressId;
                        }
                    } else {
                        alert("⚠️ 배달 주소를 모두 입력해주세요.");
                        setIsSubmitting(false);
                        return;
                    }
                } catch (err: any) {
                    console.error("Address save error:", err);
                    alert(`⚠️ 주소 저장 중 오류가 발생했습니다: ${err.response?.data?.message || err.message}`);
                    setIsSubmitting(false);
                    return;
                }
            }

            // 주문 생성
            if (!summary) {
                alert("⚠️ 주문 요약 정보가 없습니다.");
                setIsSubmitting(false);
                return;
            }

            // 클라이언트에서 계산한 값들 (입금요청 화면과 동일한 값)
            const clientDeliveryFee = summary.shipping;
            const clientFinalAmount = summary.finalPrice;
            const clientSubtotalAmount = summary.origin;
            const clientDiscountAmount = summary.disc;

            console.log("Order creation - Client calculated values:", {
                deliveryFee: clientDeliveryFee,
                finalAmount: clientFinalAmount,
                subtotalAmount: clientSubtotalAmount,
                discountAmount: clientDiscountAmount,
                purchaseType,
            });

            const orderData = {
                paymentMethod: paymentMethod,
                items: cart.map((item) => ({
                    productName: item.name,
                    unitPrice: item.price,
                    quantity: item.qty,
                    productId: Number(item.id),
                })),
                cashReceipt: showReceipt,
                ...(showReceipt && receiptValue ? { cashReceiptNo: receiptValue } : {}),
                // 배송 주문 시 우편번호 전달 (배송비 정책 확인용)
                ...(purchaseType === "delivery" && address.zipCode ? { zipCode: address.zipCode.trim() } : {}),
                // 클라이언트에서 계산한 배송비 및 최종 금액 전달 (입금요청 화면과 동일)
                deliveryFee: clientDeliveryFee,
                finalAmount: clientFinalAmount,
            };

            console.log("Order creation request:", {
                orderData,
                purchaseType,
                addressId: purchaseType === "delivery" ? addressId : null,
            });

            let orderRes;
            try {
                if (purchaseType === "pickup") {
                    console.log("Creating PICKUP order via createPickupOrder API");
                    orderRes = await createPickupOrder(currentBuyerId, orderData);
                } else {
                    console.log("Creating DELIVERY order via createOrder API");
                    if (!addressId) {
                        alert("⚠️ 주소 정보가 없습니다.");
                        setIsSubmitting(false);
                        return;
                    }
                    orderRes = await createOrder(currentBuyerId, addressId, orderData);
                }

                // 주문 생성 응답 검증
                if (!orderRes || !orderRes.data || !orderRes.data.orderId) {
                    alert("⚠️ 주문 생성에 실패했습니다. 응답 데이터가 올바르지 않습니다.");
                    setIsSubmitting(false);
                    return;
                }
            } catch (err: any) {
                console.error("Order creation error:", err);
                alert(`⚠️ 주문 생성 중 오류가 발생했습니다: ${err.response?.data?.message || err.message || "알 수 없는 오류"}`);
                setIsSubmitting(false);
                return;
            }

            const orderId = orderRes.data.orderId;
            const orderNo = orderRes.data.orderNo;

            // 서버 응답 값 확인 (디버깅용)
            console.log("Order creation response:", {
                orderId,
                orderNo,
                serverFinalAmount: orderRes.data.finalAmount,
                serverDeliveryFee: orderRes.data.deliveryFee,
                serverSubtotalAmount: orderRes.data.subtotalAmount,
                serverDiscountAmount: orderRes.data.discountAmount,
                clientFinalAmount: clientFinalAmount,
                clientDeliveryFee: clientDeliveryFee,
                clientSubtotalAmount: clientSubtotalAmount,
                clientDiscountAmount: clientDiscountAmount,
            });

            // 클라이언트에서 계산한 값 사용 (입금요청 화면과 동일한 값)
            // 서버가 클라이언트에서 전달한 값을 무시하고 자체 계산할 수 있으므로
            // 클라이언트에서 계산한 값을 사용하여 일관성 유지
            const finalAmount = clientFinalAmount;
            const deliveryFee = clientDeliveryFee;
            const subtotalAmount = clientSubtotalAmount;
            const discountAmount = clientDiscountAmount;

            if (!orderNo) {
                alert("⚠️ 주문번호를 받지 못했습니다. 주문이 정상적으로 생성되지 않았을 수 있습니다.");
                setIsSubmitting(false);
                return;
            }

            // 결제 생성 또는 기존 결제 확인
            let paymentRes;
            try {
                // 먼저 기존 결제가 있는지 확인
                try {
                    const existingPayment = await getPaymentByOrder(orderId);
                    if (existingPayment && existingPayment.data && existingPayment.data.paymentId) {
                        paymentRes = existingPayment;
                    }
                } catch (checkErr: any) {
                    // 기존 결제가 없으면 새로 생성
                }

                // 기존 결제가 없으면 새로 생성
                if (!paymentRes) {
                    paymentRes = await createPayment(orderId, {
                        method: paymentMethod,
                        memo: paymentMethod === "BANK_TRANSFER" ? buyerName : undefined,
                    });
                }

                // 결제 생성 응답 검증
                if (!paymentRes || !paymentRes.data || !paymentRes.data.paymentId) {
                    alert("⚠️ 결제 생성에 실패했습니다. 주문은 생성되었지만 결제 정보가 저장되지 않았습니다. 고객센터로 문의해주세요.");
                    setIsSubmitting(false);
                    return;
                }
            } catch (err: any) {
                console.error("Payment creation error:", err);
                const errorMessage = err.response?.data?.message || err.message || "알 수 없는 오류";

                // "이미 처리된 결제" 오류인 경우 정상 처리로 간주
                if (errorMessage.includes("이미 처리된 결제") || errorMessage.includes("already processed") || errorMessage.includes("이미 존재")) {
                    // 기존 결제 정보 조회 시도
                    try {
                        const existingPayment = await getPaymentByOrder(orderId);
                        if (existingPayment && existingPayment.data && existingPayment.data.paymentId) {
                            paymentRes = existingPayment;
                        }
                    } catch (retrieveErr: any) {
                        // 주문은 생성되었으므로 완료 처리
                    }
                } else {
                    // 다른 오류인 경우
                    alert(`⚠️ 결제 생성 중 오류가 발생했습니다: ${errorMessage}\n\n주문은 생성되었지만 결제 정보가 저장되지 않았습니다. 고객센터로 문의해주세요.`);
                    setIsSubmitting(false);
                    return;
                }
            }

            if (paymentMethod === "CARD") {
                const orderName = cart.length === 1 ? cart[0].name : `${cart[0].name} 외 ${cart.length - 1}건`;
                setTossPaymentData({
                    orderNo: orderNo,
                    orderId: orderId,
                    amount: finalAmount,
                    orderName,
                    finalAmount,
                    subtotalAmount,
                    discountAmount,
                    deliveryFee,
                });
                setShowTossPaymentModal(true);
                setIsSubmitting(false);
            } else {
                setCompletedOrderNo(orderNo);
                setCompletedFinalAmount(finalAmount);
                setCompletedProductAmount(subtotalAmount);
                setCompletedDiscountAmount(discountAmount);
                setCompletedDeliveryFee(deliveryFee);
                setCompletedPaymentMethod("BANK_TRANSFER");
                setShowOrderComplete(true);
                setCart([]);
                setIsSubmitting(false);
            }
        } catch (err: any) {
            console.error("Unexpected error:", err);
            setIsSubmitting(false);
            alert(`⚠️ 예상치 못한 오류가 발생했습니다: ${err.message || "알 수 없는 오류"}\n\n주문이 완료되지 않았습니다. 다시 시도해주세요.`);
        }
    };

    return (
        <div
            style={{
                fontFamily: "'Apple SD Gothic Neo', sans-serif",
                background: "#f8f8f8",
                margin: 0,
                padding: isMobile ? "15px" : "30px",
                display: "flex",
                justifyContent: "center",
                minHeight: "100vh",
            }}
        >
            <main style={{ maxWidth: "480px", width: "100%", background: "#fff", padding: isMobile ? "12px" : "24px", borderRadius: "18px", boxShadow: "0 5px 15px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
                    <Logo width="240" height="144" />
                </div>
                <div style={{ display: "flex", height: "66px", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                    <Instagram width={"40px"} cursor={"pointer"} onClick={() => window.open("https://www.instagram.com/chaldduk_delivery?igsh=MW9seHdzY2U4aHpuNA==", "_blank")} />
                    <Thread width={"40px"} cursor={"pointer"} onClick={() => window.open("https://www.threads.com/@chaldduk_delivery", "_blank")} />
                    <Naver width={"40px"} cursor={"pointer"} onClick={() => window.open("https://blog.naver.com/gabin304/224128795683", "_blank")} />
                </div>

                {!orderEnabled && (
                    <div style={{ padding: "16px", background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "12px", marginBottom: "18px", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: "14px", color: "#856404", fontWeight: "bold", marginBottom: "8px" }}>⚠️ 주문할 수 있는 시간이 아닙니다.</p>
                        {orderFeatureInfo?.description && (
                            <p style={{ margin: 0, fontSize: "13px", color: "#856404" }}>
                                📅 오픈시간: {orderFeatureInfo.description.includes("주문 기능") ? orderFeatureInfo.description : `${orderFeatureInfo.description} 주문 기능`}
                            </p>
                        )}
                    </div>
                )}

                {orderEnabled && (
                    <>
                        <BuyerInfo
                            buyerName={buyerName}
                            setBuyerName={setBuyerName}
                            buyerPhone={buyerPhone}
                            setBuyerPhone={setBuyerPhone}
                            buyerId={buyerId}
                            handleOrderModalOpen={setShowOrderConfirm}
                            handleLogin={() => handleLogin()}
                        />
                        <PurchaseTypeSection
                            purchaseType={purchaseType}
                            setPurchaseType={setPurchaseType}
                            address={address}
                            setAddress={setAddress}
                            entranceCode={entranceCode}
                            setEntranceCode={setEntranceCode}
                            openAddressModal={openAddressModal}
                            deliveryOrderEnabled={deliveryOrderEnabled}
                        />
                    </>
                )}

                {orderEnabled && (
                    <ProductSelection cart={cart} changeQty={changeQty} items={menuItems} paymentMethod={paymentMethod} purchaseType={purchaseType} summary={summary} orderEnabled={orderEnabled} />
                )}

                {orderEnabled && (
                    <>
                        <PaymentSection
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            showReceipt={showReceipt}
                            setShowReceipt={setShowReceipt}
                            receiptType={receiptType}
                            setReceiptType={setReceiptType}
                            receiptValue={receiptValue}
                            setReceiptValue={setReceiptValue}
                            deliveryOrderEnabled={deliveryOrderEnabled}
                        />

                        <OrderFormNotice />

                        <OrderSummary
                            summary={summary}
                            onSubmit={submitOrder}
                            agreeTerms={agreeTerms}
                            setAgreeTerms={setAgreeTerms}
                            agreePrivacy={agreePrivacy}
                            setAgreePrivacy={setAgreePrivacy}
                            isSubmitting={isSubmitting}
                            paymentMethod={paymentMethod}
                        />
                    </>
                )}

                <FooterInfo />
            </main>

            <OrderConfirmModal show={showOrderConfirm} id={buyerId} onClose={() => setShowOrderConfirm(false)} onCancel={cancelOrder} />

            <OrderCompleteModal
                show={showOrderComplete}
                orderNo={completedOrderNo}
                finalAmount={completedFinalAmount}
                paymentMethod={completedPaymentMethod}
                buyerName={buyerName}
                productAmount={completedProductAmount}
                discountAmount={completedDiscountAmount}
                deliveryFee={completedDeliveryFee}
                onClose={() => setShowOrderComplete(false)}
            />

            {tossPaymentData && (
                // <TossPaymentModal
                //     show={showTossPaymentModal}
                //     amount={tossPaymentData.amount}
                //     orderNo={tossPaymentData.orderNo}
                //     orderName={tossPaymentData.orderName}
                //     customerName={buyerName}
                //     customerPhone={buyerPhone}
                //     pendingOrderData={{
                //         orderNo: tossPaymentData.orderNo,
                //         finalAmount: tossPaymentData.finalAmount,
                //         buyerName,
                //         productAmount: tossPaymentData.subtotalAmount,
                //         discountAmount: tossPaymentData.discountAmount,
                //         deliveryFee: tossPaymentData.deliveryFee,
                //     }}
                //     onClose={() => {
                //         setShowTossPaymentModal(false);
                //         setTossPaymentData(null);
                //     }}
                //     onSuccess={() => {}}
                //     onFail={(msg) => {
                //         alert(`⚠️ ${msg}`);
                //         setShowTossPaymentModal(false);
                //         setTossPaymentData(null);
                //     }}
                // />
                <TossTest
                    show={showTossPaymentModal}
                    buyerId={buyerId}
                    amount={tossPaymentData.amount}
                    orderNo={tossPaymentData.orderNo}
                    orderId={tossPaymentData.orderId}
                    orderName={tossPaymentData.orderName}
                    customerName={buyerName}
                    customerPhone={buyerPhone}
                    pendingOrderData={{
                        orderNo: tossPaymentData.orderNo,
                        finalAmount: tossPaymentData.finalAmount,
                        buyerName,
                        productAmount: tossPaymentData.subtotalAmount,
                        discountAmount: tossPaymentData.discountAmount,
                        deliveryFee: tossPaymentData.deliveryFee,
                    }}
                    onClose={() => {
                        setShowTossPaymentModal(false);
                        setTossPaymentData(null);
                    }}
                    onSuccess={() => {}}
                    onFail={(msg) => {
                        alert(`⚠️ ${msg}`);
                        setShowTossPaymentModal(false);
                        setTossPaymentData(null);
                    }}
                />
            )}
        </div>
    );
}
