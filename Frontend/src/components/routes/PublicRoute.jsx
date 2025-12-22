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
        await refresh();
      }
      setStarting(false);
    };
    init();
  }, []);

  if (starting || loading) {
    return <div><Loading/></div>;
  }

  if (accessToken) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}