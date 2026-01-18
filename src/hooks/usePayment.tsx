import { useState } from "react";
import type { PaymentMethod, ReceiptType } from "../types/types";

export const usePayment = () => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptType, setReceiptType] = useState<ReceiptType>("");
    const [receiptValue, setReceiptValue] = useState("");

    return {
        paymentMethod,
        setPaymentMethod,
        showReceipt,
        setShowReceipt,
        receiptType,
        setReceiptType,
        receiptValue,
        setReceiptValue,
    };
};
