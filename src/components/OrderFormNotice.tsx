import React, { useEffect, useState } from "react";
import { getNoticeByType } from "../api/notice";

export const OrderFormNotice: React.FC = () => {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    getNoticeByType("ORDER_FORM").then((notice) => {
      if (notice?.content) setContent(notice.content);
    });
  }, []);

  if (!content) return null;

  return (
    <div
      style={{
        background: "#f8f9fa",
        border: "1px solid #e9ecef",
        borderRadius: "12px",
        padding: "14px 16px",
        marginBottom: "18px",
        fontSize: "14px",
        lineHeight: 1.6,
        color: "#495057",
        whiteSpace: "pre-wrap",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#212529" }}>📋 주문서 공지</div>
      <div>{content}</div>
    </div>
  );
};
