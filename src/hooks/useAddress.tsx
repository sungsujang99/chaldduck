import { useState, useEffect } from "react";
import { Address } from "../types/types";
import { getCustomerProfile, addAddress, updateAddress } from "../api/customer";
import type { AddressResponse } from "../types/api";

export const useAddress = (customerId: number | null) => {
    const [address, setAddress] = useState<Address>({
        addressId: "",
        label: "집",
        recipientName: "",
        recipientPhone: "",
        zipCode: "",
        address1: "",
        address2: "",
        isDefault: false,
    });
    const [addresses, setAddresses] = useState<AddressResponse[]>([]);
    const [entranceCode, setEntranceCode] = useState("");

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
            }
        } catch (error) {
            console.error("Failed to load addresses:", error);
        }
    };

    const openAddressModal = () => {
        if ((window as any).daum && (window as any).daum.Postcode) {
            new (window as any).daum.Postcode({
                oncomplete: function (data: any) {
                    setAddress((prev) => ({
                        ...prev,
                        address1: data.roadAddress || data.jibunAddress,
                        zipCode: data.zonecode,
                    }));
                },
            }).open();
        } else {
            alert("주소 API를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        }
    };

    const saveAddress = async () => {
        if (!customerId) {
            alert("고객 정보를 먼저 입력해주세요.");
            return;
        }
        if (!address.address1 || !address.address2 || !address.recipientName || !address.recipientPhone) {
            alert("주소 정보를 모두 입력해주세요.");
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
                await addAddress(customerId, {
                    label: address.label,
                    recipientName: address.recipientName,
                    recipientPhone: address.recipientPhone,
                    zipCode: address.zipCode,
                    address1: address.address1,
                    address2: finalAddress2,
                    isDefault: address.isDefault,
                });
            }
            await loadAddresses();
            alert("주소가 저장되었습니다.");
        } catch (error) {
            console.error("Failed to save address:", error);
            alert("주소 저장 중 오류가 발생했습니다.");
        }
    };

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
