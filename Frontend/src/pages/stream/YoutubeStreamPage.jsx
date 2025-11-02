import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronLeft, KeyRound, Plus, SendHorizontal, SendHorizontalIcon, X } from "lucide-react";
import DropdownOptions from "@/components/common/DropdownOptions";
import DropdownWithSearch from "@/components/common/DropdownWithSearch";
import { getProducts } from "@/services/products";
import { formatCurrency } from "@/utils/helper";

export default function YoutubeStreamPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const campaignFromState = location.state?.campaign;
    const [campaign] = useState(campaignFromState || { id, title: `Chiến dịch ${id || ""}` });

    // --- New: form embed, chat sync, view reporting ---
    const [formUrl, setFormUrl] = useState(""); // URL form (will be sent to chat, not overlayed)
    const [showFormOverlay, setShowFormOverlay] = useState(true); // kept but no iframe overlay usage
    const [ytUrl, setYtUrl] = useState("");
    const [chatSrc, setChatSrc] = useState("");
    const [viewsInput, setViewsInput] = useState("");
    const [viewsHistory, setViewsHistory] = useState([]);

    // Products & promotion
    const [products, setProducts] = useState([]);
    const [promotedProduct, setPromotedProduct] = useState(null); // product shown on preview

    // Local chat feed for messages we "send" from UI (instructions / form link / product link)
    const [localChatMessages, setLocalChatMessages] = useState([]);

    useEffect(() => {
        let mounted = true;
        getProducts()
            .then((res) => {
                if (!mounted) return;
                const list = res?.data || res || [];
                setProducts(list);
            })
            .catch((err) => {
                console.error("Lỗi lấy products:", err);
                setProducts([]);
            });
        return () => { mounted = false; };
    }, []);

    const extractVideoId = (url) => {
        if (!url) return null;
        try {
            // handle common formats
            const u = new URL(url.includes("http") ? url : `https://${url}`);
            // youtube.com/watch?v=ID
            const v = u.searchParams.get("v");
            if (v) return v;
            // youtu.be/ID or /live/ID or /watch/ID
            const parts = u.pathname.split("/").filter(Boolean);
            return parts.length ? parts[parts.length - 1] : null;
        } catch {
            // fallback: try regex
            const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            return m ? m[1] : null;
        }
    };

    const syncChat = () => {
        const vid = extractVideoId(ytUrl);
        if (!vid) {
            alert("Không nhận diện được Video ID. Vui lòng dán link YouTube Live hoặc ID.");
            return;
        }
        const domain = window.location.hostname;
        setChatSrc(`https://www.youtube.com/live_chat?v=${vid}&embed_domain=${domain}`);
    };

    const stopChat = () => setChatSrc("");

    const recordViews = () => {
        const v = Number(viewsInput) || Math.floor(Math.random() * 500); // nếu user không nhập thì mock
        const entry = { ts: new Date().toISOString(), views: v };
        setViewsHistory(prev => [entry, ...prev]);
        alert(`Đã ghi nhận ${v} view tại ${new Date(entry.ts).toLocaleTimeString()}`);
    };

    const exportViewsCsv = () => {
        if (!viewsHistory.length) {
            alert("Chưa có dữ liệu lượt xem nào để xuất.");
            return;
        }
        const rows = [["timestamp", "views"], ...viewsHistory.map(h => [h.ts, h.views])];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `views_report_${campaign.id || "stream"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    // --- end new features ---

    // Form state
    const [title, setTitle] = useState(campaign.title || "");
    const [description, setDescription] = useState("");
    const [privacy, setPrivacy] = useState("public");
    const [streamKey, setStreamKey] = useState(""); // user-provided stream key
    const [rtmpVisible, setRtmpVisible] = useState(false);

    // Camera preview
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [previewActive, setPreviewActive] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        return () => {
            // cleanup on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const startPreview = async () => {
        setError("");
        try {
            const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = media;
            if (videoRef.current) videoRef.current.srcObject = media;
            setPreviewActive(true);
        } catch (err) {
            setError("Không thể truy cập camera/micro: " + (err.message || err));
            setPreviewActive(false);
        }
    };

    const stopPreview = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        setPreviewActive(false);
    };

    const handleStartStream = () => {
        if (!streamKey) {
            setError("Cần nhập Stream Key từ YouTube để bắt đầu.");
            return;
        }
        // Show RTMP instructions (browser can't push RTMP directly without an encoder/server)
        setRtmpVisible(true);
        setError("");
    };

    const sendToLocalChat = (text) => {
        const entry = { ts: new Date().toISOString(), text };
        setLocalChatMessages((prev) => [entry, ...prev]);
        // also copy to clipboard to make it easy to paste into YouTube chat
        try { navigator.clipboard?.writeText(text); } catch { }
    };

    const handleSendFormToChat = () => {
        if (!formUrl) {
            alert("Vui lòng nhập link form trước khi gửi.");
            return;
        }
        const msg = `Form: ${formUrl}`;
        sendToLocalChat(msg);
        alert("Link form đã được thêm vào chat feed và sao chép vào clipboard. Hãy dán vào YouTube Chat nếu cần.");
    };

    const handlePromoteProduct = (product) => {
        setPromotedProduct(null);
        Promise.resolve().then(() => {
            setPromotedProduct(product);
        });
    };

    const handleSendProductToChat = (product) => {
        if (!product) return;
        const productUrl = product.url || product.link || `#product:${product.product_id || product.id}`;
        const msg = `Quảng bá: ${product.name} - ${productUrl}`;
        sendToLocalChat(msg);
        alert("Link sản phẩm đã được thêm vào chat feed và sao chép vào clipboard.");
    };

    return (
        <div className="flex flex-col">
            {/* Sticky header matching EmployeePage */}
            <div
                className="flex-col sticky top-[70px] z-20 flex gap-1 px-3 py-3 bg-brand/10 backdrop-blur-lg rounded-md"
                style={{ backdropFilter: "blur" }}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            <ChevronLeft className="w-4 h-4" /> Quay lại
                        </Button>
                        <h1 className="text-sm font-medium ">Youtube Live Setup:<br /><div className="text-gray-900 font-bold text-md">{campaign.name}  </div></h1>


                    </div>

                    <div className="flex items-center gap-3">
                        {/* preview / stream controls moved to header */}
                        <div className="flex items-center gap-2">

                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    variant="project"
                                    placeholder="Nhập stream key từ YouTube Live Dashboard"
                                    value={streamKey}
                                    onChange={(e) => setStreamKey(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <Button onClick={handleStartStream} variant="actionCreate" disabled={!streamKey}>
                                Bắt đầu Stream
                            </Button>
                        </div>


                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 pt-4 px-0">
                <div className="grid grid-cols-12 gap-4">
                    {/* Left:Khung Preview */}
                    <div className="col-span-7 bg-white rounded-lg shadow p-4 relative">
                        <div className="mb-2 flex justify-between items-center">
                            <div className="text-sm font-medium">Preview Camera

                                {previewActive && (
                                    <span className="ml-3 inline-flex items-center rounded-full bg-green-100 text-green-800 text-xs px-2 py-1">
                                        Preview ON
                                    </span>
                                )}


                            </div>

                            <div className="text-xs text-gray-500">  {previewActive ? (
                                <Button onClick={stopPreview} variant="actionDelete" className="h-8">
                                    Tắt Preview
                                </Button>
                            ) : (
                                <Button onClick={startPreview} variant="actionUpdate" className="h-8">
                                    Bật Preview
                                </Button>
                            )}</div>
                        </div>
                        <div className="w-full bg-black rounded overflow-hidden relative">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-[400px] object-cover bg-black" />

                            {/* Khung hiển thị sản phẩm overlay lên màn hình nè */}
                            {promotedProduct && (
                                <div

                                    className="absolute left-1 bottom-1 w-56 bg-white rounded-lg p-1 border shadow-md transition-all duration-300 animate-slide-up">
                                    {/* red X top-right to remove */}
                                    <Button
                                        variant="actionDelete"
                                        size="none"
                                        onClick={() => setPromotedProduct(null)}
                                        className=" absolute right-1 top-1 rounded-full p-1 "
                                        aria-label="Bỏ quảng bá"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {/* always render image with placeholder fallback */}
                                        <img
                                            src={promotedProduct.image || '/images/products/product_temp.png'}
                                            alt={promotedProduct.name || 'product'}
                                            onError={(e) => { e.target.src = '/images/products/product_temp.png'; }}
                                            className="w-12 h-12 object-cover rounded"
                                        />

                                        <div className="flex-1 min-w-0">
                                            {/* Tên sản phẩm */}
                                            <div className="text-sm font-semibold truncate">
                                                {promotedProduct.name}
                                            </div>

                                            {/* Giá */}
                                            <div className="flex flex-col mt-1">
                                                {/* Giá gốc */}
                                                {promotedProduct.price_original && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-400 line-through">
                                                            {Number(promotedProduct.price_original).toLocaleString()} đ
                                                        </span>
                                                        {/*Giảm giá */}
                                                        {(promotedProduct.discount_percent ?? promotedProduct.discount) && (
                                                            <span className="text-xs text-amber-600 font-medium">
                                                                Giảm {promotedProduct.discount_percent ?? promotedProduct.discount}%
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Giá hiện tại */}
                                                {(promotedProduct.price_current || promotedProduct.price) && (
                                                    <span className=" font-bold text-gray-800 justify-end">
                                                        {Number(promotedProduct.price_current || promotedProduct.price).toLocaleString()} đ
                                                    </span>

                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Inline controls under preview: form send + product picker */}
                        <div className="mt-2  flex">
                            {/* Send form to chat (no overlay) */}
                            <div className="flex-2">
                                <label className="block text-sm font-medium text-gray-700">Ghim FORM vào chat</label>
                                <div className="flex gap-0 mt-1 mr-2">
                                    <Input
                                        placeholder="Dán link form (Google Form / Typeform ...)"
                                        value={formUrl} onChange={(e) => setFormUrl(e.target.value)}
                                        className="rounded-none rounded-tl-md rounded-bl-md"

                                    />
                                    <Button
                                        variant="actionCreate"
                                        onClick={handleSendFormToChat}
                                        className="rounded-none rounded-tr-md rounded-br-md"
                                    >Gửi Form</Button>
                                </div>
                            </div>

                            {/* Product picker & quick promote */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ghim sản phẩm
                                </label>

                                <div className="flex items-center gap-1 w-full">
                                    <div className="flex-1">
                                        <DropdownWithSearch
                                            items={products}
                                            itemKey={(p) => p.product_id ?? p.id}
                                            filterFn={(p, s) =>
                                                (p.name || p.product_name || "")
                                                    .toString()
                                                    .toLowerCase()
                                                    .includes((s || "").toLowerCase())
                                            }
                                            onSelect={(p) => handlePromoteProduct(p)}
                                            searchPlaceholder="Tìm sản phẩm..."
                                            contentClassName="w-96 max-w-full h-96 overflow-y-auto p-2"
                                            renderItem={(product) => (

                                                <div className="flex w-full justify-between items-center">
                                                    <div className="">
                                                        <div className="font-medium truncate">{product.name}</div>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {product.category || ""}
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-3">
                                                        <div className="text-sm font-semibold">
                                                            {product.price_current
                                                                ? formatCurrency(product.price_current)
                                                                : ""}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {(product.discount_percent ?? product.discount) ? (
                                                                <div className="text-xs text-amber-600">
                                                                    Giảm {(product.discount_percent ?? product.discount)}%
                                                                </div>
                                                            ) : null}
                                                            {product.price_original ? (
                                                                <div className="text-xs text-gray-400 line-through">
                                                                    {formatCurrency(product.price_original)}
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                    </div>
                                                </div>

                                            )}
                                        >
                                            <Button variant="actionUpdate" className="w-full">
                                                <div className="flex gap-1 items-center">
                                                    <Plus className="w-4 h-4" /> Chọn sản phẩm
                                                </div>
                                            </Button>
                                        </DropdownWithSearch>
                                    </div>

                                    {/* Action button */}
                                    <Button
                                        variant="actionCreate"
                                        onClick={() => handleSendProductToChat(promotedProduct)}
                                        disabled={!promotedProduct}
                                        className="min-w-[90px]"
                                    >
                                        Gửi chat
                                    </Button>
                                </div>
                            </div>

                        </div>
                        {!previewActive && (
                            <div className="text-xs text-gray-500 mt-2">Nhấn "Bật Preview" để cấp quyền camera/micro và xem trước trước khi đi live.</div>
                        )}
                    </div>

                    {/* Bên phải: Quick action button + Khung chat */}
                    <div className="col-span-5 flex flex-col gap-4">
                        <div className="w-full flex justify-center gap-2">
                            {/* quick actions */}
                            <Button
                                onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
                                variant="outline"
                                className="w-full flex-1"
                            >
                                Sao chép URL
                            </Button>
                            <Button
                                onClick={() => window.open("https://studio.youtube.com", "_blank")}
                                variant="actionDelete"
                                className="w-full flex-1"
                            >
                                Mở YouTube
                            </Button>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 flex-1">
                            <div className="text-sm font-medium mb-2 flex justify-between items-center">
                                <span>YouTube Live Chat</span>
                                <span className="text-xs text-gray-500">Local feed</span>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <div className="mb-2">
                                    {chatSrc ? (
                                        <iframe title="YouTube Chat" src={chatSrc} className="w-full h-44 border rounded" />
                                    ) : (
                                        <div className="text-xs text-gray-500">Chưa đồng bộ chat. Dán YouTube Live URL và bấm "Đồng bộ Chat".</div>
                                    )}
                                </div>

                                {/* local chat composer */}
                                <div className="flex ">
                                    <Input
                                        className="rounded-none rounded-tl-md rounded-bl-md"
                                        variant="normal"
                                        placeholder="Nhập bình luận..." id="chatComposer" onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                const val = e.target.value.trim();
                                                if (val) { sendToLocalChat(val); e.target.value = ""; }
                                            }
                                        }} />
                                    <Button
                                        variant="actionCreate"
                                        className="rounded-none rounded-tr-md rounded-br-md"
                                        onClick={() => {
                                            const el = document.getElementById("chatComposer");
                                            const val = el?.value?.trim();
                                            if (val) { sendToLocalChat(val); if (el) el.value = ""; }
                                        }}><SendHorizontal className="w-4 h-4" /></Button>
                                </div>

                                <div className="max-h-44 overflow-auto bg-gray-50 p-2 rounded">
                                    {localChatMessages.length === 0 ? (
                                        <div className="text-xs text-gray-500">Chưa có tin nhắn gửi từ app</div>
                                    ) : (
                                        <ul className="space-y-2 text-xs">
                                            {localChatMessages.map((m, i) => (
                                                <li key={i} className="flex justify-between">
                                                    <span className="break-all">{m.text}</span>
                                                    <span className="text-gray-400 ml-2">{new Date(m.ts).toLocaleTimeString()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>


                    </div>







                </div>
            </div>
        </div>
    );
}