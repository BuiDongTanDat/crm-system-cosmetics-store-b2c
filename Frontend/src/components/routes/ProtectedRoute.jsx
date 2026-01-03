import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import Loading from "../common/Loading";

export default function ProtectedRoute() {
  const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);

  // Kiểm tra nếu đang là callback từ OAuth (có query param youtube_auth)
  const searchParams = new URLSearchParams(location.search);
  const isOAuthCallback = searchParams.has("youtube_auth");

  const init = async () => {
    if (!accessToken) {
      await refresh();
    }

    if (accessToken && !user) {
      await fetchMe();
    }

    setStarting(false);
  };

  useEffect(() => {
    init();
  }, [accessToken, user]);

  if (starting || loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }
  //Nếu là OAuth callback thì cho qua luôn
  if (isOAuthCallback) {
    return <Outlet></Outlet>;
  }

  if (!accessToken) {
    return <Navigate to="/auth/login" />;
  }

  return <Outlet></Outlet>;
}
