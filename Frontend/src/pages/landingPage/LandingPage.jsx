import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Star,
    ChevronLeft,
    ChevronRight,
    PhoneCall,
    X,
    RefreshCw,
    Sparkles,
    Instagram,
    Facebook,
    Mail,
} from "lucide-react";
import { getProducts } from "@/services/products";
import { createLead } from "@/services/leads";


const currencyVN = (value) =>
    (value ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const Rating = ({ value = 0 }) => {
    const full = Math.floor(value);
    const half = value - full >= 0.5;
    const stars = Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (i === full && half);
        return (
            <Star
                key={i}
                size={16}
                className={`shrink-0 ${filled ? "fill-yellow-400" : "fill-transparent"} stroke-yellow-500`}
            />
        );
    });
    return (
        <div className="flex items-center gap-0.5">
            {stars}
            <span className="ml-1 text-xs text-gray-600">{Number(value).toFixed(1)}</span>
        </div>
    );
};

const SkeletonCard = () => (
    <div className="w-[248px] rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
        <div className="h-40 bg-gray-100" />
        <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-6 bg-gray-100 rounded w-1/3" />
        </div>
    </div>
);

const EmptyState = ({ onRefresh }) => (
    <div className="w-full text-center py-14">
        <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center shadow">
            <RefreshCw className="animate-spin" />
        </div>
        <p className="mt-4 text-gray-700 font-medium">Chưa có sản phẩm để hiển thị</p>
        <p className="text-sm text-gray-500">Hãy thử tải lại trang hoặc thêm sản phẩm mới.</p>
        {onRefresh && <Button onClick={onRefresh} className="mt-4">Tải lại</Button>}
    </div>
);

const ProductCard = ({ p }) => {
    const outOfStock = (p.status || "").toLowerCase().includes("hết hàng");
    const lowOpacity = outOfStock ? "opacity-60" : "";
    const discount = p.originalPrice && p.originalPrice > p.currentPrice
        ? Math.round(((p.originalPrice - p.currentPrice) / p.originalPrice) * 100)
        : 0;

    return (
        <div
            className={`group w-[248px] rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm transition hover:shadow-lg ${lowOpacity}`}
        >
            <div className="relative">
                <img
                    src={p.image || "/images/placeholder-product.jpg"}
                    onError={(e) => (e.currentTarget.src = "/images/placeholder-product.jpg")}
                    alt={p.name}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                />
                {discount > 0 && (
                    <span className="absolute top-2 right-2 rounded-full bg-rose-500 text-white text-[10px] font-semibold px-2 py-1 shadow">
                        -{discount}%
                    </span>
                )}
                {p.status && (
                    <span
                        className={`absolute top-2 left-2 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur border ${(p.status || "").includes("Còn hàng")
                            ? "bg-cyan-50/80 text-blue-700 border-cyan-200"
                            : (p.status || "").includes("Sắp về")
                                ? "bg-amber-50/80 text-amber-700 border-amber-200"
                                : "bg-rose-50/80 text-rose-700 border-rose-200"
                            }`}
                    >
                        {p.status}
                    </span>
                )}
            </div>

            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{p.name}</h3>
                    <Rating value={p.rating ?? 0} />
                </div>
                <p className="mt-1 text-[12px] text-gray-500 line-clamp-1">
                    {(p.category ? `${p.category}` : "") + (p.brand ? ` • ${p.brand}` : "")}
                </p>
                {p.shortDescription && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{p.shortDescription}</p>
                )}

                <div className="mt-3 flex items-end justify-between">
                    <div className="text-right ml-auto">
                        {p.originalPrice && p.originalPrice > p.currentPrice && (
                            <div className="text-[12px] text-gray-400 line-through">{currencyVN(p.originalPrice)}</div>
                        )}
                        <div className="text-base font-bold text-gray-900">{currencyVN(p.currentPrice)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ContactModal = ({ open, onClose, campaignName, campaignId = null }) => {
    const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onEsc = (e) => e.key === "Escape" && onClose?.();
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!form.name?.trim() || !form.email?.trim() || !form.phone?.trim()) {
            alert("Vui lòng nhập đầy đủ Họ tên, Email và SĐT.");
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                source: "InBound",                 // đổi nếu server yêu cầu đúng case
                tags: campaignName ? [campaignName] : [],
                campaign_id: campaignId ?? null,   // null tốt hơn ""
                // notes: form.notes?.trim() || ""
            };

            console.log("Sending lead payload:", payload);
            const res = await createLead(payload);
            console.log("Lead API response:", res);

            alert("Cảm ơn bạn! Thông tin đã được ghi nhận.");
            setForm({ name: "", email: "", phone: "", notes: "" });
            onClose?.();
        } catch (err) {
            console.error("Lead API error:", err);
            alert("Xin lỗi, gửi thông tin thất bại. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div
                ref={ref}
                role="dialog"
                aria-modal
                className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold">Thông Tin Liên Hệ</h3>
                        <p className="text-sm text-gray-600">
                            Điền thông tin để chúng tôi liên hệ với bạn.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50" aria-label="Đóng">
                        <X />
                    </button>
                </div>

                <form className="p-4 space-y-3" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Nhập họ tên"
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Email *</label>
                            <input
                                required
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="email@example.com"
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">SĐT *</label>
                            <input
                                required
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="0123456"
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Ghi chú</label>
                        <textarea
                            rows={3}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Nhập ghi chú (tùy chọn)"
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        {/* Hiển thị chiến dịch nếu có */}
                        <div className="text-xs text-gray-500">
                            {campaignName ? `Chiến dịch: ${campaignName}` : ""}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border font-medium hover:bg-gray-50"
                                disabled={isSubmitting}
                            >
                                Hủy
                            </button>
                            <Button type="submit" className="px-4 py-2" disabled={isSubmitting}>
                                {isSubmitting ? "Đang gửi..." : "Gửi Thông Tin"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const useCarousel = (items, visible = 4) => {
    const [start, setStart] = useState(0);
    const next = () => setStart((v) => (v + 1) % items.length);
    const prev = () => setStart((v) => (v - 1 + items.length) % items.length);

    const slides = useMemo(() => {
        if (!items.length) return [];
        return Array.from({ length: Math.min(visible, items.length) }, (_, i) => items[(start + i) % items.length]);
    }, [items, start, visible]);

    return { start, setStart, next, prev, slides };
};

// --- Campaign slider (discounted products) ---
const CampaignSlider = ({ products, title = "THÁNG 11 • SIÊU SALE MỸ PHẨM" }) => {
    // Filter items with a real discount
    const items = useMemo(
        () => products.filter((p) => Number(p.originalPrice) > Number(p.currentPrice)),
        [products]
    );

    // Responsive cards per view
    const [perView, setPerView] = useState(3);
    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            setPerView(w < 640 ? 1 : w < 1024 ? 2 : 3);
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Animated translateX track
    const CARD_W = 264; // 248 + gap
    const [index, setIndex] = useState(0);
    const canSlide = items.length > 0;
    useEffect(() => {
        if (!canSlide) return;
        const t = setInterval(() => setIndex((i) => (i + 1) % Math.max(items.length, 1)), 3500);
        return () => clearInterval(t);
    }, [canSlide, items.length]);

    // Looping: duplicate list to make it seamless
    const looped = useMemo(() => [...items, ...items, ...items], [items]);
    const offset = index * CARD_W;

    return (
        <section className="relative z-10 mt-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="rounded-3xl bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border border-rose-100 p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl sm:text-2xl font-bold text-rose-600 flex items-center gap-2">
                            <Sparkles className="shrink-0" /> {title}
                        </h3>
                        <div className="text-sm text-rose-500/80 hidden sm:block">Giảm giá chỉ trong tháng – sắm đẹp, da thêm yêu ✨</div>
                    </div>

                    {items.length === 0 ? (
                        <p className="mt-6 text-center text-sm text-rose-500">Chưa có sản phẩm trong chiến dịch.</p>
                    ) : (
                        <div className="relative mt-6 overflow-hidden">
                            <div
                                className="flex gap-4 will-change-transform"
                                style={{ transform: `translateX(-${offset}px)`, transition: "transform 700ms ease" }}
                            >
                                {looped.map((p, i) => (
                                    <div key={`${p.id}-${i}`} className="w-[248px] shrink-0">
                                        <ProductCard p={p} />
                                    </div>
                                ))}
                            </div>
                            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-rose-50 to-transparent" />
                            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-rose-50 to-transparent" />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

// --- Footer ---
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
                <div className="mt-4 flex items-center gap-3">
                    <a href="#" className="p-2 rounded-full border hover:bg-gray-50" aria-label="Facebook"><Facebook size={18} /></a>
                    <a href="#" className="p-2 rounded-full border hover:bg-gray-50" aria-label="Instagram"><Instagram size={18} /></a>
                    <a href="mailto:hello@cchain.vn" className="p-2 rounded-full border hover:bg-gray-50" aria-label="Email"><Mail size={18} /></a>
                </div>
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
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); alert("Đã đăng ký nhận tin!"); }}>
                    <input type="email" required placeholder="Email của bạn" className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <Button type="submit">Đăng ký</Button>
                </form>
            </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-gray-500">© {new Date().getFullYear()} CChain Beauty • All rights reserved.</div>
    </footer>
);

const LandingPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [products, setProducts] = useState([]);

    const fetchProducts = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getProducts();
            // Expecting an array of products. Normalize keys to match UI expectations.
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setProducts(list);
        } catch (e) {
            console.error(e);
            setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Decide how many cards to show based on viewport
    const [visibleCount, setVisibleCount] = useState(4);
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            setVisibleCount(w < 640 ? 1 : w < 1024 ? 3 : 4);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const { start, setStart, next, prev, slides } = useCarousel(products, visibleCount);

    // Auto-play every 5s
    useEffect(() => {
        if (!products.length) return;
        const t = setInterval(next, 5000);
        return () => clearInterval(t);
    }, [products, next]);

    // Compute campaign subtitle month
    const now = new Date();
    const month = now.toLocaleDateString("vi-VN", { month: "long" });

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-white to-blue-50">
            {/* Background */}
            <div
                className="pointer-events-none absolute inset-0 bg-[url('/images/background/bg.jpg')] bg-cover bg-center opacity-10"
                aria-hidden
            />

            {/* Contact Button */}
            <div className="fixed top-6 right-6 z-40">
                <Button onClick={() => setShowForm(true)} className="shadow-lg">
                    <PhoneCall className="mr-2" /> LIÊN HỆ VỚI CHÚNG TÔI
                </Button>
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
                {/* Top bar */}
                <div className="hidden md:flex justify-between items-center px-6 py-2 text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-pink-50">
                    <div className="flex items-center gap-3">
                        <a href="#" aria-label="Facebook" className="hover:text-blue-600 transition">
                            <Facebook size={16} />
                        </a>
                        <a href="#" aria-label="Instagram" className="hover:text-pink-500 transition">
                            <Instagram size={16} />
                        </a>
                        <a href="mailto:hello@cchain.vn" aria-label="Email" className="hover:text-gray-700 transition">
                            <Mail size={16} />
                        </a>
                    </div>
                </div>

                {/* Main navigation */}
                <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer">
                        <img src="/images/logo/Logo.svg" alt="CChain" className="h-8 w-8" />
                        <span className="text-xl font-extrabold text-blue-600">CChain Beauty</span>
                    </div>

                    {/* Navigation links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
                        <a href="#products" className="hover:text-blue-600 transition">Sản phẩm</a>
                        <a href="#about" className="hover:text-blue-600 transition">Giới thiệu</a>
                        <a href="#campaign" className="hover:text-blue-600 transition">Khuyến mãi</a>
                        <a href="#blog" className="hover:text-blue-600 transition">Blog</a>
                        <a href="#contact" className="hover:text-blue-600 transition">Liên hệ</a>
                    </nav>

                    {/* Contact button */}
                    <Button
                        onClick={() => setShowForm(true)}
                        variant="actionUpdate"
                        className="hidden sm:flex items-center gap-2"
                    >
                        <PhoneCall size={16} />
                        <span>Liên hệ ngay</span>
                    </Button>
                </div>
            </header>

            {/* Add spacing below header so content doesn’t hide */}
            <div className="h-[90px] md:h-[120px]" />

            {/* Intro Image */}
            <div className="relative z-10 mt-10 flex items-center justify-center">
                <img
                    src="/images/background/Intro.png"
                    alt="Intro"
                    className="cursor-pointer max-w-xs md:max-w-md lg:max-w-lg transition-transform duration-200 hover:scale-105 drop-shadow"
                    onClick={() => setShowForm(true)}
                />
            </div>

            {/* Products */}
            <section className="relative z-10 mt-14 px-4 sm:px-6">
                <h2 className="text-2xl font-bold text-center text-gray-900">SẢN PHẨM HOT</h2>
                <div className="mx-auto mt-3 h-[2px] w-24 rounded bg-blue-600/60" />

                <div className="relative mt-8">
                    {/* Prev */}
                    <button
                        onClick={prev}
                        className="absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-gray-50"
                        aria-label="Trước"
                    >
                        <ChevronLeft />
                    </button>

                    {/* Track */}
                    <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4 sm:gap-6">
                        {loading && Array.from({ length: visibleCount }).map((_, i) => <SkeletonCard key={i} />)}

                        {!loading && error && (
                            <div className="w-full text-center py-12">
                                <p className="text-red-600 font-medium">{error}</p>
                                <Button onClick={fetchProducts} className="mt-4">Thử lại</Button>
                            </div>
                        )}

                        {!loading && !error && products.length === 0 && (
                            <EmptyState onRefresh={fetchProducts} />
                        )}

                        {!loading && !error && slides.map((p) => <ProductCard key={p.id} p={p} />)}
                    </div>

                    {/* Next */}
                    <button
                        onClick={next}
                        className="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:bg-gray-50"
                        aria-label="Sau"
                    >
                        <ChevronRight />
                    </button>
                </div>

                {/* Dots */}
                {!loading && !error && products.length > visibleCount && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        {products.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStart(i)}
                                className={`h-2 w-2 rounded-full transition ${i === start ? "bg-blue-600 scale-110" : "bg-gray-300 hover:bg-gray-400"}`}
                                aria-label={`Chuyển đến vị trí ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Campaign Slider for discounted products */}
            <CampaignSlider products={products} title={`${month.toUpperCase()} • SIÊU SALE MỸ PHẨM`} />

            {/* Footer */}
            <Footer />

            <ContactModal open={showForm} onClose={() => setShowForm(false)} />
        </div>
    );
};

export default LandingPage;
