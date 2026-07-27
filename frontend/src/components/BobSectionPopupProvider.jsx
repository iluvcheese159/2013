import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import BobSectionPopup from "./BobSectionPopup";

const SECTION_MAP = {
  "/browse": "browse",
  "/designer": "designer",
  "/designer/new": "editor",
  "/designer/": "editor",
  "/forums": "forums",
  "/messages": "messages",
  "/profile": "profile",
  "/pro": "pro",
  "/dashboard": "dashboard",
  "/owner/analytics": "owner/control",
  "/owner/control": "owner/control",
  "/docs": "docs",
  "/filament-calculator": "filament-calculator",
};

function getSectionFromPath(pathname) {
  for (const [route, section] of Object.entries(SECTION_MAP)) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return section;
    }
  }
  return null;
}

export default function BobSectionPopupProvider() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [currentSection, setCurrentSection] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const introSeen = typeof window !== "undefined" && localStorage.getItem("pf_intro_seen") === "1";
  const hasCheckedRef = useRef(false);

  const checkSection = useCallback(
    async (section) => {
      if (!section || popupVisible) return;
      if (!introSeen) return;

      const dismissed = JSON.parse(
        localStorage.getItem("pf_bob_section_dismissed") || "[]"
      );
      if (dismissed.includes(section)) return;

      try {
        const res = await api.get(`/bob/section/${section}/status`);
        if (res.data.visited) return;
      } catch {
        /* still show popup even if API fails */
      }

      try {
        const res = await api.get(`/bob/section/${section}`);
        setPopupData(res.data);
        setCurrentSection(section);
        setPopupVisible(true);
      } catch {
        /* ignore */
      }
    },
    [popupVisible, introSeen]
  );

  useEffect(() => {
    if (loading) return;
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const section = getSectionFromPath(location.pathname);
    if (section) {
      checkSection(section);
    }
  }, [location.pathname, loading, checkSection]);

  const handleDismiss = useCallback(() => {
    setPopupVisible(false);
    setPopupData(null);
    setCurrentSection(null);
    hasCheckedRef.current = false;
  }, []);

  if (!popupVisible || !popupData) return null;

  return (
    <BobSectionPopup
      sectionName={currentSection || ""}
      title={popupData.title}
      text={popupData.text}
      onDismiss={handleDismiss}
    />
  );
}