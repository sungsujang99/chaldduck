// src/utils/validation.ts

/**
 * 전화번호 형식 검증
 * 010-xxxx-xxxx 또는 010xxxxxxxx 형식
 */
export const validatePhoneNumber = (phone: string): boolean => {
    // 하이픈 제거
    const cleaned = phone.replace(/[^0-9]/g, "");
    
    // 010으로 시작하는 11자리 숫자
    const phoneRegex = /^010\d{8}$/;
    
    return phoneRegex.test(cleaned);
};

/**
 * 현금영수증 개인 번호 형식 검증 (휴대폰 번호)
 * 010-xxxx-xxxx 또는 010xxxxxxxx 형식
 */
export const validatePersonalReceiptNumber = (value: string): boolean => {
    // 하이픈 제거
    const cleaned = value.replace(/[^0-9]/g, "");
    
    // 010으로 시작하는 11자리 숫자
    const phoneRegex = /^010\d{8}$/;
    
    return phoneRegex.test(cleaned);
};

/**
 * 전화번호 형식 오류 메시지
 */
export const getPhoneValidationMessage = (): string => {
    return "⚠️ 전화번호 형식이 올바르지 않습니다.\n올바른 형식: 010-xxxx-xxxx 또는 010xxxxxxxx";
};

/**
 * 현금영수증 개인 번호 형식 오류 메시지
 */
export const getPersonalReceiptValidationMessage = (): string => {
    return "⚠️ 휴대폰 번호 형식이 올바르지 않습니다.\n올바른 형식: 010-xxxx-xxxx 또는 010xxxxxxxx";
};
