import urlAxios from "../utils/urlAxios";
import type {
  JsonBody,
  ShippingPolicyResponse,
  ShippingPolicyCreateRequest,
  ShippingRuleResponse,
  ShippingRuleCreateRequest,
} from "../types/api";

// 활성 배송비 정책 조회
export const getActiveShippingPolicies = async (): Promise<
  JsonBody<ShippingPolicyResponse[]>
> => {
  const response = await urlAxios.get("/admin/policies/shipping/active");
  return response.data;
};

// 배송비 정책 목록 조회
export const getShippingPolicies = async (): Promise<
  JsonBody<ShippingPolicyResponse[]>
> => {
  const response = await urlAxios.get("/admin/policies/shipping");
  return response.data;
};

// 배송비 정책 단건 조회
export const getShippingPolicy = async (
  policyId: number
): Promise<JsonBody<ShippingPolicyResponse>> => {
  const response = await urlAxios.get(`/admin/policies/shipping/${policyId}`);
  return response.data;
};

// 배송비 정책 생성
export const createShippingPolicy = async (
  data: ShippingPolicyCreateRequest
): Promise<JsonBody<ShippingPolicyResponse>> => {
  const response = await urlAxios.post("/admin/policies/shipping", data);
  return response.data;
};

// 배송비 정책 삭제
export const deleteShippingPolicy = async (policyId: number): Promise<JsonBody<void>> => {
  const response = await urlAxios.delete(`/admin/policies/shipping/${policyId}`);
  return response.data;
};

// 배송비 룰 생성
export const createShippingRule = async (
  data: ShippingRuleCreateRequest
): Promise<JsonBody<ShippingRuleResponse>> => {
  const response = await urlAxios.post("/admin/policies/shipping/rules", data);
  return response.data;
};

// 배송비 룰 삭제
export const deleteShippingRule = async (ruleId: number): Promise<JsonBody<void>> => {
  const response = await urlAxios.delete(`/admin/policies/shipping/rules/${ruleId}`);
  return response.data;
};
