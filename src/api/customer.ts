import urlAxios from "../utils/urlAxios";
import type {
  JsonBody,
  CustomerResponse,
  CustomerUpsertRequest,
  AddressResponse,
  AddressCreateRequest,
  AddressUpdateRequest,
  CustomerProfileResponse,
  CustomerBlockUpdateRequest,
} from "../types/api";

// 고객 식별/생성
export const identifyCustomer = async (
  data: CustomerUpsertRequest
): Promise<JsonBody<CustomerResponse>> => {
  const response = await urlAxios.post("/customers/identify", data);
  return response.data;
};

// 고객 프로필 조회
export const getCustomerProfile = async (
  customerId: number
): Promise<JsonBody<CustomerProfileResponse>> => {
  const response = await urlAxios.get(`/customers/${customerId}/profile`);
  return response.data;
};

// 주소 추가
export const addAddress = async (
  customerId: number,
  data: AddressCreateRequest
): Promise<JsonBody<AddressResponse>> => {
  const response = await urlAxios.post(`/customers/${customerId}/addresses`, data);
  return response.data;
};

// 주소 수정
export const updateAddress = async (
  customerId: number,
  addressId: number,
  data: AddressUpdateRequest
): Promise<JsonBody<AddressResponse>> => {
  const response = await urlAxios.put(`/customers/${customerId}/addresses/${addressId}`, data);
  return response.data;
};

// 주소 삭제
export const deleteAddress = async (
  customerId: number,
  addressId: number
): Promise<JsonBody<void>> => {
  const response = await urlAxios.delete(`/customers/${customerId}/addresses/${addressId}`);
  return response.data;
};

// 고객 차단/해제 설정 (Admin)
export const updateCustomerBlocked = async (
  customerId: number,
  data: CustomerBlockUpdateRequest
): Promise<JsonBody<void>> => {
  const response = await urlAxios.patch(`/admin/customers/${customerId}/blocked`, data);
  return response.data;
};
