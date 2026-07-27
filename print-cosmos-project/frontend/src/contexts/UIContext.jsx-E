/* eslint-disable */
import { createContext, useContext, useState, useEffect } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("pf_sidebar_collapsed") === "1";
  });

  useEffect(() => {
    localStorage.setItem("pf_sidebar_collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);

  return (
    <UIContext.Provider value={{ sidebarCollapsed, toggleSidebar, setSidebarCollapsed }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
