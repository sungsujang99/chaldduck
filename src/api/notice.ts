import urlAxios from "../utils/urlAxios";
import type { JsonBody, NoticeResponse } from "../types/api";

export type NoticeType = "ORDER_FORM" | "DEPOSIT_CONFIRMATION";

export const getNoticeByType = async (type: NoticeType): Promise<NoticeResponse | null> => {
  try {
    const response = await urlAxios.get(`/notices/${type}`);
    const body = response.data as JsonBody<NoticeResponse>;
    return body?.data?.content ? body.data : null;
  } catch {
    return null;
  }
};
