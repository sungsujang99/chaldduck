import urlAxios from "../utils/urlAxios";
import type {
  JsonBody,
  OrderResponse,
  OrderCreateRequest,
  OrderDeliveryStartRequest,
  OrderPricingResponse,
  PricingRequest,
  OrderCancelRequest,
} from "../types/api";

// 주문 목록 조회 (고객별)
export const getOrdersByCustomer = async (
  customerId: number
): Promise<JsonBody<OrderResponse[]>> => {
  const response = await urlAxios.get("/orders", {
    params: { customerId },
  });
  return response.data;
};

// 주문 단건 조회
export const getOrder = async (orderId: number): Promise<JsonBody<OrderResponse>> => {
  const response = await urlAxios.get(`/orders/${orderId}`);
  return response.data;
};

// 주문 생성 (배송)
export const createOrder = async (
  customerId: number,
  addressId: number,
  data: OrderCreateRequest
): Promise<JsonBody<OrderResponse>> => {
  const response = await urlAxios.post("/orders", data, {
    params: { customerId, addressId },
  });
  return response.data;
};

// 픽업 주문 생성
export const createPickupOrder = async (
  customerId: number,
  data: OrderCreateRequest
): Promise<JsonBody<OrderResponse>> => {
  const response = await urlAxios.post("/orders/pickup", data, {
    params: { customerId },
  });
  return response.data;
};

// 주문서 계산 + 재고 상태
export const calculatePricing = async (
  data: PricingRequest
): Promise<JsonBody<OrderPricingResponse>> => {
  const response = await urlAxios.post("/orders/pricing", data);
  return response.data;
};

// 주문 확인 처리 (PAID → CONFIRMED)
export const confirmOrder = async (orderId: number): Promise<JsonBody<void>> => {
  const response = await urlAxios.post(`/orders/${orderId}/confirm`);
  return response.data;
};

// 주문 완료 처리 (CONFIRMED → COMPLETED)
export const completeOrder = async (orderId: number): Promise<JsonBody<void>> => {
  const response = await urlAxios.post(`/orders/${orderId}/complete`);
  return response.data;
};

// 배송 시작 처리
export const startDelivery = async (
  orderId: number,
  data: OrderDeliveryStartRequest
): Promise<JsonBody<void>> => {
  const response = await urlAxios.post(`/orders/${orderId}/delivery/start`, data);
  return response.data;
};

// 배송 완료 처리
export const markDelivered = async (orderId: number): Promise<JsonBody<void>> => {
  const response = await urlAxios.post(`/orders/${orderId}/delivery/delivered`);
  return response.data;
};

// 주문 취소 (소비자)
export const cancelOrderByCustomer = async (
  customerId: number,
  orderId: number,
  data: OrderCancelRequest
): Promise<JsonBody<void>> => {
  const response = await urlAxios.post(`/orders/customers/${customerId}/${orderId}/cancel`, data);
  return response.data;
};
