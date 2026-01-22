// src/components/BuyerInfo.tsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import urlAxios from "../utils/urlAxios";
import { Address } from "../types/types";

interface Props {
    buyerName: string;
    setBuyerName: (v: string) => void;
    buyerPhone: string;
    setBuyerPhone: (v: string) => void;
    buyerId: number | null;
    handleLogin: () => Promise<void>;
    handleOrderModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BuyerInfo: React.FC<Props> = ({ buyerName, setBuyerName, buyerPhone, setBuyerPhone, buyerId, handleLogin, handleOrderModalOpen }) => {
    const [isAutoChecking, setIsAutoChecking] = useState(false);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, "");
        const formatted = val.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3").slice(0, 13);
        setBuyerPhone(formatted);
    };

    // 이름과 번호가 모두 입력되면 자동으로 고객 식별
    useEffect(() => {
        const autoIdentify = async () => {
            // buyerId가 이미 있으면 실행하지 않음
            if (buyerId) return;
            
            // 이름과 번호가 모두 입력되었는지 확인 (최소 길이 체크)
            const nameTrimmed = buyerName.trim();
            const phoneTrimmed = buyerPhone.replace(/[^0-9]/g, "");
            
            // 이름이 2자 이상, 전화번호가 10자리 이상 (010으로 시작하는 11자리)
            if (nameTrimmed.length >= 2 && phoneTrimmed.length >= 10 && !isAutoChecking) {
                setIsAutoChecking(true);
                try {
                    await handleLogin();
                } catch (error) {
                    console.error("Auto identify error:", error);
                } finally {
                    setIsAutoChecking(false);
                }
            }
        };

        // debounce: 입력이 멈춘 후 500ms 후에 실행
        const timer = setTimeout(() => {
            autoIdentify();
        }, 500);

        return () => clearTimeout(timer);
    }, [buyerName, buyerPhone, buyerId, handleLogin, isAutoChecking]);


    return (
        <Container>
            <Title>👤 구매자 정보</Title>

            <InputGrid>
                <Input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="이름" disabled={buyerId ? true : false} />
                <Input type="tel" value={buyerPhone} onChange={handlePhoneChange} placeholder="연락처 (010-xxxx-xxxx)" disabled={buyerId ? true : false} />
            </InputGrid>

            <ButtonGrid>
                <Button type="button" onClick={() => handleLogin()}>
                    💾 내 정보 불러오기
                </Button>
            </ButtonGrid>

            <ConfirmButton onClick={() => handleOrderModalOpen(true)}>주문확인</ConfirmButton>
        </Container>
    );
};


export default BuyerInfo;

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

const InputGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 8px;

    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
`;

const Input = styled.input`
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #ddd;
    box-sizing: border-box;
    font-size: 15px;
`;

const ButtonGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
`;

const Button = styled.button`
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 12px;
    background: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f9f9f9;
    }
`;

const ConfirmButton = styled.button`
    width: 100%;
    padding: 12px;
    margin-top: 8px;
    background: #111;
    color: #fff;
    border: 1px solid #111;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #222;
    }
`;
