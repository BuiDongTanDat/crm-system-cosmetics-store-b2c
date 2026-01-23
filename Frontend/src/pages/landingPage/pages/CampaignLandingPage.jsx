// CampaignLandingPage.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Star,
  ChevronRight,
  Zap,
  ShieldCheck,
  Truck,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { getPublicCampaignById } from "@/services/campaign";
import ProductCard from "../components/ProductCard";
import ContactModal from "../components/ContactModal";
import InterestSubmitModal from "../components/InterestSubmitModal";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/helper";
import { getPublicProductByID } from "@/services/products";
import Loading from "@/components/common/Loading";
import { trackProductInterest } from "@/services/leads";

// Trust Badges Section
const TrustBadges = () => {
  const badges = [
    {
      icon: <ShieldCheck className="w-10 h-10 text-blue-600" />,
      title: "SẢN PHẨM CHÍNH HÃNG",
      desc: "Cam kết 100% chính hãng",
    },
    {
      icon: <Clock className="w-10 h-10 text-blue-600" />,
      title: "GIAO HÀNG TỐC HÀNH",
      desc: "Giao ngay trong 24h",
    },
    {
      icon: <Truck className="w-10 h-10 text-blue-600" />,
      title: " MIỄN PHÍ ĐỔI TRẢ",
      desc: "Trong vòng 7 ngày",
    },
    {
      icon: <Star className="w-10 h-10 text-blue-600" />,
      title: "ƯU ĐÃI TRỌN ĐỜI",
      desc: "Dành cho khách hàng thân thiết",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white py-16 sm:py-20 border-b border-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {badges.map((badge, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center group cursor-default bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-150 hover:-translate-y-2 border border-gray-100"
            >
              <div className="mb-5 transform transition-all duration-150 group-hover:scale-115 group-hover:rotate-6 bg-blue-50 p-5 rounded-2xl ">
                {badge.icon}
              </div>
              <h4 className="text-xs sm:text-sm font-black text-gray-900 mb-2 tracking-tight font-lexend uppercase">
                {badge.title}
              </h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function để tạo UUID v4 chuẩn
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function để tạo hoặc lấy anon_id (UUID format)
const getOrCreateAnonId = () => {
  let anonId = localStorage.getItem("anon_id");
  if (!anonId) {
    anonId = generateUUID();
    localStorage.setItem("anon_id", anonId);
  }
  return anonId;
};

const CampaignLandingPage = ({ onContact, onCartChange }) => {
  const [id, setId] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [interestSubmitModalOpen, setInterestSubmitModalOpen] = useState(false);
  const [contactPrefill, setContactPrefill] = useState({});
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [likedProducts, setLikedProducts] = useState([]);

  // Extract campaign ID from URL
  useEffect(() => {
    const path = window.location.pathname;
    // Try multiple patterns to extract campaign ID
    const patterns = [
      /\/campaigns\/([^\/]+)$/,  // /campaigns/123
      /\/campaign\/([^\/]+)$/,   // /campaign/123
      /\/([^\/]+)$/              // /123 (last segment)
    ];
    
    for (const pattern of patterns) {
      const match = path.match(pattern);
      if (match && match[1]) {
        console.log('Campaign ID extracted:', match[1]); // Debug log
        setId(match[1]);
        break;
      }
    }
    
    // If no match, log the current path for debugging
    if (!id) {
      console.log('Current path:', path);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      console.log('No campaign ID found'); // Debug log
      return;
    }
    

    console.log('Fetching campaign with ID:', id); // Debug log
    const fetchCampaign = async () => {
      try {
        const campaignData = await getPublicCampaignById(id);
        console.log('Campaign data received:', campaignData); // Debug log
        if (campaignData) {
          // If product data is incomplete (missing image/price), fetch individual details
          if (Array.isArray(campaignData.products)) {
            const enrichedProducts = await Promise.all(
              campaignData.products.map(async (p) => {
                if (!p.image || !p.price_current) {
                  try {
                    const detail = await getPublicProductByID(
                      p.product_id || p.id
                    );
                    return { ...p, ...detail };
                  } catch (err) {
                    console.warn(
                      `Could not enrich product ${p.product_id}`,
                      err
                    );
                    return p;
                  }
                }
                return p;
              })
            );
            campaignData.products = enrichedProducts;
            console.log('Enriched products:', enrichedProducts); // Debug log
          }
          setCampaign(campaignData);
        } else {
          console.error('No campaign data returned'); // Debug log
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

  useEffect(() => {
    const savedLikes = JSON.parse(
      localStorage.getItem("likedProducts") || "[]"
    );
    setLikedProducts(savedLikes);
  }, []);

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const prodData = {
      ...product,
      product_id: product.product_id || product.id,
      campaign_id: campaign.id,
      quantity: 1,
    };
    const idx = cart.findIndex(
      (item) => item.product_id === prodData.product_id
    );
    if (idx !== -1) {
      cart[idx].quantity += 1;
    } else {
      cart.push(prodData);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    onCartChange?.();
    toast.success("Đã thêm vào giỏ hàng");
  };

  const handleToggleLike = async (product) => {
    const pid = product.product_id || product.id;
    setLikedProducts((prev) => {
      const isLiked = prev.some((item) => (item.product_id || item.id) === pid);
      let next;
      if (isLiked) {
        next = prev.filter((item) => (item.product_id || item.id) !== pid);
        localStorage.setItem("likedProducts", JSON.stringify(next));
        toast.success("Đã bỏ quan tâm sản phẩm.");
      } else {
        next = [...prev, product];
        localStorage.setItem("likedProducts", JSON.stringify(next));
        // Gọi API trackProductInterest cho anon, ignore lỗi xác thực
        (async () => {
          try {
            const anonId = getOrCreateAnonId();
            await trackProductInterest({
              anon_id: anonId,
              product_id: product.product_id || product.id,
              product_name: product.name,
              source: "inbound",
              campaign_id: campaign?.id ?? null,
              meta: {
                page: "campaign_landing",
                campaign_id: campaign?.id ?? null,
                timestamp: new Date().toISOString(),
              },
            });
            toast.success("Đã thêm sản phẩm vào danh sách quan tâm.");
          } catch (err) {
            // Nếu lỗi xác thực (401/403) thì vẫn không redirect, chỉ log
            if (err?.response?.status === 401 || err?.response?.status === 403) {
              // ignore
            } else {
              console.error("Failed to track interest:", err);
            }
            toast.success("Đã thêm sản phẩm vào danh sách quan tâm.");
          }
        })();
      }
      return next;
    });
  };

  const openContact = (prefill = {}) => {
    setContactPrefill(prefill);
    setContactModalOpen(true);
  };

  if (loading) {
    return <Loading size="lg" />;
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6  px-4">
        <img
          src="/images/background/404.png"
          alt="404"
          className="w-64"
        />
        <h1 className="text-3xl font-bold text-gray-800 text-center">
          Rất tiếc, không tìm thấy chiến dịch này
        </h1>
        <Button
          onClick={() => (window.location.href = "/landing")}
          size="lg"
          className="rounded-full px-8 bg-blue-600 hover:bg-blue-700"
        >
            <ChevronLeft size={20} className="mr-2" />
          Về trang chủ
        </Button>
      </div>
    );
  }

  const featuredProduct = campaign.products?.[0];
  const bannerImg = campaign.image || "/images/products/cosmetic2.jpg";

  return (
    <>
      {/* Top Bar Promotion */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-[11px] sm:text-xs md:text-sm py-3 text-center font-medium tracking-wide shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        <div className="relative z-10 flex items-center justify-center flex-wrap gap-1 sm:gap-2 px-4">
          <span className="hidden sm:inline">🔥</span>
          <span>GIẢM GIÁ 50% CHO 100 SẢN PHẨM ĐẦU TIÊN</span>
          <span className="font-black text-amber-300 animate-pulse">- NHANH TAY KẺO LỠ!</span>
          <span className="hidden sm:inline">🔥</span>
        </div>
      </div>

      {/* Dynamic Hero Section */}
      <div className="relative min-h-[85vh] lg:min-h-[90vh] flex flex-col items-center justify-center overflow-hidden ">
        {/* Background Image with Parallax-like feel */}
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImg}
            alt={campaign.name}
            className="w-full h-full object-cover brightness-[0.65]"
            onError={(e) => {
              e.currentTarget.src = "/images/products/cosmetic2.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/50"></div>
        </div>

        <div className="mt-10 relative z-15 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-block px-5 py-2 rounded-full bg-blue-600/95 backdrop-blur-md text-[9px] sm:text-[10px] font-black tracking-[0.25em] sm:tracking-[0.3em] mb-6 sm:mb-8 animate-bounce font-lexend border-2 border-white/30 shadow-2xl">
            EXCLUSIVE FLASH SALE
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 sm:mb-8 leading-[1.1] tracking-tighter drop-shadow-2xl font-lexend uppercase text-white px-4">
            {campaign.name}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 font-medium mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg font-sans px-4">
            {campaign.note ||
              "Khám phá bộ sưu tập mỹ phẩm cao cấp với ưu đãi độc quyền dành riêng cho bạn."}
          </p>

          <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 pb-8">
            <Button
              onClick={() =>
                document
                  .getElementById("collection")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 text-base sm:text-lg font-black py-6 sm:py-8 px-10 sm:px-12 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 group font-lexend border-none uppercase tracking-wider"
            >
              MUA NGAY
              <ChevronRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Button>

            <div className="w-full sm:w-auto flex items-center justify-center gap-3 sm:gap-6 bg-slate-900/80 backdrop-blur-2xl px-6 sm:px-10 py-5 sm:py-6 rounded-3xl border-2 border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
              {timeLeft.days > 0 && (
                <>
                  <div className="text-center min-w-[50px] sm:min-w-[60px]">
                    <span className="block text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                      {String(timeLeft.days).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-white/50 font-black tracking-[0.15em] sm:tracking-[0.2em] font-lexend mt-1 uppercase">
                      Ngày
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white/30 pb-3 sm:pb-4">
                    :
                  </div>
                </>
              )}
              <div className="text-center min-w-[50px] sm:min-w-[60px]">
                <span className="block text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/50 font-black tracking-[0.15em] sm:tracking-[0.2em] font-lexend mt-1 uppercase">
                  Giờ
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white/30 pb-3 sm:pb-4">:</div>
              <div className="text-center min-w-[50px] sm:min-w-[60px]">
                <span className="block text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/50 font-black tracking-[0.15em] sm:tracking-[0.2em] font-lexend mt-1 uppercase">
                  Phút
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white/30 pb-3 sm:pb-4">:</div>
              <div className="text-center min-w-[50px] sm:min-w-[60px]">
                <span className="block text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/50 font-black tracking-[0.15em] sm:tracking-[0.2em] font-lexend mt-1 uppercase">
                  Giây
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Featured Product Specialist Section */}
      {featuredProduct && (
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="flex-1 w-full relative">
                <div className="absolute -top-10 -left-10 w-48 sm:w-64 h-48 sm:h-64 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute bottom-10 right-10 w-56 sm:w-72 h-56 sm:h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="relative z-10 bg-white p-4 sm:p-6 rounded-3xl shadow-2xl">
                  <img
                    src={
                      featuredProduct.image ||
                      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800"
                    }
                    alt={featuredProduct.name}
                    className="w-full rounded-2xl transform hover:scale-[1.02] transition duration-500"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 w-full space-y-6 sm:space-y-8">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-xs sm:text-sm tracking-widest uppercase font-lexend">
                    <Zap size={16} fill="currentColor" className="animate-pulse" /> SẢN PHẨM NỔI BẬT
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 leading-tight tracking-tighter uppercase font-lexend">
                    {featuredProduct.name}
                  </h2>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={16} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" />
                    ))}
                    <span className="ml-2 text-gray-500 text-xs sm:text-sm">
                      (1,734 Đánh giá)
                    </span>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
                    <span className="text-3xl sm:text-4xl font-black text-rose-600">
                      {formatCurrency(featuredProduct.price_current)}
                    </span>
                    {featuredProduct.price_original && (
                      <span className="text-lg sm:text-xl text-gray-400 line-through">
                        {formatCurrency(featuredProduct.price_original)}
                      </span>
                    )}
                    {featuredProduct.discount_percent && (
                      <span className="bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                        -{featuredProduct.discount_percent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-transparent p-5 sm:p-6 rounded-2xl border border-blue-100">
                    <div className="text-gray-600 leading-relaxed text-sm sm:text-base font-medium whitespace-pre-line text-justify">
                      Khám phá dòng sản phẩm cao cấp giúp tôn vinh vẻ đẹp tự
                      nhiên của bạn. Với công thức độc quyền và thành phần lành
                      tính, sản phẩm mang lại cảm giác nhẹ nhàng, bền màu và vẻ
                      đẹp rạng rỡ suốt ngày dài.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-6 sm:pb-8">
                  <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300">
                    <span className="block text-xs text-gray-400 mb-1.5 font-medium">
                      Xuất xứ
                    </span>
                    <span className="font-bold text-gray-800 text-sm sm:text-base">Pháp / EU</span>
                  </div>
                  <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300">
                    <span className="block text-xs text-gray-400 mb-1.5 font-medium">
                      Loại da
                    </span>
                    <span className="font-bold text-gray-800 text-sm sm:text-base">Mọi loại da</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    onClick={() => handleAddToCart(featuredProduct)}
                    className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold py-6 sm:py-7 rounded-xl text-base sm:text-lg shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    MUA NGAY
                  </Button>
                  <Button
                    onClick={() =>
                      openContact({
                        defaultProductInterest: featuredProduct.name,
                      })
                    }
                    variant="outline"
                    className="sm:flex-none px-6 sm:px-8 py-6 sm:py-7 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
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
      <div id="collection" className="bg-white">
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-xs sm:text-sm font-black text-blue-600 tracking-[0.25em] sm:tracking-[0.3em] uppercase font-lexend">
                  Bộ Sưu Tập
                </h3>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter font-lexend uppercase">
                  KHÁM PHÁ CHIẾN DỊCH
                </h2>
              </div>
              <p className="text-center md:text-right text-sm sm:text-base text-gray-500 max-w-md font-medium font-sans">
                Những dòng sản phẩm tinh hoa được chúng tôi tuyển chọn kỹ
                lưỡng dành riêng cho nhu cầu chăm sóc sắc đẹp của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {campaign.products.map((p, idx) => (
                <ProductCard
                  key={idx}
                  p={p}
                  isLiked={likedProducts.some(
                    (lp) =>
                      (lp.product_id || lp.id) === (p.product_id || p.id)
                  )}
                  onToggleLike={() => handleToggleLike(p)}
                  onOrder={() => handleAddToCart(p)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

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
      {likedProducts.length > 0 && (
        <div className="fixed bottom-6 sm:bottom-8 right-4 sm:right-8 z-50 animate-bounceIn">
          <Button
            onClick={() => setInterestSubmitModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 sm:py-6 px-6 sm:px-8 rounded-full shadow-2xl hover:shadow-blue-500/50 flex items-center gap-2 sm:gap-3 border-2 sm:border-4 border-white transition-all duration-300 hover:scale-105 text-sm sm:text-base"
          >
            <Star fill="white" size={18} className="sm:w-5 sm:h-5 animate-pulse" />
            <span className="hidden sm:inline">GỬI YÊU CẦU QUAN TÂM</span>
            <span className="sm:hidden">QUAN TÂM</span>
            <span className="bg-white text-blue-600 font-black px-2 py-0.5 rounded-full text-xs">
              {likedProducts.length}
            </span>
          </Button>
        </div>
      )}

      {/* Styles for blobs and animations */}
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
          animation-delay: 1s;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        @keyframes bounceIn {
          0% { transform: scale(0) translateY(100px); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-bounceIn {
          animation: bounceIn 0.6s ease-out;
        }
      `}</style>
    </>
  );
};

export default CampaignLandingPage;
