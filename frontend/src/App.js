import "@/App.css";
import "@/index.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UIProvider, useUI } from "@/contexts/UIContext";
import { CartProvider } from "@/contexts/CartContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AuthModal from "@/components/AuthModal";
import CosmosLoader from "@/components/CosmosLoader";
import Onboarding from "@/components/Onboarding";
import FeedbackPrompt from "@/components/FeedbackPrompt";
import BobSectionPopupProvider from "@/components/BobSectionPopupProvider";
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
import OwnerControlHub from "@/pages/OwnerControlHub";
import MyDesigns from "@/pages/MyDesigns";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Pro from "@/pages/Pro";
import Cart from "@/pages/Cart";
import Terms from "@/pages/Terms";
import SuspendedPage from "@/pages/SuspendedPage";
import Inspiration from "@/pages/Inspiration";
import Wishlists from "@/pages/Wishlists";
import Compare from "@/pages/Compare";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import Boards from "@/pages/Boards";
import PrintFailure from "@/pages/PrintFailure";
import Docs from "@/pages/Docs";
import FilamentCalculator from "@/pages/FilamentCalculator";
import Privacy from "@/pages/Privacy";
import PolicyEditor from "@/pages/PolicyEditor";

function HomeOrIntro() {
  const [checking, setChecking] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("pf_intro_seen") === "1";
      setShowIntro(!seen);
    } catch {
      setShowIntro(true);
    }
    setChecking(false);
  }, []);

  if (checking) return null;
  if (showIntro) return <Navigate to="/intro" replace />;
  return <Home />;
}

function AppShell() {
  const location = useLocation();
  const { openAuth, suspended, loading } = useAuth();
  const { sidebarCollapsed } = useUI();
  const isIntro = location.pathname === "/intro";

  useEffect(() => {
    const h = (e) => openAuth(e.detail || "signin");
    window.addEventListener("auth:open", h);
    return () => window.removeEventListener("auth:open", h);
  }, [openAuth]);

  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center gap-4">
          <CosmosLoader isActive={true} size={80} color="#00e5ff" />
          <p className="font-tech text-sm text-muted-foreground animate-pulse">
            LOADING
          </p>
        </div>
      </div>
    );
  }

  if (suspended) {
    return <SuspendedPage />;
  }

  if (isIntro) {
    return (
      <div className="min-h-screen">
        <Routes>
          <Route path="/intro" element={<Intro />} />
        </Routes>
        <AuthModal />
      </div>
    );
  }

  return (
       <div className="min-h-screen">
         <Sidebar />
         <TopBar />
         <div className={`transition-all ${sidebarCollapsed ? "pl-0" : "pl-16 md:pl-20"}`}>
           <Routes>
             <Route path="/" element={<HomeOrIntro />} />
             <Route path="/intro" element={<Intro />} />
             <Route path="/docs" element={<Docs />} />
             <Route path="/browse" element={<Browse />} />
             <Route path="/listing/:id" element={<ListingDetail />} />
             <Route path="/designer" element={<DesignWorkshop />} />
             <Route path="/designer/new" element={<Editor />} />
             <Route path="/designer/:id" element={<Editor />} />
             <Route path="/designs" element={<Designs />} />
             <Route path="/forums" element={<Forums />} />
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
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/owner/policy/terms" element={<PolicyEditor policyType="terms" />} />
              <Route path="/owner/policy/privacy" element={<PolicyEditor policyType="privacy" />} />
             <Route path="/dashboard" element={<Dashboard />} />
             <Route path="/seller/orders" element={<SellerOrders />} />
             <Route path="/seller/orders/:transactionId" element={<SellerOrderDetail />} />
             <Route path="/purchases" element={<Purchases />} />
             <Route path="/create" element={<CreateListing />} />
             <Route path="/new-listing" element={<NewListing />} />
             <Route path="/checkout/success" element={<CheckoutSuccess />} />
             <Route path="/inspiration" element={<Inspiration />} />
             <Route path="/wishlists" element={<Wishlists />} />
             <Route path="/compare" element={<Compare />} />
             <Route path="/collections" element={<Collections />} />
             <Route path="/collections/:id" element={<CollectionDetail />} />
             <Route path="/boards" element={<Boards />} />
              <Route path="/print-failures" element={<PrintFailure />} />
              <Route path="/filament-calculator" element={<FilamentCalculator />} />
             <Route path="*" element={<HomeOrIntro />} />
           </Routes>
         </div>
         <Footer />
  <AuthModal />
         <Onboarding />
         <FeedbackPrompt />
         <BobSectionPopupProvider />
      </div>
    );
 }

function ThemeBoot() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
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
