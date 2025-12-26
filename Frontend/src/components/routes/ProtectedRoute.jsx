import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import Loading from "../common/Loading";

export default function ProtectedRoute() {
  const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);

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

  if (!accessToken) {
    return <Navigate to="/auth/login" />;
  }

  return <Outlet></Outlet>;
}
