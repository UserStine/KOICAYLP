import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import AccessibilityTools from "./components/AccessibilityTools";
import Home from "./pages/Home";
import Program from "./pages/Program";
import Tracks from "./pages/Tracks";
import Eligibility from "./pages/Eligibility";
import Apply from "./pages/Apply";
import Faq from "./pages/Faq";
import Login from "./pages/Login";
import Portal from "./lms/Portal";
import AdminLayout from "./admin/AdminLayout";
import Protected from "./auth/Protected";
import { AuthProvider } from "./auth/AuthContext";
import { LanguageProvider } from "./i18n";
import { css } from "./styles";

/* Scrolls to top on route change, or to the #hash element if there is one */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/* The public marketing site: shared header, footer and chat.
   The portal and login screens use their own chrome instead. */
function PublicSite({ openChat }) {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home openChat={openChat} />} />
        <Route path="/program" element={<Program openChat={openChat} />} />
        <Route path="/tracks" element={<Tracks />} />
        <Route path="/eligibility" element={<Eligibility openChat={openChat} />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/faq" element={<Faq openChat={openChat} />} />
        <Route path="*" element={<Home openChat={openChat} />} />
      </Routes>
      <Footer />
    </>
  );
}

function Shell() {
  const [chatOpen, setChatOpen] = useState(false);
  const openChat = () => setChatOpen(true);
  const { pathname } = useLocation();
  const isPortal = pathname.startsWith("/portal") || pathname.startsWith("/login") || pathname.startsWith("/admin");

  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/portal/*" element={<Protected><Portal /></Protected>} />
        <Route path="/admin/*" element={<Protected><AdminLayout /></Protected>} />
        <Route path="*" element={<PublicSite openChat={openChat} />} />
      </Routes>
      {!isPortal && <ChatWidget open={chatOpen} setOpen={setChatOpen} />}
      <AccessibilityTools />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <style>{css}</style>
          <Shell />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
