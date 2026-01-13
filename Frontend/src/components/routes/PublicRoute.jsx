import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import Loading from "../common/Loading";

export default function PublicRoute() {
  const { accessToken, loading, refresh } = useAuthStore();
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!accessToken) {
        try {
          await refresh();
        } catch (error) {
          // Refresh lỗi cũng không sao, cho người dùng ở lại trang login
        }
      }
      setStarting(false);
    };
    init();
  }, []);

  // Chỉ hiển thị loading khi đang khởi tạo hoặc làm mới token
  if (starting) {
    return <div><Loading/></div>;
  }

  // Nếu đã đăng nhập, chuyển hướng về trang chủ
  if (accessToken) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}