// src/components/ProductSelection.tsx
import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { FetchedMenuItem, PaymentMethod } from "../types/types";
import urlAxios from "../utils/urlAxios";
import { UpdatedSummaryOutput } from "../hooks/useOrderSummary";

interface Props {
    cart: { id: string; qty: number }[];
    changeQty: (item: FetchedMenuItem, delta: number) => void;
    paymentMethod: PaymentMethod;
    purchaseType: "pickup" | "delivery" | "";
    summary: UpdatedSummaryOutput | null;
    items: FetchedMenuItem[];
    orderEnabled?: boolean;
}

export const ProductSelection: React.FC<Props> = ({ cart, changeQty, summary, items, purchaseType, orderEnabled = true }) => {
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    // 카테고리별 접기/펼치기 상태 관리 (기본값: 모두 펼침)
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // 카테고리별로 상품 그룹화 (서버에서 받은 categoryName 사용)
    const groupedItems = useMemo(() => {
        const groups: Record<string, { name: string; items: FetchedMenuItem[] }> = {};
        
        items.forEach(item => {
            const categoryCode = item.categoryCode || "OTHER";
            const categoryName = item.categoryName || "기타";
            
            if (!groups[categoryCode]) {
                groups[categoryCode] = {
                    name: categoryName,
                    items: []
                };
            }
            groups[categoryCode].items.push(item);
        });

        // 카테고리 코드로 정렬하여 반환
        return Object.entries(groups)
            .map(([code, data]) => ({
                category: code,
                label: data.name,
                items: data.items
            }))
            .sort((a, b) => a.category.localeCompare(b.category));
    }, [items]);

    // 카테고리 토글 함수
    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // 카테고리가 펼쳐져 있는지 확인 (기본값: true)
    const isCategoryExpanded = (category: string) => {
        return expandedCategories[category] !== false; // undefined면 true (기본 펼침)
    };

    const handleQuantityClick = (productId: string, currentQty: number) => {
        setEditingProductId(productId);
        setEditValue(String(currentQty));
    };

    const handleQuantityBlur = (p: FetchedMenuItem, currentQty: number) => {
        const numQty = parseInt(editValue, 10);
        if (!isNaN(numQty) && numQty >= 0) {
            const delta = numQty - currentQty;
            if (delta !== 0) {
                changeQty(p, delta);
            }
        }
        setEditingProductId(null);
        setEditValue("");
    };

    const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, p: FetchedMenuItem, currentQty: number) => {
        if (e.key === "Enter") {
            handleQuantityBlur(p, currentQty);
        } else if (e.key === "Escape") {
            setEditingProductId(null);
            setEditValue("");
        }
    };

    return (
        <Container>
            <Title>🧁 상품 선택</Title>

            <div>
                {groupedItems.map((group) => {
                    const isExpanded = isCategoryExpanded(group.category);
                    return (
                        <CategorySection key={group.category}>
                            <CategoryHeader onClick={() => toggleCategory(group.category)}>
                                <CategoryTitle>
                                    <CategoryIcon>{isExpanded ? "▼" : "▶"}</CategoryIcon>
                                    {group.label}
                                </CategoryTitle>
                                <CategoryCount>({group.items.length})</CategoryCount>
                            </CategoryHeader>
                            {isExpanded && group.items.map((p) => {
                            const item = cart.find((x) => x.id === p.productId);
                            const q = item ? item.qty : 0;
                            const isEditing = editingProductId === p.productId;
                            // 품절 여부 확인: 재고가 안전재고 이하이거나 soldOutStatus가 SOLD_OUT
                            const isSoldOut = p.soldOutStatus === "SOLD_OUT" || p.stockQty <= p.safetyStock;

                            return (
                                <ProductItem key={p.productId} style={{ opacity: isSoldOut ? 0.6 : 1 }}>
                                    <ProductInfo>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <b style={{ color: isSoldOut ? "#999" : "#000" }}>{p.name}</b>
                                            {isSoldOut && (
                                                <SoldOutBadge>품절</SoldOutBadge>
                                            )}
                                        </div>
                                        <span style={{ color: isSoldOut ? "#999" : "#000" }}>₩{p.price.toLocaleString()}</span>
                                    </ProductInfo>

                                    {orderEnabled && !isSoldOut && (
                                        <QuantityControls>
                                            <QtyButton onClick={() => changeQty(p, -1)}>-</QtyButton>
                                            {isEditing ? (
                                                <QuantityInput
                                                    type="number"
                                                    min="0"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => handleQuantityBlur(p, q)}
                                                    onKeyDown={(e) => handleQuantityKeyDown(e, p, q)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <Quantity onClick={() => handleQuantityClick(p.productId, q)}>{q}</Quantity>
                                            )}
                                            <QtyButton onClick={() => changeQty(p, 1)}>+</QtyButton>
                                        </QuantityControls>
                                    )}
                                    {orderEnabled && isSoldOut && (
                                        <div style={{ fontSize: "14px", color: "#999", fontWeight: "600" }}>
                                            선택 불가
                                        </div>
                                    )}
                                    {!orderEnabled && (
                                        <div style={{ fontSize: "14px", color: "#666" }}>
                                            ₩{p.price.toLocaleString()}
                                        </div>
                                    )}
                                </ProductItem>
                            );
                            })}
                        </CategorySection>
                    );
                })}
            </div>

            {orderEnabled && (
                <SummaryBox>
                    {!summary ? (
                        <EmptyMessage>담긴 상품이 없습니다.</EmptyMessage>
                    ) : (
                        <>
                            {summary.items.map((item, idx) => (
                                <ItemLine key={idx}>
                                    • {item.name} x{item.qty}=₩{item.originPrice.toLocaleString()}
                                    {item.info.map((info, iidx) => (
                                        <InfoLine key={iidx}>↳ {info}</InfoLine>
                                    ))}
                                </ItemLine>
                            ))}
                            <Divider />
                            <Bold>상품 합계: ₩{summary.origin.toLocaleString()}</Bold>
                            <br />
                            {summary.disc > 0 && (
                                <>
                                    <Bold color="#d00">총 할인: ₩{summary.disc.toLocaleString()}</Bold>
                                    <br />
                                </>
                            )}
                            {purchaseType === "delivery" && (
                                <>
                                    배송비: {summary.shipping === 0 ? "무료" : `₩${summary.shipping.toLocaleString()}`}
                                    <br />
                                </>
                            )}
                            <Divider />
                            <Bold>총 결제금액: ₩{summary.finalPrice.toLocaleString()}</Bold>
                        </>
                    )}
                </SummaryBox>
            )}
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    background: #fff;
    border: 1px solid #eee;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 18px;
`;

const Title = styled.h3`
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
`;

const CategorySection = styled.div`
    margin-bottom: 16px;
    
    &:last-child {
        margin-bottom: 0;
    }
`;

const CategoryHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    font-weight: 600;
    color: #555;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    margin-bottom: 10px;
    border-left: 3px solid #1E6EFF;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;

    &:hover {
        background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
    }

    &:active {
        background: linear-gradient(135deg, #dee2e6 0%, #ced4da 100%);
    }
`;

const CategoryTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const CategoryIcon = styled.span`
    font-size: 12px;
    color: #1E6EFF;
    transition: transform 0.2s;
`;

const CategoryCount = styled.span`
    font-size: 13px;
    color: #888;
    font-weight: 500;
`;

const ProductItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const ProductInfo = styled.div`
    & > b {
        font-size: 16px;
    }
    & > span {
        color: #000;
        font-size: 14px;
    }
`;

const QuantityControls = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const QtyButton = styled.button`
    width: 32px;
    height: 32px;
    font-weight: bold;
    font-size: 18px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: #f5f5f5;
    }
`;

const Quantity = styled.span`
    min-width: 20px;
    text-align: center;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 6px;
    transition: background-color 0.2s;
    user-select: none;
    
    &:hover {
        background-color: #f0f0f0;
    }
    
    &:active {
        background-color: #e0e0e0;
    }
`;

const QuantityInput = styled.input`
    width: 40px;
    text-align: center;
    font-weight: 600;
    font-size: 15px;
    padding: 4px 6px;
    border: 2px solid #1E6EFF;
    border-radius: 6px;
    outline: none;
    
    &:focus {
        border-color: #1E6EFF;
        box-shadow: 0 0 0 2px rgba(30, 110, 255, 0.2);
    }
`;

const SummaryBox = styled.div`
    background: #fafafa;
    border-radius: 12px;
    padding: 12px;
    font-size: 14px;
    margin-top: 10px;
    border: 1px solid #eee;
`;

const EmptyMessage = styled.div`
    color: #888;
`;

const ItemLine = styled.div`
    margin-bottom: 8px;
`;

const InfoLine = styled.span`
    color: #000;
    font-size: 13px;
    display: block;
    margin-left: 12px;
`;

const Divider = styled.hr`
    margin: 8px 0;
    border: none;
    border-top: 1px solid #eee;
`;

const Bold = styled.b`
    color: ${(props) => props.color || "#000"};
`;

const SoldOutBadge = styled.span`
    display: inline-block;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    background: #ff4444;
    border-radius: 4px;
`;
