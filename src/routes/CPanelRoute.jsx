import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API_URL from "../conf/api";

export default function CPanelLayout({ children }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_URL}/cpanel-me`, {
        credentials: "include",
      });

      if (!res.ok) {
        navigate(`/cpanel-login?next=${encodeURIComponent(location.pathname)}`, { replace: true });
        return;
      }

      const me = await res.json().catch(() => ({}));
      if (me?.role !== "superadmin") {
        navigate("/403", { replace: true });
        return;
      }

      setChecking(false);
    })();
  }, []);

  if (checking) return <div className="p-6 text-gray-600">Tekshirilmoqda...</div>;
  return children;
}