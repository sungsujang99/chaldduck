import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const status = searchParams.get("status");

    useEffect(() => {
        if (!status) {
            alert("결제에 실패했습니다. 문제가 계속되면 다른 결제 수단을 이용해 주세요.");
            navigate("/");
            return;
        }

        if (status === "PAID") {
            alert("결제가 완료되었습니다.");
            navigate("/");
        } else {
            alert("결제에 실패했습니다. 문제가 계속되면 다른 결제 수단을 이용해 주세요.");
            navigate("/");
        }
    }, [status, navigate]);

    return <div>결제 처리중..</div>;
};
