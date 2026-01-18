import urlAxios from "../utils/urlAxios";
import type { JsonBody, FeatureFlagResponse } from "../types/api";

// 기능 목록 조회
export const getFeatures = async (): Promise<JsonBody<FeatureFlagResponse[]>> => {
  const response = await urlAxios.get("/admin/features");
  return response.data;
};

// 주문 기능 활성화 여부 확인
export const isOrderEnabled = async (): Promise<boolean> => {
  try {
    const res = await getFeatures();
    const orderFeature = res.data.find((f) => f.key === "ORDER");
    return orderFeature?.enabled ?? false;
  } catch (error) {
    console.error("Failed to check order feature:", error);
    return false;
  }
};

// 무통장 거래 기능 활성화 여부 확인
export const isBankTransferEnabled = async (): Promise<boolean> => {
  try {
    const res = await getFeatures();
    const bankTransferFeature = res.data.find((f) => f.key === "BANK_TRANSFER");
    return bankTransferFeature?.enabled ?? false;
  } catch (error) {
    console.error("Failed to check bank transfer feature:", error);
    return false;
  }
};

// 주문 기능 정보 조회 (오픈시간 포함)
export const getOrderFeatureInfo = async (): Promise<FeatureFlagResponse | null> => {
  try {
    const res = await getFeatures();
    const orderFeature = res.data.find((f) => f.key === "ORDER");
    return orderFeature || null;
  } catch (error) {
    console.error("Failed to get order feature info:", error);
    return null;
  }
};
