import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UIProvider, useUI } from "@/contexts/UIContext";
import { CartProvider } from "@/contexts/CartContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AuthModal from "@/components/AuthModal";
import Onboarding from "@/components/Onboarding";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import AuthCallback from "@/components/AuthCallback";
import Home from "@/pages/Home";
import Intro from "@/pages/Intro";
import Browse from "@/pages/Browse";
import ListingDetail from "@/pages/ListingDetail";
import Editor from "@/pages/Editor";
import DesignWorkshop from "@/pages/DesignWorkshop";
import Dashboard from "@/pages/Dashboard";
import SellerOrders from "@/pages/SellerOrders";
import SellerOrderDetail from "@/pages/SellerOrderDetail";
import Purchases from "@/pages/Purchases";
import CreateListing from "@/pages/CreateListing";
import NewListing from "@/pages/NewListing";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Designs from "@/pages/Designs";
import Forums from "@/pages/Forums";
import OwnerAnalytics from "@/pages/OwnerAnalytics";
import OwnerControlHub from "@/pages/OwnerControlHub";
import MyDesigns from "@/pages/MyDesigns";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Pro from "@/pages/Pro";
import Cart from "@/pages/Cart";
import Terms from "@/pages/Terms";

function HomeOrIntro() {
  const seen = typeof window !== "undefined" && localStorage.getItem("pf_intro_seen") === "1";
  if (!seen) return <Navigate to="/intro" replace />;
  return <Home />;
}

function AppShell() {
  const location = useLocation();
  const { openAuth } = useAuth();
  const { sidebarCollapsed } = useUI();

  useEffect(() => {
    const h = (e) => openAuth(e.detail || "signin");
    window.addEventListener("auth:open", h);
    return () => window.removeEventListener("auth:open", h);
  }, [openAuth]);

  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <div className={`transition-all ${sidebarCollapsed ? "pl-0" : "pl-16 md:pl-20"}`}>
        <Routes>
          <Route path="/" element={<HomeOrIntro />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/home" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/designer" element={<DesignWorkshop />} />
          <Route path="/designer/new" element={<Editor />} />
          <Route path="/designer/:id" element={<Editor />} />
          <Route path="/designs" element={<Designs />} />
          <Route path="/forums" element={<Forums />} />
          <Route path="/owner/analytics" element={<OwnerAnalytics />} />
          <Route path="/owner/control" element={<OwnerControlHub />} />
          <Route path="/my-designs" element={<MyDesigns />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:otherId" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/pro" element={<Pro />} />
          <Route path="/pro/success" element={<Pro />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/orders/:transactionId" element={<SellerOrderDetail />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/create" element={<CreateListing />} />
          <Route path="/new-listing" element={<NewListing />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="*" element={<HomeOrIntro />} />
        </Routes>
      </div>
      <AuthModal />
      <Onboarding />
      <FeedbackPrompt />
    </div>
  );
}

function ThemeBoot() {
  useEffect(() => {
    const t = localStorage.getItem("theme");
    if (t === "light") document.documentElement.classList.remove("dark");
    else document.documentElement.classList.add("dark");
  }, []);
  return null;
}

function App() {
  return (
    <div className="App">
      <ThemeBoot />
      <BrowserRouter>
        <UIProvider>
          <AuthProvider>
            <CartProvider>
              <AppShell />
              <Toaster position="bottom-right" />
            </CartProvider>
          </AuthProvider>
        </UIProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
