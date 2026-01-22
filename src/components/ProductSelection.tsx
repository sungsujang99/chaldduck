// src/components/ProductSelection.tsx
import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { FetchedMenuItem, PaymentMethod } from "../types/types";
import urlAxios from "../utils/urlAxios";
import { UpdatedSummaryOutput } from "../hooks/useOrderSummary";
import { CATEGORY_LABELS, ProductCategory } from "../types/api";

interface Props {
    cart: { id: string; qty: number }[];
    changeQty: (item: FetchedMenuItem, delta: number) => void;
    paymentMethod: PaymentMethod;
    purchaseType: "pickup" | "delivery" | "";
    summary: UpdatedSummaryOutput | null;
    items: FetchedMenuItem[];
    orderEnabled?: boolean;
}

// 카테고리 정렬 순서
const CATEGORY_ORDER: ProductCategory[] = [
    "RICE_CAKE", "CAKE", "BREAD", "COOKIE", "CHOCOLATE", 
    "ICE_CREAM", "BEVERAGE", "GIFT_SET", "OTHER"
];

export const ProductSelection: React.FC<Props> = ({ cart, changeQty, summary, items, purchaseType, orderEnabled = true }) => {
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    // 카테고리별로 상품 그룹화
    const groupedItems = useMemo(() => {
        const groups: Record<string, FetchedMenuItem[]> = {};
        
        items.forEach(item => {
            const category = item.category || "OTHER";
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        });

        // 정렬된 카테고리 순서로 반환
        return CATEGORY_ORDER
            .filter(cat => groups[cat] && groups[cat].length > 0)
            .map(cat => ({
                category: cat,
                label: CATEGORY_LABELS[cat],
                items: groups[cat]
            }));
    }, [items]);

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
                {groupedItems.map((group) => (
                    <CategorySection key={group.category}>
                        <CategoryHeader>{group.label}</CategoryHeader>
                        {group.items.map((p) => {
                            const item = cart.find((x) => x.id === p.productId);
                            const q = item ? item.qty : 0;
                            const isEditing = editingProductId === p.productId;

                            return (
                                <ProductItem key={p.productId}>
                                    <ProductInfo>
                                        <b>{p.name}</b>
                                        <br />
                                        <span>₩{p.price.toLocaleString()}</span>
                                    </ProductInfo>

                                    {orderEnabled && (
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
                                    {!orderEnabled && (
                                        <div style={{ fontSize: "14px", color: "#666" }}>
                                            ₩{p.price.toLocaleString()}
                                        </div>
                                    )}
                                </ProductItem>
                            );
                        })}
                    </CategorySection>
                ))}
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
    font-size: 15px;
    font-weight: 600;
    color: #555;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    margin-bottom: 10px;
    border-left: 3px solid #1E6EFF;
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
    min-width: 28px;
    text-align: center;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    padding: 4px 8px;
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
    width: 50px;
    text-align: center;
    font-weight: 600;
    font-size: 15px;
    padding: 4px 8px;
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
