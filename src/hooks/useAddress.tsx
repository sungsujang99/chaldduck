import { useState, useEffect, useRef, useCallback } from "react";
import { Address } from "../types/types";
import { getCustomerProfile, addAddress, updateAddress } from "../api/customer";
import type { AddressResponse } from "../types/api";

export const useAddress = (customerId: number | null, buyerName?: string, buyerPhone?: string) => {
    const [address, setAddress] = useState<Address>({
        addressId: "",
        label: "집",
        recipientName: buyerName || "",
        recipientPhone: buyerPhone || "",
        zipCode: "",
        address1: "",
        address2: "",
        isDefault: false,
    });
    const [addresses, setAddresses] = useState<AddressResponse[]>([]);
    const [entranceCode, setEntranceCode] = useState("");
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        if (customerId) {
            loadAddresses();
        }
    }, [customerId]);

    const loadAddresses = async () => {
        if (!customerId) return;
        try {
            const res = await getCustomerProfile(customerId);
            const addrList = res.data.addresses;
            setAddresses(addrList);
            // 기본 주소가 있으면 설정
            const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
            if (defaultAddr) {
                // address2에서 공동현관 비밀번호 분리
                const address2Parts = defaultAddr.address2.split("\n");
                const mainAddress2 = address2Parts[0] || defaultAddr.address2;
                const entranceMatch = defaultAddr.address2.match(/공동현관[:\s]*(\d+)/);
                const entrance = entranceMatch ? entranceMatch[1] : "";
                
                isInitialLoadRef.current = true;
                setAddress({
                    addressId: String(defaultAddr.addressId),
                    label: defaultAddr.label,
                    recipientName: defaultAddr.recipientName,
                    recipientPhone: defaultAddr.recipientPhone,
                    zipCode: defaultAddr.zipCode,
                    address1: defaultAddr.address1,
                    address2: mainAddress2,
                    isDefault: defaultAddr.isDefault,
                });
                setEntranceCode(entrance);
                isInitialLoadRef.current = false;
            }
        } catch (error) {
            console.error("Failed to load addresses:", error);
        }
    };

    const openAddressModal = () => {
        if ((window as any).daum && (window as any).daum.Postcode) {
            new (window as any).daum.Postcode({
                oncomplete: function (data: any) {
                    // 다음 우편번호 API 응답 구조 확인 및 우편번호 추출
                    // zonecode가 없거나 잘못된 경우 다른 필드 확인
                    const zipCode = data.zonecode || data.postcode || data.postCode || "";
                    
                    console.log("다음 우편번호 API 응답:", data);
                    console.log("추출된 우편번호:", zipCode);
                    
                    setAddress((prev) => ({
                        ...prev,
                        address1: data.roadAddress || data.jibunAddress,
                        zipCode: zipCode,
                    }));
                },
            }).open();
        } else {
            alert("주소 API를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const saveAddress = useCallback(async (showAlert = false) => {
        if (!customerId) {
            return;
        }
        if (!address.address1 || !address.address2 || !address.recipientName || !address.recipientPhone) {
            return;
        }
        try {
            // address2 끝에 공동현관 비밀번호 추가
            let finalAddress2 = address.address2.trim();
            if (entranceCode && entranceCode.trim()) {
                finalAddress2 = finalAddress2 ? `${finalAddress2}\n공동현관: ${entranceCode.trim()}` : `공동현관: ${entranceCode.trim()}`;
            }
            
            if (address.addressId) {
                // 수정
                await updateAddress(customerId, Number(address.addressId), {
                    label: address.label,
                    recipientName: address.recipientName,
                    recipientPhone: address.recipientPhone,
                    zipCode: address.zipCode,
                    address1: address.address1,
                    address2: finalAddress2,
                    isDefault: address.isDefault,
                });
            } else {
                // 추가
                const newAddress = await addAddress(customerId, {
                    label: address.label,
                    recipientName: address.recipientName,
                    recipientPhone: address.recipientPhone,
                    zipCode: address.zipCode,
                    address1: address.address1,
                    address2: finalAddress2,
                    isDefault: true, // 새로 입력된 주소는 기본 주소로 설정
                });
                // 새로 생성된 주소의 ID를 설정
                if (newAddress?.data?.addressId) {
                    setAddress((prev) => ({ ...prev, addressId: String(newAddress.data.addressId) }));
                }
            }
            await loadAddresses();
            if (showAlert) {
                alert("주소가 저장되었습니다.");
            }
        } catch (error) {
            console.error("Failed to save address:", error);
            if (showAlert) {
                alert("주소 저장 중 오류가 발생했습니다.");
            }
        }
    }, [customerId, address, entranceCode]);

    // 주소가 변경될 때마다 자동 저장 (debounce)
    useEffect(() => {
        // 초기 로드 시에는 저장하지 않음
        if (isInitialLoadRef.current) {
            return;
        }
        
        // customerId가 없거나 필수 정보가 없으면 저장하지 않음
        if (!customerId || !address.address1 || !address.address2 || !address.recipientName || !address.recipientPhone) {
            return;
        }

        // 이전 타이머 취소
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // 1초 후 자동 저장
        saveTimeoutRef.current = setTimeout(() => {
            saveAddress(false);
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [address.address1, address.address2, address.recipientName, address.recipientPhone, entranceCode, customerId, saveAddress]);

    // buyerName과 buyerPhone이 변경되면 address에도 반영
    useEffect(() => {
        if (buyerName) {
            setAddress((prev) => ({ ...prev, recipientName: buyerName }));
        }
    }, [buyerName]);

    useEffect(() => {
        if (buyerPhone) {
            setAddress((prev) => ({ ...prev, recipientPhone: buyerPhone }));
        }
    }, [buyerPhone]);

    return {
        address,
        setAddress,
        addresses,
        entranceCode,
        setEntranceCode,
        openAddressModal,
        saveAddress,
        loadAddresses,
    };
};
