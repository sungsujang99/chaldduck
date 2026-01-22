// src/components/OrderCompleteModal.tsx
import React, { useState } from "react";
import styled from "styled-components";
import { BANK_ACCOUNT } from "../constants/index";

interface Props {
    show: boolean;
    orderNo: string;
    finalAmount: number;
    paymentMethod: "BANK_TRANSFER" | "CARD";
    buyerName: string;
    productAmount: number; // 물품가격 (할인 적용 전 금액)
    discountAmount: number; // 총 할인 금액
    deliveryFee: number; // 배송비
    onClose: () => void;
}

export const OrderCompleteModal: React.FC<Props> = ({ show, orderNo, finalAmount, paymentMethod, buyerName, productAmount, discountAmount, deliveryFee, onClose }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    
    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            // 클립보드 API가 지원되지 않는 경우 fallback
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand("copy");
                setCopiedField(fieldName);
                setTimeout(() => setCopiedField(null), 2000);
            } catch (err) {
                alert("복사에 실패했습니다. 수동으로 복사해주세요.");
            }
            document.body.removeChild(textArea);
        }
    };
    
    if (!show) return null;

    return (
        <Overlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <Header>
                    <Title>✅ 주문이 완료되었습니다!</Title>
                    <CloseButton onClick={onClose}>×</CloseButton>
                </Header>

                {paymentMethod === "BANK_TRANSFER" && (
                    <>
                        <UrgentNotice>
                            <UrgentTitle>⏰ 긴급 안내</UrgentTitle>
                            <UrgentMessage>
                                <strong>2시간 이내</strong>에 입금을 완료해주세요.<br />
                                입금이 지연되면 주문이 자동 취소될 수 있습니다.
                            </UrgentMessage>
                        </UrgentNotice>

                        <OrderNoSection>
                            <OrderNoLabel>입금자명</OrderNoLabel>
                            <OrderNoBox>{buyerName}</OrderNoBox>
                            <OrderNoNotice>
                                ⚠️ 계좌이체 시 입금자명을 <strong>"{buyerName}"</strong>로 정확히 입력해주세요.
                            </OrderNoNotice>
                        </OrderNoSection>

                        <PaymentInfoSection>
                            <SectionTitle>💰 입금 계좌 정보</SectionTitle>
                            <InfoGrid>
                                <div>
                                    <b>은행:</b> 우리은행
                                </div>
                                <div>
                                    <b>계좌번호:</b> <strong style={{ fontSize: "16px", color: "#1976d2" }}>1005904547315</strong>
                                </div>
                                <div>
                                    <b>예금주:</b> 찰떡상회
                                </div>
                                <DividerLine />
                                <div>
                                    <b>물품가격:</b> <span>₩{productAmount.toLocaleString()}</span>
                                </div>
                                {discountAmount !== 0 && (
                                    <div>
                                        <b>총 할인:</b> <span style={{ color: "#d32f2f" }}>-₩{Math.abs(discountAmount).toLocaleString()}</span>
                                    </div>
                                )}
                                {deliveryFee > 0 && (
                                    <div>
                                        <b>배송비:</b> <span>₩{deliveryFee.toLocaleString()}</span>
                                    </div>
                                )}
                                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #ddd" }}>
                                    <b>입금액:</b> <strong style={{ fontSize: "18px", color: "#d32f2f" }}>₩{finalAmount.toLocaleString()}</strong>
                                </div>
                                <div>
                                    <b>입금자명:</b> <strong style={{ color: "#d32f2f", fontSize: "18px", letterSpacing: "1px" }}>{buyerName}</strong>
                                </div>
                            </InfoGrid>
                            <CopyAllButton 
                                onClick={() => copyToClipboard(`우리은행\n1005904547315\n${finalAmount}`, "all")}
                                $copied={copiedField === "all"}
                            >
                                {copiedField === "all" ? "✓ 복사 완료!" : "📋 계좌번호·은행·금액 한번에 복사"}
                            </CopyAllButton>
                        </PaymentInfoSection>

                        <PaymentGuideSection>
                            <SectionTitle>📋 입금 방법 안내</SectionTitle>
                            <GuideSteps>
                                <Step>
                                    <StepNumber>1</StepNumber>
                                    <StepContent>
                                        <b>은행 앱 또는 인터넷뱅킹</b>에 접속하세요
                                    </StepContent>
                                </Step>
                                <Step>
                                    <StepNumber>2</StepNumber>
                                    <StepContent>
                                        <b>계좌이체</b> 메뉴를 선택하세요
                                    </StepContent>
                                </Step>
                                <Step>
                                    <StepNumber>3</StepNumber>
                                    <StepContent>
                                        <b>받는 계좌:</b> 우리은행 1005904547315 (찰떡상회)
                                    </StepContent>
                                </Step>
                                <Step>
                                    <StepNumber>4</StepNumber>
                                    <StepContent>
                                        <b>입금액:</b> ₩{finalAmount.toLocaleString()}원
                                    </StepContent>
                                </Step>
                                <Step>
                                    <StepNumber>5</StepNumber>
                                    <StepContent>
                                        <b>입금자명:</b> <strong style={{ color: "#d32f2f" }}>{buyerName}</strong> (주문자 이름 그대로 입력)
                                    </StepContent>
                                </Step>
                                <Step>
                                    <StepNumber>6</StepNumber>
                                    <StepContent>
                                        이체 완료 후 <b>입금 확인</b>까지 1-2일 소요될 수 있습니다
                                    </StepContent>
                                </Step>
                            </GuideSteps>
                        </PaymentGuideSection>

                        <ImportantNotice>
                            <NoticeTitle>⚠️ 중요 안내사항</NoticeTitle>
                            <NoticeList>
                                <li>입금자명을 주문자 이름 <strong>"{buyerName}"</strong>과 <strong>정확히 일치</strong>시켜야 입금 확인이 가능합니다</li>
                                <li><strong>2시간 이내</strong>에 입금을 완료하지 않으면 주문이 자동 취소될 수 있습니다</li>
                                <li>입금자명이 다르면 입금 확인이 지연될 수 있습니다</li>
                                <li>입금 후 주문 확인 버튼에서 입금 상태를 확인할 수 있습니다</li>
                            </NoticeList>
                        </ImportantNotice>
                    </>
                )}

                {paymentMethod === "CARD" && (
                    <MessageSection>
                        <p>주문이 정상적으로 완료되었습니다.</p>
                        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
                            주문번호: <strong>{orderNo}</strong>
                        </p>
                    </MessageSection>
                )}

                <ButtonGroup>
                    <ConfirmButton onClick={onClose}>확인</ConfirmButton>
                </ButtonGroup>
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
    z-index: 2000;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: #fff;
    border-radius: 18px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
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

const OrderNoSection = styled.div`
    margin-bottom: 24px;
    text-align: center;
`;

const OrderNoLabel = styled.div`
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
`;

const OrderNoBox = styled.div`
    background: #f5f5f5;
    border: 2px solid #111;
    border-radius: 12px;
    padding: 20px;
    font-size: 24px;
    font-weight: bold;
    letter-spacing: 2px;
    font-family: "Courier New", monospace;
    margin-bottom: 16px;
    word-break: break-all;
`;

const OrderNoNotice = styled.div`
    font-size: 13px;
    color: #d32f2f;
    line-height: 1.6;
    padding: 12px;
    background: #ffebee;
    border-radius: 8px;
    border: 1px solid #ffcdd2;
`;

const UrgentNotice = styled.div`
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    text-align: center;
`;

const UrgentTitle = styled.div`
    font-size: 18px;
    font-weight: bold;
    color: #d32f2f;
    margin-bottom: 8px;
`;

const UrgentMessage = styled.div`
    font-size: 15px;
    color: #856404;
    line-height: 1.6;
    font-weight: 500;
`;

const PaymentInfoSection = styled.div`
    background: #f9f9f9;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
    font-size: 17px;
    font-weight: bold;
    margin-bottom: 12px;
`;

const InfoGrid = styled.div`
    font-size: 14px;
    line-height: 1.8;
    div + div {
        margin-top: 8px;
    }
`;

const DividerLine = styled.div`
    margin: 12px 0;
    padding-top: 12px;
    border-top: 1px solid #ddd;
`;

const CopyAllButton = styled.button<{ $copied: boolean }>`
    width: 100%;
    padding: 14px;
    margin-top: 16px;
    background: ${({ $copied }) => ($copied ? "#4caf50" : "#1976d2")};
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
    
    &:hover {
        background: ${({ $copied }) => ($copied ? "#45a049" : "#1565c0")};
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
    }
    
    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(25, 118, 210, 0.3);
    }
`;

const MessageSection = styled.div`
    text-align: center;
    padding: 20px 0;
    font-size: 16px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
`;

const PaymentGuideSection = styled.div`
    background: #e3f2fd;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    border: 1px solid #90caf9;
`;

const GuideSteps = styled.div`
    margin-top: 12px;
`;

const Step = styled.div`
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
    gap: 12px;
`;

const StepNumber = styled.div`
    background: #1976d2;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    flex-shrink: 0;
`;

const StepContent = styled.div`
    flex: 1;
    font-size: 14px;
    line-height: 1.6;
    padding-top: 2px;
`;

const ImportantNotice = styled.div`
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
`;

const NoticeTitle = styled.div`
    font-weight: bold;
    font-size: 15px;
    color: #856404;
    margin-bottom: 10px;
`;

const NoticeList = styled.ul`
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    color: #856404;
    line-height: 1.8;

    li {
        margin-bottom: 6px;
    }
`;

const ConfirmButton = styled.button`
    width: 100%;
    padding: 14px;
    background: #111;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #222;
    }
`;
