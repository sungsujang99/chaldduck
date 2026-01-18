import urlAxios from "../utils/urlAxios";
import type {
  JsonBody,
  PaymentResponse,
  PaymentCreateRequest,
  PaymentMarkPaidRequest,
} from "../types/api";

// 결제 생성
export const createPayment = async (
  orderId: number,
  data: PaymentCreateRequest
): Promise<JsonBody<PaymentResponse>> => {
  const response = await urlAxios.post("/payments", data, {
    params: { orderId },
  });
  return response.data;
};

// 결제 단건 조회
export const getPayment = async (paymentId: number): Promise<JsonBody<PaymentResponse>> => {
  const response = await urlAxios.get(`/payments/${paymentId}`);
  return response.data;
};

// 주문 기준 결제 조회
export const getPaymentByOrder = async (
  orderId: number
): Promise<JsonBody<PaymentResponse>> => {
  const response = await urlAxios.get("/payments/by-order", {
    params: { orderId },
  });
  return response.data;
};

// 결제 완료 처리 (입금 확인)
export const markPaymentPaid = async (
  paymentId: number,
  data: PaymentMarkPaidRequest
): Promise<JsonBody<PaymentResponse>> => {
  const response = await urlAxios.post(`/payments/${paymentId}/paid`, data);
  return response.data;
};
