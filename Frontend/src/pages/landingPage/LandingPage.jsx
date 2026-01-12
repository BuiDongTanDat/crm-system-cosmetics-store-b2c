// LandingPage.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import ContactModal from "./components/ContactModal";
import InterestSubmitModal from "./components/InterestSubmitModal";
import { Input } from "@/components/ui/input";
import LandingRoute from "@/pages/landingPage/routes/LandingRoute";

// Đây là trang Layout chính của trang landing page
// Footer component
const Footer = () => (
  <footer className=" border-t bg-white/70 backdrop-blur">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2">
          <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-8 w-8" />
          <span className="text-lg font-bold text-blue-600">CChain Beauty</span>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Mỹ phẩm chính hãng – nâng niu làn da bạn mỗi ngày. Chất lượng tạo nên
          niềm tin.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900">Liên hệ</h4>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>
            Hotline:{" "}
            <span className="font-medium text-gray-900">0900 000 000</span>
          </li>
          <li>
            Email:{" "}
            <a href="mailto:hello@cchain.vn" className="hover:underline">
              hello@cchain.vn
            </a>
          </li>
          <li>Địa chỉ: 123 Đường Đẹp, Quận 1, TP.HCM</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900">Đăng ký nhận ưu đãi</h4>
        <p className="mt-2 text-sm text-gray-600">
          Nhận tin khuyến mãi & bí kíp chăm da mỗi tuần.
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Đã đăng ký nhận tin!");
          }}
        >
          <Input
            variant="normal"
            type="email"
            required
            placeholder="Email của bạn"
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" variant="actionCreate">
            Đăng ký
          </Button>
        </form>
      </div>
    </div>
    <div className="border-t py-4 text-center text-xs text-gray-500">
      © {new Date().getFullYear()} CChain Beauty • All rights reserved.
    </div>
  </footer>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [interestSubmitModalOpen, setInterestSubmitModalOpen] = useState(false);
  const [contactPrefill, setContactPrefill] = useState({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const openContact = (prefill = {}) => {
    setContactPrefill(prefill);
    setContactModalOpen(true);
  };

  const handleViewProducts = () => {
    navigate("/landing/products");
  };

  const openInterestSubmit = () => {
    setInterestSubmitModalOpen(true);
  };

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hàm cập nhật số lượng giỏ hàng từ localStorage
  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    } catch {
      setCartCount(0);
    }
  };

  // Lắng nghe sự kiện storage, custom event và cập nhật khi route/cart thay đổi
  useEffect(() => {
    updateCartCount();
    
    const onStorage = (e) => {
      if (e.key === "cart") updateCartCount();
    };
    
    // Lắng nghe custom event khi thêm vào giỏ hàng
    const onCartUpdate = () => {
      updateCartCount();
    };
    
    window.addEventListener("storage", onStorage);
    window.addEventListener("cartUpdated", onCartUpdate);
    
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cartUpdated", onCartUpdate);
    };
  }, []);

  useEffect(() => {
    updateCartCount();
  }, [location.pathname]);

  // Helper function to check active route
  const isActiveRoute = (path) => {
    if (path === "/" || path === "/landing") {
      return (
        location.pathname === "/landing" || location.pathname === "/landing/"
      );
    }
    return location.pathname.startsWith(`/landing${path}`);
  };

  return (
    <div className=" relative min-h-screen">
      {/* Header */}
      <header
        className={` fixed top-0 left-0 right-0 z-40 transition-all duration-300
  ${isScrolled ? "bg-white/90 backdrop-blur shadow-md" : "bg-transparent"}`}
      >
        <div className="p-3 flex items-center justify-between  mx-auto">
          <div
            className=" flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/landing")}
          >
            <img src="/images/logo/Logo.svg" alt="CChain" className="h-8 w-8" />
            <span className="text-xl font-bold  bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              CChain Beauty
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-700">
            <button
              onClick={() => navigate("/landing")}
              className={`hover:text-blue-600 transition hover:scale-105 active:scale-95  cursor-pointer ${
                isActiveRoute("/")
                  ? "text-blue-600 underline underline-offset-10"
                  : ""
              }`}
            >
              GIỚI THIỆU
            </button>
            <button
              onClick={() => navigate("/landing/products")}
              className={`hover:text-blue-600 transition hover:scale-105 active:scale-95  cursor-pointer ${
                isActiveRoute("/products")
                  ? "text-blue-600 underline underline-offset-10"
                  : ""
              }`}
            >
              SẢN PHẨM
            </button>
            <button
              onClick={() => navigate("/landing/events")}
              className={`hover:text-blue-600 transition hover:scale-105 active:scale-95 cursor-pointer ${
                isActiveRoute("/events")
                  ? "text-blue-600 underline underline-offset-10"
                  : ""
              }`}
            >
              SỰ KIỆN
            </button>
            <button
              onClick={() => navigate("/landing/order-lookup")}
              className={`hover:text-blue-600 transition hover:scale-105 active:scale-95 cursor-pointer ${
                isActiveRoute("/order-lookup")
                  ? "text-blue-600 underline underline-offset-10"
                  : ""
              }`}
            >
              TRA CỨU ĐƠN HÀNG
            </button>
            <button
              onClick={() => openContact()}
              className={`hover:text-blue-600 transition hover:scale-105 active:scale-95 cursor-pointer `}
            >
              LIÊN HỆ
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Button
              variant="actionUpdate"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>

          {/* Desktop Cart Button */}
          <Button
            id={"myCart"}
            onClick={() => navigate("/landing/cart")}
            variant="actionUpdate"
            className="hidden md:flex items-center gap-2 rounded-full h-full "
          >
            <ShoppingCart size={16} /> Giỏ hàng
            {cartCount >= 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-500 bg-white rounded-full">
                {cartCount}
              </span>
            )}
          </Button>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-md z-50 flex flex-col ">
            <Button
              variant="menuLanding"
              onClick={() => {
                navigate("/landing");
                setMobileMenuOpen(false);
              }}
              data-active={isActiveRoute("/")}
              className="rounded-none hover:text-xl"
            >
              GIỚI THIỆU
            </Button>
            <Button
              variant="menuLanding"
              onClick={() => {
                navigate("/landing/products");
                setMobileMenuOpen(false);
              }}
              data-active={isActiveRoute("/products")}
              className="rounded-none hover:text-xl"
            >
              SẢN PHẨM
            </Button>
            <Button
              variant="menuLanding"
              onClick={() => {
                navigate("/landing/events");
                setMobileMenuOpen(false);
              }}
              data-active={isActiveRoute("/events")}
              className="rounded-none hover:text-xl"
            >
              SỰ KIỆN
            </Button>
            <Button
              variant="menuLanding"
              onClick={() => {
                navigate("/landing/order-lookup");
                setMobileMenuOpen(false);
              }}
              data-active={isActiveRoute("/order-lookup")}
              className="rounded-none hover:text-xl"
            >
              TRA CỨU ĐƠN HÀNG
            </Button>
            <Button
              variant="menuLanding"
              onClick={() => {
                openContact();
                setMobileMenuOpen(false);
              }}
              className="rounded-none hover:text-xl"
            >
              LIÊN HỆ
            </Button>
            <Button
              variant="menuLanding"
              onClick={() => {
                navigate("/landing/cart");
                setMobileMenuOpen(false);
              }}
              data-active={isActiveRoute("/cart")}
              className="rounded-none hover:text-xl"
            >
              GIỎ HÀNG
            </Button>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="pt-20">
        <LandingRoute 
          onContact={openContact}
          onViewProducts={handleViewProducts}
          onSubmitInterest={openInterestSubmit}
        />
      </main>

      <Footer />

      {/* Contact Modal - Tạo lead trực tiếp */}
      <ContactModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        defaultNotes={contactPrefill.defaultNotes}
        defaultProductInterest={contactPrefill.defaultProductInterest}
      />

      {/* Interest Submit Modal - Tạo lead từ danh sách quan tâm */}
      <InterestSubmitModal
        open={interestSubmitModalOpen}
        onClose={() => setInterestSubmitModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
