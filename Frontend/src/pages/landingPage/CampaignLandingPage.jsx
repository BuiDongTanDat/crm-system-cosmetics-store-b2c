// CampaignLandingPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ShoppingCart,
    PhoneCall,
    Search,
    Menu,
    CheckCircle,
    ShieldCheck,
    Truck,
    Clock,
    Star,
    ChevronRight,
    Zap,
    Sparkles
} from "lucide-react";
import { getCampaignById } from "@/services/campaign";
import ProductCard from "./components/ProductCard";
import ContactModal from "./components/ContactModal";
import InterestSubmitModal from "./components/InterestSubmitModal";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/helper";
import { getProduct } from "@/services/products";

// Trust Badges Section
const TrustBadges = () => {
    const badges = [
        { icon: <ShieldCheck className="w-10 h-10 text-blue-600" />, title: "SẢN PHẨM CHÍNH HÃNG", desc: "Cam kết 100% chính hãng" },
        { icon: <Clock className="w-10 h-10 text-blue-600" />, title: "GIAO HÀNG TỐC HÀNH", desc: "Giao ngay trong 24h" },
        { icon: <Truck className="w-10 h-10 text-blue-600" />, title: " MIỄN PHÍ ĐỔI TRẢ", desc: "Trong vòng 7 ngày" },
        { icon: <Star className="w-10 h-10 text-blue-600" />, title: "ƯU ĐÃI TRỌN ĐỜI", desc: "Dành cho khách hàng thân thiết" },
    ];

    return (
        <div className="bg-white py-16 border-b border-gray-100 font-sans">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-8">
                {badges.map((badge, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center group cursor-default">
                        <div className="mb-4 transform transition-transform group-hover:scale-110 duration-300">
                            {badge.icon}
                        </div>
                        <h4 className="text-sm font-black text-gray-900 mb-1 tracking-tight font-lexend">{badge.title}</h4>
                        <p className="text-xs text-gray-500 font-medium">{badge.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Footer = () => (
    <footer className="bg-slate-900 text-white pt-24 pb-12 font-sans">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-8">
                <div className="flex items-center gap-2" onClick={() => window.location.href = "/landing"}>
                    <img src="/images/logo/Logo.svg" alt="CChain" className="h-10 w-10 brightness-0 invert" />
                    <span className="text-2xl font-black tracking-tighter font-lexend">CCHAIN BEAUTY</span>
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">
                    Nâng tầm vẻ đẹp Việt bằng những giải pháp chăm sóc da khoa học và tinh tế nhất.
                </p>
                <div className="flex gap-4">
                    {['facebook', 'instagram', 'youtube'].map(social => (
                        <a key={social} href="#" className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 transition duration-300">
                            <div className="w-5 h-5 bg-slate-400 mask-center"></div>
                        </a>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-lg font-black mb-8 font-lexend uppercase tracking-wider">HỖ TRỢ KHÁCH HÀNG</h4>
                <ul className="space-y-4 text-slate-400 font-medium">
                    <li><a href="/landing" className="hover:text-blue-500 transition">Trang chủ</a></li>
                    <li><a href="#" className="hover:text-blue-500 transition">Chính sách bảo mật</a></li>
                    <li><a href="#" className="hover:text-blue-500 transition">Điều khoản sử dụng</a></li>
                    <li><a href="/orders/search" className="hover:text-blue-500 transition">Tra cứu đơn hàng</a></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Thông tin liên hệ</h4>
                <div className="space-y-4 text-sm">
                    <p className="flex gap-3">
                        <span className="text-blue-400 font-bold">Hotline:</span> 0900 000 000
                    </p>
                    <p className="flex gap-3">
                        <span className="text-blue-400 font-bold">Email:</span> hello@cchain.vn
                    </p>
                    <p className="leading-relaxed">
                        <span className="text-blue-400 font-bold">Showroom:</span> 123 Đường Đẹp, TP.HCM
                    </p>
                </div>
            </div>
        </div>
        <div className="border-t border-gray-800 py-8 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} CChain Beauty. All rights reserved. Designed for Excellence.
        </div>
    </footer>
);

const CampaignLandingPage = () => {
    const { id } = useParams();
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [interestSubmitModalOpen, setInterestSubmitModalOpen] = useState(false);
    const [contactPrefill, setContactPrefill] = useState({});
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [expandedDesc, setExpandedDesc] = useState(false);
    const [likedProducts, setLikedProducts] = useState([]);

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const campaignData = await getCampaignById(id);
                if (campaignData) {
                    // If product data is incomplete (missing image/price), fetch individual details
                    if (Array.isArray(campaignData.products)) {
                        const enrichedProducts = await Promise.all(
                            campaignData.products.map(async (p) => {
                                if (!p.image || !p.price_current) {
                                    try {
                                        const detail = await getProduct(p.product_id || p.id);
                                        return { ...p, ...detail };
                                    } catch (err) {
                                        console.warn(`Could not enrich product ${p.product_id}`, err);
                                        return p;
                                    }
                                }
                                return p;
                            })
                        );
                        campaignData.products = enrichedProducts;
                    }
                    setCampaign(campaignData);
                } else {
                    toast.error("Không tìm thấy chiến dịch");
                }
            } catch (e) {
                console.error("Error fetching campaign:", e);
                toast.error("Lỗi khi tải thông tin chiến dịch");
            } finally {
                setLoading(false);
            }
        };
        fetchCampaign();
    }, [id]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!campaign?.end_date) return;

        const timer = setInterval(() => {
            const end = new Date(campaign.end_date).getTime();
            const now = new Date().getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [campaign?.end_date]);

    const updateCartCount = () => {
        try {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            setCartCount(cart.length);
        } catch {
            setCartCount(0);
        }
    };

    useEffect(() => {
        updateCartCount();
        window.addEventListener("storage", updateCartCount);
        return () => window.removeEventListener("storage", updateCartCount);
    }, []);

    const handleAddToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const prodData = {
            ...product,
            product_id: product.product_id || product.id,
            campaign_id: campaign.id, // Track campaign source
            quantity: 1
        };
        const idx = cart.findIndex((item) => item.product_id === prodData.product_id);
        if (idx !== -1) {
            cart[idx].quantity += 1;
        } else {
            cart.push(prodData);
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
        toast.success("Đã thêm vào giỏ hàng");
    };

    const handleToggleLike = (product) => {
        const pid = product.product_id || product.id;
        setLikedProducts(prev => {
            const isLiked = prev.some(item => (item.product_id || item.id) === pid);
            let next;
            if (isLiked) {
                next = prev.filter(item => (item.product_id || item.id) !== pid);
            } else {
                next = [...prev, product];
            }
            localStorage.setItem("likedProducts", JSON.stringify(next));
            return next;
        });
    };

    useEffect(() => {
        const savedLikes = JSON.parse(localStorage.getItem("likedProducts") || "[]");
        setLikedProducts(savedLikes);
    }, []);

    const openContact = (prefill = {}) => {
        setContactPrefill(prefill);
        setContactModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-opacity-50 border-r-4 border-r-blue-600"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Đang tải chiến dịch...</p>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white px-4">
                <img src="/images/background/campaign-notfound.svg" alt="404" className="w-64 opacity-50" />
                <h1 className="text-3xl font-bold text-gray-800 text-center">Rất tiếc, không tìm thấy chiến dịch này</h1>
                <Button onClick={() => window.location.href = "/"} size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700">
                    Về trang chủ
                </Button>
            </div>
        );
    }

    const featuredProduct = campaign.products?.[0];
    const otherProducts = campaign.products?.slice(1) || [];
    const bannerImg = campaign.image || "/images/products/cosmetic2.jpg";

    return (
        <div className="relative min-h-screen bg-white">
            {/* Top Bar Promotion */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-[11px] md:text-sm py-2 text-center font-medium tracking-wide shadow-inner">
                GIẢM GIÁ 50% CHO 100 SẢN PHẨM ĐẦU TIÊN -
                <span className="ml-2 font-black text-amber-300 animate-pulse">NHANH TAY KẺO LỠ!</span>
            </div>

            {/* Header */}
            <header
                className={`fixed top-9 left-0 right-0 z-40 transition-all duration-500 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg py-3" : "bg-transparent py-5"
                    }`}
            >
                <div className="flex items-center justify-between px-6 mx-auto max-w-7xl">
                    <div className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:opacity-80" onClick={() => window.location.href = "/landing"}>
                        <img src="/images/logo/Logo.svg" alt="CChain" className="h-9 w-9" />
                        <span className={`text-xl font-bold bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 bg-clip-text text-transparent`}>
                            CChain Beauty
                        </span>
                    </div>

                    <nav className={`hidden md:flex items-center gap-8 text-xs font-black tracking-widest transition-colors duration-300 font-lexend ${isScrolled ? "text-slate-600" : "text-white"}`}>
                        <a href="/landing" className="hover:text-blue-600 transition uppercase">TRANG CHỦ</a>
                        <a href="#" className="hover:text-blue-600 transition uppercase" onClick={() => setShowContact(true)}>Liên hệ tư vấn</a>
                        <a href="/orders/search" className="hover:text-blue-600 transition uppercase">TRA CỨU ĐƠN HÀNG</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => window.location.href = "/landing"}
                            variant={isScrolled ? "actionUpdate" : "outline"}
                            className={`rounded-full px-6 flex items-center gap-2 shadow-sm ${!isScrolled ? "bg-white/10 text-white border-white/20 hover:bg-white/20" : ""}`}
                        >
                            <ShoppingCart size={18} />
                            <span className="hidden md:inline">Giỏ hàng</span>
                            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-blue-600 bg-white rounded-full">
                                {cartCount}
                            </span>
                        </Button>
                        <div className="lg:hidden">
                            <Button variant="ghost" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={isScrolled ? "text-gray-800" : "text-white"}>
                                <Menu className="w-8 h-8" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Dynamic Hero Section */}
                <div className="relative min-h-[95vh] flex flex-col items-center justify-center overflow-hidden">
                    {/* Background Image with Parallax-like feel */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src={bannerImg}
                            alt={campaign.name}
                            className="w-full h-full object-cover brightness-[0.7]"
                            onError={(e) => {
                                e.currentTarget.src = "/images/products/cosmetic2.jpg";
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent"></div>
                    </div>

                    <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white mt-20">
                        <div className="inline-block px-4 py-1 rounded-full bg-blue-600/90 backdrop-blur-sm text-[10px] font-black tracking-[0.3em] mb-6 animate-bounce font-lexend border border-white/20 shadow-xl">
                            EXCLUSIVE FLASH SALE
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter drop-shadow-2xl font-lexend uppercase text-white">
                            {campaign.name}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 font-medium mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-sans">
                            {campaign.note || "Khám phá bộ sưu tập mỹ phẩm cao cấp với ưu đãi độc quyền dành riêng cho bạn."}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                            <Button
                                onClick={() => document.getElementById('collection').scrollIntoView({ behavior: 'smooth' })}
                                className="bg-white text-blue-600 hover:bg-blue-50 text-base md:text-lg font-black py-8 px-12 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform transition hover:-translate-y-1 flex items-center gap-3 group font-lexend border-none uppercase tracking-wider"
                            >
                                MUA NGAY <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Button>

                            <div className="flex items-center gap-6 bg-slate-900/70 backdrop-blur-2xl px-10 py-6 rounded-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
                                {timeLeft.days > 0 && (
                                    <>
                                        <div className="text-center min-w-[60px]">
                                            <span className="block text-4xl font-black text-white drop-shadow-sm">{String(timeLeft.days).padStart(2, '0')}</span>
                                            <span className="text-[10px] text-white/40 font-black tracking-[0.2em] font-lexend mt-1 uppercase">Ngày</span>
                                        </div>
                                        <div className="text-2xl font-black text-white/20 pb-4">:</div>
                                    </>
                                )}
                                <div className="text-center min-w-[60px]">
                                    <span className="block text-4xl font-black text-white drop-shadow-sm">{String(timeLeft.hours).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-white/40 font-black tracking-[0.2em] font-lexend mt-1 uppercase">Giờ</span>
                                </div>
                                <div className="text-2xl font-black text-white/20 pb-4">:</div>
                                <div className="text-center min-w-[60px]">
                                    <span className="block text-4xl font-black text-white drop-shadow-sm">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-white/40 font-black tracking-[0.2em] font-lexend mt-1 uppercase">Phút</span>
                                </div>
                                <div className="text-2xl font-black text-white/20 pb-4">:</div>
                                <div className="text-center min-w-[60px]">
                                    <span className="block text-4xl font-black text-white drop-shadow-sm">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-white/40 font-black tracking-[0.2em] font-lexend mt-1 uppercase">Giây</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <TrustBadges />

                {/* Featured Product Specialist Section */}
                {featuredProduct && (
                    <section className="py-24 bg-gray-50 overflow-hidden">
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="flex flex-col lg:flex-row items-center gap-16">
                                <div className="flex-1 relative">
                                    <div className="absolute -top-10 -left-10 w-64 h-64 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                                    <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                                    <img
                                        src={featuredProduct.image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800"}
                                        alt={featuredProduct.name}
                                        className="relative z-10 w-full rounded-2xl shadow-2xl transform hover:scale-[1.02] transition duration-500"
                                        onError={(e) => {
                                            e.currentTarget.src = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800";
                                        }}
                                    />
                                </div>

                                <div className="flex-1 space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm tracking-widest uppercase font-lexend">
                                            <Zap size={16} fill="currentColor" /> SẢN PHẨM NỔI BẬT
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight tracking-tighter uppercase font-lexend">
                                            {featuredProduct.name}
                                        </h2>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill="currentColor" />)}
                                            <span className="ml-2 text-gray-500 text-sm">(1,734 Đánh giá)</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-baseline gap-4">
                                            <span className="text-4xl font-black text-rose-600">{formatCurrency(featuredProduct.price_current)}</span>
                                            {featuredProduct.price_original && (
                                                <span className="text-xl text-gray-400 line-through">{formatCurrency(featuredProduct.price_original)}</span>
                                            )}
                                            {featuredProduct.discount_percent && (
                                                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded">-{featuredProduct.discount_percent}% OFF</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <div className="text-gray-600 leading-relaxed text-base font-medium whitespace-pre-line text-justify">
                                                Khám phá dòng sản phẩm cao cấp giúp tôn vinh vẻ đẹp tự nhiên của bạn. Với công thức độc quyền và thành phần lành tính, sản phẩm mang lại cảm giác nhẹ nhàng, bền màu và vẻ đẹp rạng rỡ suốt ngày dài.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pb-8">
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <span className="block text-xs text-gray-400 mb-1">Xuất xứ</span>
                                            <span className="font-bold text-gray-800">Pháp / EU</span>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <span className="block text-xs text-gray-400 mb-1">Loại da</span>
                                            <span className="font-bold text-gray-800">Mọi loại da</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            onClick={() => handleAddToCart(featuredProduct)}
                                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-7 rounded-xl text-lg shadow-lg shadow-rose-200"
                                        >
                                            MUA NGAY
                                        </Button>
                                        <Button
                                            onClick={() => openContact({ defaultProductInterest: featuredProduct.name })}
                                            variant="outline"
                                            className="px-8 py-7 border-2 border-gray-200 hover:bg-gray-50 font-bold rounded-xl"
                                        >
                                            TƯ VẤN
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Collection Grid */}
                <div id="collection" className="max-w-7xl mx-auto px-6 py-24 font-sans">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight font-lexend uppercase">KHÁM PHÁ BỘ SƯU TẬP</h2>
                        <section className="py-24 bg-gray-50 bg-opacity-50">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-black text-blue-600 tracking-[0.3em] uppercase font-lexend">Bộ Sưu Tập</h3>
                                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter font-lexend uppercase">KHÁM PHÁ CHIẾN DỊCH</h2>
                                    </div>
                                    <p className="text-gray-500 max-w-md font-medium font-sans">
                                        Những dòng sản phẩm tinh hoa được chúng tôi tuyển chọn kỹ lưỡng dành riêng cho nhu cầu chăm sóc sắc đẹp của bạn.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {campaign.products.map((p, idx) => (
                                        <ProductCard
                                            key={idx}
                                            p={p}
                                            isLiked={likedProducts.some(lp => (lp.product_id || lp.id) === (p.product_id || p.id))}
                                            onToggleLike={() => handleToggleLike(p)}
                                            onOrder={() => handleAddToCart(p)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main >

            <Footer />

            <ContactModal
                open={contactModalOpen}
                onClose={() => setContactModalOpen(false)}
                campaignName={campaign.name}
                campaignId={campaign.id}
                defaultNotes={contactPrefill.defaultNotes}
                defaultProductInterest={contactPrefill.defaultProductInterest}
            />

            <InterestSubmitModal
                open={interestSubmitModalOpen}
                onClose={() => setInterestSubmitModalOpen(false)}
                campaignName={campaign.name}
                campaignId={campaign.id}
            />

            {/* Floating Interest Action */}
            {
                likedProducts.length > 0 && (
                    <div className="fixed bottom-8 right-8 z-50 animate-bounceIn">
                        <Button
                            onClick={() => setInterestSubmitModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-full shadow-2xl flex items-center gap-3 border-4 border-white"
                        >
                            <Star fill="white" size={20} />
                            GỬI YÊU CẦU QUAN TÂM ({likedProducts.length})
                        </Button>
                    </div>
                )
            }

            {/* Styles for blobs */}
            <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
        </div >
    );
};

export default CampaignLandingPage;
