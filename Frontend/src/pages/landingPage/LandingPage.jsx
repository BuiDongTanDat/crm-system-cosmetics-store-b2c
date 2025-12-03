// LandingPage.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";
import IntroPage from "./IntroPage";
import AllProductPage from "./AllProductPage";
import ContactModal from "./components/ContactModal";

// Footer component
const Footer = () => (
  <footer className="mt-20 border-t bg-white/70 backdrop-blur">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2">
          <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-8 w-8" />
          <span className="text-lg font-bold text-blue-600">CChain Beauty</span>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Mỹ phẩm chính hãng – nâng niu làn da bạn mỗi ngày. Chất lượng tạo nên niềm tin.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900">Liên hệ</h4>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>Hotline: <span className="font-medium text-gray-900">0900 000 000</span></li>
          <li>Email: <a href="mailto:hello@cchain.vn" className="hover:underline">hello@cchain.vn</a></li>
          <li>Địa chỉ: 123 Đường Đẹp, Quận 1, TP.HCM</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900">Đăng ký nhận ưu đãi</h4>
        <p className="mt-2 text-sm text-gray-600">Nhận tin khuyến mãi & bí kíp chăm da mỗi tuần.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); alert("Đã đăng ký nhận tin!"); }}
        >
          <input
            type="email"
            required
            placeholder="Email của bạn"
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit">Đăng ký</Button>
        </form>
      </div>
    </div>
    <div className="border-t py-4 text-center text-xs text-gray-500">
      © {new Date().getFullYear()} CChain Beauty • All rights reserved.
    </div>
  </footer>
);

const LandingPage = () => {
  const [route, setRoute] = useState("intro"); // intro | products
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactPrefill, setContactPrefill] = useState({}); // notes, productInterest

  const openContact = (prefill = {}) => {
    setContactPrefill(prefill);
    setContactModalOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRoute("intro")}>
            <img src="/images/logo/Logo.svg" alt="CChain" className="h-8 w-8" />
            <span className="text-xl font-extrabold text-blue-600">CChain Beauty</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-700">
            <button onClick={() => setRoute("intro")} className="hover:text-blue-600 transition">GIỚI THIỆU</button>
            <button onClick={() => setRoute("products")} className="hover:text-blue-600 transition">SẢN PHẨM</button>
            <button onClick={() => openContact()} className="hover:text-blue-600 transition">LIÊN HỆ</button>
          </nav>

          <Button onClick={() => openContact()} variant="actionUpdate" className="hidden sm:flex items-center gap-2">
            <PhoneCall size={16} /> Liên hệ ngay
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="pt-20">
        {route === "intro" && <IntroPage onContact={() => openContact()} onViewProducts={() => setRoute("products")} />}
        {route === "products" && <AllProductPage onContact={(prefill) => openContact(prefill)} />}
      </main>

      <Footer />

      {/* Contact Modal */}
      <ContactModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        defaultNotes={contactPrefill.defaultNotes}
        defaultProductInterest={contactPrefill.defaultProductInterest}
      />
    </div>
  );
};

export default LandingPage;
