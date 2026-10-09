import { useEffect, useState } from "react";
import Store from "./pages/Store";
import Admin from "./pages/Admin";
import Policy from "./pages/Policy";

const POLICY_PAGES = new Set(["/shipping", "/refunds", "/track"]);

function useHashRoute(): string {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.replace(/^#/, "");
    return hash.startsWith("/") ? hash : "/";
  });

  useEffect(() => {
    const onChange = () => {
      const hash = window.location.hash.replace(/^#/, "");
      setRoute(hash.startsWith("/") ? hash : "/");
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

export default function App() {
  const route = useHashRoute();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [route]);

  if (route.startsWith("/admin")) return <Admin />;
  if (POLICY_PAGES.has(route)) return <Policy page={route.slice(1)} />;
  return <Store />;
}
