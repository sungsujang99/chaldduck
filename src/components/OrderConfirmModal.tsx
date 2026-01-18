// src/components/OrderConfirmModal.tsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { BANK_ACCOUNT, SHOP_ADDRESS, SHOP_PHONE } from "../constants/index";
import { 
    getOrdersByCustomer, 
    cancelOrderByCustomer
} from "../api/order";
import type { OrderResponse } from "../types/api";

interface Props {
    show: boolean;
    id: number | null; // customerId
    onClose: () => void;
    onCancel: (orderId: number, reason: string) => Promise<void>;
}

export const OrderConfirmModal: React.FC<Props> = ({ show, id, onClose, onCancel }) => {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
    const [showCancelInput, setShowCancelInput] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const [copiedOrderId, setCopiedOrderId] = useState<number | null>(null);

    const copyToClipboard = async (text: string, orderId: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedOrderId(orderId);
            setTimeout(() => setCopiedOrderId(null), 2000);
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopiedOrderId(orderId);
            setTimeout(() => setCopiedOrderId(null), 2000);
        }
    };

    const fetchOrders = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getOrdersByCustomer(id);
            const ordersList = res.data || [];
            
            // 날짜 순으로 정렬 (최신순)
            ordersList.sort((a, b) => {
                // orderNo에서 날짜 추출하여 정렬 (OD-YYYYMMDD-XXXXXX 형식)
                const dateA = a.orderNo.match(/\d{8}/)?.[0] || "";
                const dateB = b.orderNo.match(/\d{8}/)?.[0] || "";
                if (dateA && dateB) {
                    return dateB.localeCompare(dateA); // 최신순
                }
                return 0;
            });
            setOrders(ordersList);
            
            // 완료되거나 취소된 주문은 기본적으로 접혀있도록 설정
            const initiallyExpanded = new Set<number>();
            ordersList.forEach(order => {
                if (order.status !== "COMPLETED" && order.status !== "CANCELED") {
                    initiallyExpanded.add(order.orderId);
                }
            });
            setExpandedOrders(initiallyExpanded);
        } catch (e) {
            console.error("주문 조회 오류:", e);
            setError("서버 오류");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show && id) fetchOrders();
    }, [show, id]);

    const handleCancelOrder = async (orderId: number) => {
        if (!cancelReason.trim()) {
            alert("⚠️ 취소 사유를 입력해주세요.");
            return;
        }
        
        setCancelingOrderId(orderId);
        try {
            await onCancel(orderId, cancelReason.trim());
            // 취소 성공 시 주문 목록 새로고침
            if (id) {
                const res = await getOrdersByCustomer(id);
                setOrders(res.data || []);
            }
            setShowCancelInput(null);
            setCancelReason("");
        } catch (error: any) {
            console.error("Cancel order error:", error);
            // 에러는 이미 HomePage의 cancelOrder에서 alert로 표시됨
            // 여기서는 추가 처리 없이 입력 필드만 유지
        } finally {
            setCancelingOrderId(null);
        }
    };

    if (!show || !id) return null;

    const isConfirmed = (status: string) => status === "CONFIRMED" || status === "COMPLETED";
    
    const getStatusText = (status: string) => {
        switch (status) {
            case "CREATED":
                return "생성됨";
            case "PAID":
                return "결제완료";
            case "CONFIRMED":
                return "확인됨";
            case "COMPLETED":
                return "완료됨";
            case "CANCELED":
                return "주문 취소됨";
            default:
                return status;
        }
    };
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case "CREATED":
                return { bg: "#fff3cd", color: "#856404", border: "#ffc107" };
            case "PAID":
                return { bg: "#d1ecf1", color: "#0c5460", border: "#17a2b8" };
            case "CONFIRMED":
                return { bg: "#d4edda", color: "#155724", border: "#28a745" };
            case "COMPLETED":
                return { bg: "#e8f5e9", color: "#2e7d32", border: "#4caf50" };
            case "CANCELED":
                return { bg: "#f8d7da", color: "#721c24", border: "#dc3545" };
            default:
                return { bg: "#f5f5f5", color: "#666", border: "#ccc" };
        }
    };

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Title>📋 주문 확인</Title>
                    <CloseButton onClick={onClose}>×</CloseButton>
                </Header>

                {loading ? (
                    <EmptyMessage>주문을 불러오는 중...</EmptyMessage>
                ) : error ? (
                    <EmptyMessage style={{ color: "#d32f2f" }}>⚠️ {error}</EmptyMessage>
                ) : orders.length === 0 ? (
                    <EmptyMessage>조회된 주문이 없습니다.</EmptyMessage>
                ) : (
                    <OrdersList>
                        {orders.map((order) => {
                            const statusStyle = getStatusColor(order.status);
                            // 주문 날짜 추출 (orderNo에서)
                            const orderDateMatch = order.orderNo.match(/\d{8}/);
                            const orderDateStr = orderDateMatch 
                                ? `${orderDateMatch[0].substring(0, 4)}-${orderDateMatch[0].substring(4, 6)}-${orderDateMatch[0].substring(6, 8)}`
                                : "";
                            
                            // 주문 상품 요약 (첫 번째 상품명 + 외 N개)
                            const productSummary = order.items.length > 0
                                ? order.items.length === 1
                                    ? order.items[0].productName
                                    : `${order.items[0].productName} 외 ${order.items.length - 1}개`
                                : "";
                            
                            const isExpanded = expandedOrders.has(order.orderId);
                            const isCollapsible = order.status === "COMPLETED" || order.status === "CANCELED";
                            
                            return (
                                <OrderCard key={order.orderId}>
                                <OrderHeader 
                                    onClick={() => {
                                        if (isCollapsible) {
                                            const newExpanded = new Set(expandedOrders);
                                            if (isExpanded) {
                                                newExpanded.delete(order.orderId);
                                            } else {
                                                newExpanded.add(order.orderId);
                                            }
                                            setExpandedOrders(newExpanded);
                                        }
                                    }}
                                    style={{ cursor: isCollapsible ? "pointer" : "default" }}
                                >
                                    <OrderNo>
                                        {orderDateStr && <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>{orderDateStr}</div>}
                                        주문번호: {order.orderNo}
                                        {isCollapsible && (
                                            <span style={{ marginLeft: "8px", fontSize: "14px" }}>
                                                {isExpanded ? "▼" : "▶"}
                                            </span>
                                        )}
                                    </OrderNo>
                                    <StatusBadge 
                                        $confirmed={isConfirmed(order.status)}
                                        style={{
                                            background: statusStyle.bg,
                                            color: statusStyle.color,
                                            border: `1px solid ${statusStyle.border}`,
                                        }}
                                    >
                                        {getStatusText(order.status)}
                                    </StatusBadge>
                                </OrderHeader>

                                {/* 간단한 주문 요약 */}
                                <OrderSummarySection>
                                    <SummaryRow>
                                        <span>주문 방식:</span>
                                        <span>{order.fulfillmentType === "DELIVERY" ? "🚚 배송" : "🏪 픽업"}</span>
                                    </SummaryRow>
                                    <SummaryRow>
                                        <span>주문 상품:</span>
                                        <span>{productSummary}</span>
                                    </SummaryRow>
                                    <SummaryRow>
                                        <span>물품가격:</span>
                                        <span>₩{(order.subtotalAmount - order.discountAmount).toLocaleString()}</span>
                                    </SummaryRow>
                                    <SummaryRow>
                                        <span>배송비:</span>
                                        <span>{order.deliveryFee === 0 ? "무료" : `₩${order.deliveryFee.toLocaleString()}`}</span>
                                    </SummaryRow>
                                    <SummaryRow style={{ borderTop: "1px solid #ddd", paddingTop: "8px", marginTop: "8px" }}>
                                        <span><strong>총 결제금액:</strong></span>
                                        <strong style={{ fontSize: "16px", color: "#d32f2f" }}>₩{order.finalAmount.toLocaleString()}</strong>
                                    </SummaryRow>
                                    {order.status === "CREATED" && (
                                        <CopyAllButton 
                                            onClick={() => copyToClipboard(`우리은행\n1005904547315\n${order.finalAmount}`, order.orderId)}
                                            $copied={copiedOrderId === order.orderId}
                                        >
                                            {copiedOrderId === order.orderId ? "✓ 복사 완료!" : "📋 계좌번호·은행·금액 복사"}
                                        </CopyAllButton>
                                    )}
                                </OrderSummarySection>

                                {isExpanded && (
                                    <>
                                {/* 구매자/수령인 정보 */}
                                <Section>
                                    <SectionTitle>👤 수령인 정보</SectionTitle>
                                    <InfoGrid>
                                        <div>
                                            <b>이름:</b> {order.recipientName}
                                        </div>
                                        <div>
                                            <b>연락처:</b> {order.recipientPhone}
                                        </div>
                                    </InfoGrid>
                                </Section>

                                {/* 배달 주소 (픽업이면 숨김) */}
                                {order.fulfillmentType === "DELIVERY" && (order.address1 || order.address2) && (
                                    <Section>
                                        <SectionTitle>🚚 배달 주소</SectionTitle>
                                        <InfoGrid>
                                            <div>{order.address1}</div>
                                            {order.address2 && (
                                                <div>
                                                    <b>상세:</b> {order.address2}
                                                </div>
                                            )}
                                            {order.zipCode && (
                                                <div>
                                                    <b>우편번호:</b> {order.zipCode}
                                                </div>
                                            )}
                                        </InfoGrid>
                                    </Section>
                                )}
                                {order.fulfillmentType === "PICKUP" && (
                                    <Section>
                                        <SectionTitle>🏪 픽업 정보</SectionTitle>
                                        <InfoGrid>
                                            <div>매장에서 직접 픽업</div>
                                        </InfoGrid>
                                    </Section>
                                )}

                                {/* 주문 상품 */}
                                <Section>
                                    <SectionTitle>🧁 주문 상품</SectionTitle>
                                    <ItemsList>
                                        {order.items.map((item) => (
                                            <ItemRow key={item.orderItemId}>
                                                <ItemInfo>
                                                    <ItemName>{item.productName}</ItemName>
                                                    <ItemQty>× {item.quantity}</ItemQty>
                                                </ItemInfo>
                                                <ItemPrice>₩{item.lineTotal.toLocaleString()}</ItemPrice>
                                            </ItemRow>
                                        ))}
                                    </ItemsList>
                                </Section>

                                {/* 결제 금액 요약 */}
                                <SummarySection>
                                    <SummaryRow>
                                        <span>물품가격</span>
                                        <span>₩{(order.subtotalAmount - order.discountAmount).toLocaleString()}</span>
                                    </SummaryRow>
                                    <SummaryRow>
                                        <span>배송비</span>
                                        <span>{order.deliveryFee === 0 ? "무료" : `₩${order.deliveryFee.toLocaleString()}`}</span>
                                    </SummaryRow>
                                    <TotalRow>
                                        <strong>총 결제금액</strong>
                                        <strong>₩{order.finalAmount.toLocaleString()}</strong>
                                    </TotalRow>
                                </SummarySection>

                                {/* 주문 상태 정보 */}
                                <Section>
                                    <SectionTitle>📊 주문 상태</SectionTitle>
                                    <InfoGrid>
                                        <div>
                                            <b>주문 상태:</b> <span style={{ fontWeight: "bold", color: getStatusColor(order.status).color }}>{getStatusText(order.status)}</span>
                                        </div>
                                        {order.fulfillmentType === "DELIVERY" && order.trackingNo && (order.status === "CONFIRMED" || order.status === "COMPLETED") && (
                                            <div>
                                                <b>운송장 번호:</b> <strong style={{ fontSize: "16px", color: "#1976d2" }}>{order.trackingNo}</strong>
                                            </div>
                                        )}
                                        {order.fulfillmentType === "DELIVERY" && (
                                            <div>
                                                <b>배송 상태:</b> {
                                                    order.deliveryStatus === "NONE" ? "배송 없음" :
                                                    order.deliveryStatus === "READY" ? "배송 준비중" :
                                                    order.deliveryStatus === "DELIVERING" ? "배송중" :
                                                    order.deliveryStatus === "DELIVERED" ? "배송 완료" :
                                                    order.deliveryStatus
                                                }
                                            </div>
                                        )}
                                        {order.canceledAt && (
                                            <div>
                                                <b>취소 일시:</b> {new Date(order.canceledAt).toLocaleString("ko-KR")}
                                            </div>
                                        )}
                                        {order.cancelReason && (
                                            <div>
                                                <b>취소 사유:</b> {order.cancelReason}
                                            </div>
                                        )}
                                    </InfoGrid>
                                </Section>
                                    </>
                                )}

                                <ButtonGroup>
                                    {(order.status === "CREATED" || order.status === "PAID") && (
                                        <>
                                            {showCancelInput === order.orderId ? (
                                                <CancelInputSection>
                                                    <CancelInput
                                                        type="text"
                                                        placeholder="취소 사유를 입력하세요"
                                                        value={cancelReason}
                                                        onChange={(e) => setCancelReason(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && cancelReason.trim()) {
                                                                handleCancelOrder(order.orderId);
                                                            } else if (e.key === "Escape") {
                                                                setShowCancelInput(null);
                                                                setCancelReason("");
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                    <CancelButtonRow>
                                                        <CancelConfirmButton
                                                            onClick={() => handleCancelOrder(order.orderId)}
                                                            disabled={!cancelReason.trim() || cancelingOrderId === order.orderId}
                                                        >
                                                            {cancelingOrderId === order.orderId ? "취소 중..." : "확인"}
                                                        </CancelConfirmButton>
                                                        <CancelCancelButton
                                                            onClick={() => {
                                                                setShowCancelInput(null);
                                                                setCancelReason("");
                                                            }}
                                                            disabled={cancelingOrderId === order.orderId}
                                                        >
                                                            취소
                                                        </CancelCancelButton>
                                                    </CancelButtonRow>
                                                </CancelInputSection>
                                            ) : (
                                                <CancelButton 
                                                    onClick={() => {
                                                        setShowCancelInput(order.orderId);
                                                        setCancelReason("");
                                                    }}
                                                    disabled={cancelingOrderId === order.orderId}
                                                >
                                                    주문 취소
                                                </CancelButton>
                                            )}
                                        </>
                                    )}
                                    <CloseButtonFull onClick={onClose}>닫기</CloseButtonFull>
                                </ButtonGroup>
                                </OrderCard>
                            );
                        })}
                    </OrdersList>
                )}
            </ModalContent>
        </Overlay>
    );
};

/* Styled Components */
const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: #fff;
    border-radius: 18px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
`;

const Title = styled.h2`
    font-size: 24px;
    font-weight: bold;
    margin: 0;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const OrdersList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const OrderCard = styled.div`
    background: #fff;
    border: 1px solid #eee;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const OrderHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 8px;
`;

const OrderNo = styled.div`
    font-size: 14px;
    color: #555;
`;

const StatusBadge = styled.div<{ $confirmed: boolean }>`
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
    background: ${({ $confirmed }) => ($confirmed ? "#e8f5e9" : "#fff3cd")};
    color: ${({ $confirmed }) => ($confirmed ? "#2e7d32" : "#856404")};
    border: 1px solid ${({ $confirmed }) => ($confirmed ? "#4caf50" : "#ffc107")};
`;

const Section = styled.div`
    margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
    font-size: 17px;
    font-weight: bold;
    margin-bottom: 10px;
`;

const InfoGrid = styled.div`
    background: #f9f9f9;
    padding: 12px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 1.6;
    div + div {
        margin-top: 4px;
    }
`;

const ItemsList = styled.div`
    background: #f9f9f9;
    border-radius: 10px;
    padding: 12px;
`;

const ItemRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    &:not(:last-child) {
        border-bottom: 1px solid #eee;
    }
`;

const ItemInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const ItemName = styled.div`
    font-weight: 500;
`;

const ItemQty = styled.div`
    color: #666;
    font-size: 14px;
`;

const ItemPrice = styled.div`
    font-weight: bold;
`;

const SummarySection = styled.div`
    background: #f5f5f5;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    font-size: 15px;
`;

const SummaryRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    .discount {
        color: #d32f2f;
    }
`;

const TotalRow = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: bold;
    padding-top: 12px;
    border-top: 2px solid #ddd;
    margin-top: 8px;
`;

const ButtonGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const CancelButton = styled.button`
    padding: 14px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: #c82333;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
    }
    
    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
    }
    
    &:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
`;

const CloseButtonFull = styled.button`
    padding: 14px;
    background: #111;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
`;

const EmptyMessage = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: #888;
    font-size: 16px;
`;

const OrderSummarySection = styled.div`
    background: #f9f9f9;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 16px;
    font-size: 14px;
`;

const CancelInputSection = styled.div`
    width: 100%;
    margin-bottom: 10px;
`;

const CancelInput = styled.input`
    width: 100%;
    padding: 12px;
    border: 2px solid #dc3545;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 8px;
    box-sizing: border-box;
    outline: none;
    
    &:focus {
        border-color: #c82333;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
`;

const CancelButtonRow = styled.div`
    display: flex;
    gap: 8px;
`;

const CancelConfirmButton = styled.button`
    flex: 1;
    padding: 10px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover:not(:disabled) {
        background: #c82333;
    }
    
    &:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
`;

const CancelCancelButton = styled.button`
    flex: 1;
    padding: 10px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover:not(:disabled) {
        background: #5a6268;
    }
    
    &:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
`;

const CopyAllButton = styled.button<{ $copied: boolean }>`
    width: 100%;
    margin-top: 12px;
    padding: 12px 16px;
    background: ${({ $copied }) => ($copied ? "#4caf50" : "#1976d2")};
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: ${({ $copied }) => ($copied ? "#45a049" : "#1565c0")};
        transform: translateY(-1px);
    }
    
    &:active {
        transform: translateY(0);
    }
`;
