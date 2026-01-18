import { Discount } from "../types/types";

type Props = {
    discount: Discount;
    originalPrice: number;
};
const caculateDiscount = ({ discount, originalPrice }: Props): number => {
    let finalPrice = originalPrice;
    if (discount.type === "RATE") {
        finalPrice = originalPrice * (1 - discount.value / 100);
    } else if (discount.type === "FIXED") {
        finalPrice = originalPrice - discount.value;
    }
    return originalPrice - finalPrice;
};

export default caculateDiscount;
