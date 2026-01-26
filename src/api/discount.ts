import urlAxios from "../utils/urlAxios";
import type {
  JsonBody,
  DiscountPolicyResponse,
  DiscountPolicyCreateRequest,
  DiscountRuleResponse,
  DiscountRuleCreateRequest,
  DiscountRuleUpdateRequest,
} from "../types/api";

// 활성 할인 정책 조회
export const getActiveDiscountPolicies = async (): Promise<
  JsonBody<DiscountPolicyResponse[]>
> => {
  const response = await urlAxios.get("/admin/policies/discount/active", {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
    params: {
      _t: Date.now(), // 캐시 방지를 위한 타임스탬프
    },
  });
  return response.data;
};

// 할인 정책 목록 조회
export const getDiscountPolicies = async (): Promise<
  JsonBody<DiscountPolicyResponse[]>
> => {
  const response = await urlAxios.get("/admin/policies/discount");
  return response.data;
};

// 할인 정책 단건 조회
export const getDiscountPolicy = async (
  policyId: number
): Promise<JsonBody<DiscountPolicyResponse>> => {
  const response = await urlAxios.get(`/admin/policies/discount/${policyId}`);
  return response.data;
};

// 할인 정책 생성
export const createDiscountPolicy = async (
  data: DiscountPolicyCreateRequest
): Promise<JsonBody<DiscountPolicyResponse>> => {
  const response = await urlAxios.post("/admin/policies/discount", data);
  return response.data;
};

// 할인 정책 삭제
export const deleteDiscountPolicy = async (policyId: number): Promise<JsonBody<void>> => {
  const response = await urlAxios.delete(`/admin/policies/discount/${policyId}`);
  return response.data;
};

// 할인 룰 생성
export const createDiscountRule = async (
  data: DiscountRuleCreateRequest
): Promise<JsonBody<DiscountRuleResponse>> => {
  const response = await urlAxios.post("/admin/policies/discount/rules", data);
  return response.data;
};

// 할인 룰 수정
export const updateDiscountRule = async (
  ruleId: number,
  data: DiscountRuleUpdateRequest
): Promise<JsonBody<DiscountRuleResponse>> => {
  const response = await urlAxios.put(`/admin/policies/discount/rules/${ruleId}`, data);
  return response.data;
};

// 할인 룰 삭제
export const deleteDiscountRule = async (ruleId: number): Promise<JsonBody<void>> => {
  const response = await urlAxios.delete(`/admin/policies/discount/rules/${ruleId}`);
  return response.data;
};
