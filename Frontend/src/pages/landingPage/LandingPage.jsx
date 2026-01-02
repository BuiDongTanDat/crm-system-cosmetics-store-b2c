// LandingPage.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, PhoneCall, ShoppingCart } from "lucide-react";
import IntroPage from "./pages/IntroPage";
import AllProductPage from "./pages/AllProductPage";
import ContactModal from "./components/ContactModal";
import CartPage from "./pages/CartPage";
import { Input } from "@/components/ui/input";

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
          <Button type="submit" variant ="actionCreate" >Đăng ký</Button>
        </form>
      </div>
    </div>
    <div className="border-t py-4 text-center text-xs text-gray-500">
      © {new Date().getFullYear()} CChain Beauty • All rights reserved.
    </div>
  </footer>
);

const LandingPage = () => {
  const [route, setRoute] = useState("intro");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactPrefill, setContactPrefill] = useState({}); // notes, productInterest
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const openContact = (prefill = {}) => {
    setContactPrefill(prefill);
    setContactModalOpen(true);
  };

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50); // Thay đổi background sau khi scroll 50px
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

  // Lắng nghe sự kiện storage và cập nhật khi route/cart thay đổi
  useEffect(() => {
    updateCartCount();
    const onStorage = (e) => {
      if (e.key === "cart") updateCartCount();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    updateCartCount();
  }, [route]);


  return (
    <div className=" relative min-h-screen">
      {/* Header */}
      <header
        className={` px-3 fixed top-0 left-0 right-0 z-40 transition-all duration-300
  ${isScrolled ? "bg-white/90 backdrop-blur shadow-md" : "bg-transparent"}`}
      >
        <div className="flex items-center justify-between px-3 py-3  mx-auto">
          {/* px-6 -> px-3 để giảm padding */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setRoute("intro")}
          >
            <img src="/images/logo/Logo.svg" alt="CChain" className="h-8 w-8" />
            <span className="text-xl font-bold  bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              CChain Beauty
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-700">
            <button
              onClick={() => setRoute("intro")}
              className={`hover:text-blue-600 transition hover:scale-105 active:scale-95  cursor-pointer ${
                route === "intro"
                  ? "text-blue-600 underline underline-offset-10"
                  : ""
              }`}
            >
              GIỚI THIỆU
            </button>
            <button
              onClick={() => setRoute("products")}
              className={`hover:text-blue-600 transition hover:scale-105 active:scale-95  cursor-pointer ${
                route === "products"
                  ? "text-blue-600 underline underline-offset-10"
                  : ""
              }`}
            >
              SẢN PHẨM
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
            id = {"myCart"}
            onClick={() => setRoute("cart")}
            variant="actionUpdate"
            className="hidden md:flex items-center gap-2"
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
                setRoute("intro");
                setMobileMenuOpen(false);
              }}
              data-active={route === "intro"}
            >
              GIỚI THIỆU
            </Button>
            <Button
              variant="menuLanding"
              onClick={() => {
                setRoute("products");
                setMobileMenuOpen(false);
              }}
              data-active={route === "products"}
            >
              SẢN PHẨM
            </Button>
            <Button
              variant="menuLanding"
              onClick={() => {
                openContact();
                setMobileMenuOpen(false);
              }}
            >
              LIÊN HỆ
            </Button>
            <Button
              variant="menuLanding"
              onClick={() => {
                setRoute("cart");
                setMobileMenuOpen(false);
              }}
              data-active={route === "cart"}
            >
              GIỎ HÀNG
            </Button>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="pt-20">
        {route === "intro" && (
          <IntroPage
            onContact={() => openContact()}
            onViewProducts={() => setRoute("products")}
          />
        )}
        {route === "products" && (
          <AllProductPage
            onContact={(prefill) => openContact(prefill)}
            onCartChange={updateCartCount}
          />
        )}
        {route === "like" && <LikePage />}
        {route === "cart" && (
          <CartPage onCartChange={updateCartCount} />
        )}
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
