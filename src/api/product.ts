import urlAxios from "../utils/urlAxios";
import type {
  JsonBody,
  AdminProductStockRow,
  ProductCreateRequest,
  StockUpdateRequest,
} from "../types/api";

// 상품+재고 목록 조회
export const getProducts = async (): Promise<JsonBody<AdminProductStockRow[]>> => {
  const response = await urlAxios.get("/admin/products", {
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

// 상품 생성
export const createProduct = async (
  data: ProductCreateRequest
): Promise<JsonBody<AdminProductStockRow>> => {
  const response = await urlAxios.post("/admin/products", data);
  return response.data;
};

// 재고 수정
export const updateStock = async (
  productId: number,
  data: StockUpdateRequest
): Promise<JsonBody<void>> => {
  const response = await urlAxios.put(`/admin/products/${productId}/stock`, data);
  return response.data;
};
