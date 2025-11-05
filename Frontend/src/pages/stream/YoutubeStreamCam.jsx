import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronLeft, KeyRound, Plus, SendHorizontal, SendHorizontalIcon, X } from "lucide-react";
import DropdownOptions from "@/components/common/DropdownOptions";
import DropdownWithSearch from "@/components/common/DropdownWithSearch";
import { getProducts } from "@/services/products";
import { formatCurrency } from "@/utils/helper";
import { createStream, prepareYoutube } from "@/services/stream";
import { getYoutubeAuthUrl, startChat, sendMessage as sendYoutubeMessage, isAuthenticated } from "@/services/youtube";

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

    // New: overlay preview state (user provided URL from prompt)
    // const [overlayUrl, setOverlayUrl] = useState("https://www.youtube.com/live_apps/overlay?id=ChhVQ091RGFEWmZQSWxnMmdhMHJpSkVma2cSC19HLVhYeVU4ek92");
    // const [showOverlayPreview, setShowOverlayPreview] = useState(true);
    // const [overlayBlocked, setOverlayBlocked] = useState(false); // NEW: detect X-Frame-Options blocking

    // --- end new features ---

    // Form state
    const [title, setTitle] = useState(campaign.title || "");
    const [description, setDescription] = useState("");
    const [privacy, setPrivacy] = useState("public");
    const [streamKey, setStreamKey] = useState(""); // user-provided stream key
    const [rtmpVisible, setRtmpVisible] = useState(false);

    // new states to hold RTMP/watch info and live status
    const [rtmpPublishUrl, setRtmpPublishUrl] = useState("");
    const [watchUrlState, setWatchUrlState] = useState("");
    const [youtubeBroadcastStarted, setYoutubeBroadcastStarted] = useState(false);

    // new refs for WebRTC publish
    const pcRef = useRef(null);

    // Camera preview
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [previewActive, setPreviewActive] = useState(false);
    const [error, setError] = useState("");

    // loading state for stream start
    const [loadingStream, setLoadingStream] = useState(false);

    // New: upload video states
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

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
        // stop publishing if active
        stopPublishing();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        setPreviewActive(false);
    };

    // start WebRTC publish to NodeMediaServer (webrtc endpoint)
    const startPublishing = async (webrtcUrl) => {
        if (!webrtcUrl) throw new Error("Missing webrtcUrl for publishing");
        if (!streamRef.current) throw new Error("No media stream available for publishing");

        try {
            // create RTCPeerConnection
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            // forward local tracks
            streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current));

            // create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // post SDP offer to provided WebRTC publish URL (returned by backend)
            const resp = await fetch(webrtcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/sdp" },
                body: offer.sdp
            });

            if (!resp.ok) {
                const t = await resp.text().catch(() => "");
                throw new Error(`WeRTC publish failed: ${resp.status} ${t}`);
            }
            const answerSdp = await resp.text();
            await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

            // simple cleanup on connection state changes
            pc.onconnectionstatechange = () => {
                if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
                    try { pc.close(); } catch { }
                    pcRef.current = null;
                }
            };

            return pc;
        } catch (err) {
            throw err;
        }
    };

    const stopPublishing = () => {
        try {
            if (pcRef.current) {
                pcRef.current.getSenders?.()?.forEach(s => { try { s.track?.stop?.(); } catch { } });
                try { pcRef.current.close(); } catch { }
                pcRef.current = null;
            }
        } catch (e) { console.warn("stopPublishing err", e); }
    };

    const handleStartStream = async () => {
        setError("");

        // ensure Google auth
        try {
            const status = await isAuthenticated();
            if (!status || !status.authenticated) {
                const authUrl = getYoutubeAuthUrl(window.location.href);
                window.location.href = authUrl;
                alert("Bạn cần đăng nhập Google để kết nối YouTube. Sau khi hoàn tất, hãy thử lại.");
                return;
            }
        } catch (err) {
            console.warn("Không thể kiểm tra trạng thái YouTube auth:", err);
            alert("Không thể kiểm tra trạng thái đăng nhập YouTube. Vui lòng thử lại.");
            return;
        }

        setLoadingStream(true);
        try {
            // ensure we have a local MediaStream (start preview if not)
            if (!streamRef.current) {
                await startPreview();
                // small wait to ensure tracks attached
                await new Promise(r => setTimeout(r, 200));
            }

            const titleForStream = `Youtube Live - ${campaign.title || campaign.name || campaign.id || ''}`;
            const createRes = await createStream({ title: titleForStream, resolution: "720p" });
            const streamId = (createRes && (createRes.streamId || createRes.id || createRes.data?.streamId)) || createRes?.data?.id;
            if (!streamId) throw new Error('Không nhận được streamId từ server.');

            // prepare youtube on server (this should register pending and return youtube info)
            const prep = await prepareYoutube(streamId, { title: titleForStream, resolution: "720p" });

            const youtubeStreamKey = prep?.streamKey || prep?.data?.streamKey || prep?.youtubeStreamKey;
            const rtmpUrl = prep?.rtmpUrl || prep?.data?.rtmpUrl || prep?.ingestAddress;
            const watchUrl = prep?.watchUrl || prep?.data?.watchUrl || prep?.youtubeUrl || prep?.watch_url;
            const videoId = prep?.videoId || prep?.data?.videoId || extractVideoId(watchUrl || '');
            const webrtcPublishUrl = prep?.webrtcPublishUrl || prep?.data?.webrtcPublishUrl;

            if (youtubeStreamKey) setStreamKey(youtubeStreamKey);
            if (rtmpUrl) setRtmpPublishUrl(rtmpUrl);
            if (watchUrl) setWatchUrlState(watchUrl);
            if (videoId) {
                const domain = window.location.hostname;
                setChatSrc(`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${domain}`);
            }

            // Start publishing the local camera to NodeMediaServer via WebRTC
            try {
                // fallback to backend endpoint so webrtc offer goes to our server:
                const fallbackUrl = `${window.location.origin}/api/stream/webrtc/${streamId}`;
                await startPublishing(webrtcPublishUrl || fallbackUrl);
            } catch (webrtcErr) {
                console.error("WebRTC publish failed:", webrtcErr);
                alert("Không thể gửi camera lên server tự động. Vui lòng kiểm tra kết nối hoặc dùng OBS/encoder.\n\n" + (webrtcErr.message || webrtcErr));
            }

            // If backend/prepare set the broadcast live, open watch page.
            const prepStatus = (prep?.status || prep?.liveBroadcastStatus || "").toString().toLowerCase();
            const isLive = prepStatus.includes("live") || !!prep?.isLive || !!prep?.live || prep?.youtube?.isLive || prep?.youtube?.is_live || prep?.youtube?.isLive;
            setRtmpVisible(true);
            if (isLive && watchUrl) {
                setYoutubeBroadcastStarted(true);
                window.open(watchUrl, "_blank");
                alert("Livestream đã được bật trên YouTube. Trang xem đã mở ở tab mới.");
            } else {
                const copyText = `${rtmpUrl ? rtmpUrl + " " : ""}${youtubeStreamKey ? "StreamKey: " + youtubeStreamKey : ""}`.trim();
                try { if (copyText) await navigator.clipboard.writeText(copyText); } catch { }
                alert((rtmpUrl || youtubeStreamKey) ? "Đã chuẩn bị. RTMP/StreamKey đã sao chép. Bắt đầu phát nếu cần." : "Đã chuẩn bị livestream. Mở YouTube Studio nếu muốn.");
            }
        } catch (err) {
            console.error(err);
            setError('Không thể tạo livestream tự động: ' + (err.message || err));
            alert('Lỗi: ' + (err.message || err));
        } finally {
            setLoadingStream(false);
        }
    };

    // ensure cleanup when component unmounts
    useEffect(() => {
        return () => {
            stopPublishing();
            if (streamRef.current) {
                try { streamRef.current.getTracks().forEach(t => t.stop()); } catch { }
            }
        };
    }, []);

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

    // NEW: helper to extract YouTube video ID from various URL formats or raw ID
    const extractVideoId = (url) => {
        if (!url) return null;
        try {
            const u = new URL(url.includes("http") ? url : `https://${url}`);
            const v = u.searchParams.get("v");
            if (v) return v;
            const parts = u.pathname.split("/").filter(Boolean);
            return parts.length ? parts[parts.length - 1] : null;
        } catch {
            const m = String(url).match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            return m ? m[1] : null;
        }
    };

    // New: file input handler
    const onFileChange = (e) => {
        const f = e.target.files?.[0] || null;
        setSelectedFile(f);
    };

    // New: upload & stream handler
    const handleUploadAndStream = async () => {
        if (!selectedFile) { alert("Chọn file video trước."); return; }

        setError("");
        // ensure Google auth (reuse same check)
        try {
            const status = await isAuthenticated();
            if (!status || !status.authenticated) {
                const authUrl = getYoutubeAuthUrl(window.location.href);
                window.location.href = authUrl;
                alert("Bạn cần đăng nhập Google để kết nối YouTube. Sau khi hoàn tất, hãy thử lại.");
                return;
            }
        } catch (err) {
            console.warn("Không thể kiểm tra trạng thái YouTube auth:", err);
            alert("Không thể kiểm tra trạng thái đăng nhập YouTube. Vui lòng thử lại.");
            return;
        }

        setUploading(true);
        try {
            // create stream id
            const titleForStream = `Youtube Live - ${campaign.title || campaign.name || campaign.id || ''}`;
            const createRes = await createStream({ title: titleForStream, resolution: "720p" });
            const streamId = (createRes && (createRes.streamId || createRes.id || createRes.data?.streamId)) || createRes?.data?.id;
            if (!streamId) throw new Error('Không nhận được streamId từ server.');

            // prepare youtube (register pending target)
            const prep = await prepareYoutube(streamId, { title: titleForStream, resolution: "720p" });
            const youtubeStreamKey = prep?.streamKey || prep?.data?.streamKey || prep?.youtubeStreamKey;
            const rtmpUrl = prep?.rtmpUrl || prep?.data?.rtmpUrl || prep?.ingestAddress || prep?.fullRtmp;
            const watchUrl = prep?.watchUrl || prep?.data?.watchUrl || prep?.youtubeUrl || prep?.watch_url;

            if (youtubeStreamKey) setStreamKey(youtubeStreamKey);
            if (rtmpUrl) setRtmpPublishUrl(rtmpUrl);
            if (watchUrl) setWatchUrlState(watchUrl);
            setRtmpVisible(true);

            // upload file
            const fd = new FormData();
            fd.append("video", selectedFile);
            // optional metadata
            fd.append("title", titleForStream);

            const resp = await fetch(`/api/stream/upload/${streamId}`, {
                method: "POST",
                body: fd
            });

            if (!resp.ok) {
                const txt = await resp.text().catch(() => "");
                throw new Error(`Upload failed: ${resp.status} ${txt}`);
            }

            const json = await resp.json().catch(() => ({}));
            alert("Video upload started. YouTube livestream should go live shortly.");
            // open watch url if backend returned it or if we have watchUrl
            const watch = json.watchUrl || watchUrl;
            if (watch) window.open(watch, "_blank");
        } catch (err) {
            console.error("Upload & stream error", err);
            alert("Lỗi khi upload/stream: " + (err.message || err));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-h-screen flex flex-col">
            {/* Sticky header matching EmployeePage */}
            <div
                className="flex-col sticky top-[70px] z-20 flex gap-1 px-3 py-3 bg-brand/10 backdrop-blur-lg rounded-md"
                style={{ backdropFilter: "blur" }}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="actionNormal"
                            onClick={() => navigate("/streams")}
                            className=""
                            >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h1 className="text-sm font-medium ">Youtube Live Setup:<br /><div className="text-gray-900 font-bold text-md">{campaign.name}  </div></h1>


                    </div>

                    <div className="flex items-center gap-3">
                        {/* preview / stream controls moved to header */}
                        <div className="flex items-center gap-2">



                            <Button onClick={handleStartStream} variant="actionCreate" disabled={loadingStream}>
                                {loadingStream ? "Đang khởi tạo..." : "Bắt đầu Stream"}
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
                        {/* Preview header + fields */}
                        <div className="">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <div className="text-sm font-medium">Preview Camera
                                        {previewActive && (
                                            <span className="ml-3 inline-flex items-center rounded-full bg-green-100 text-green-800 text-xs px-2 py-1">
                                                Preview ON
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {previewActive ? (
                                        <Button onClick={stopPreview} variant="actionDelete" className="h-8">
                                            Tắt Preview
                                        </Button>
                                    ) : (
                                        <Button onClick={startPreview} variant="actionUpdate" className="h-8">
                                            Bật Preview
                                        </Button>
                                    )}
                                </div>
                            </div>


                        </div>

                        <div className="w-full bg-black rounded overflow-hidden relative">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-[290px] object-cover bg-black" />

                            {/* Overlay preview removed */}

                            {/* Khung hiển thị sản phẩm overlay lên màn hình nè */}
                            {promotedProduct && (
                                <div
                                    className="absolute left-1 bottom-1 w-48 bg-white rounded-lg p-1 border shadow-md transition-all duration-300 animate-slide-up">
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
                                            className="w-10 h-10 object-cover rounded"
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

                        {/*  Metadata panel moved under preview */}
                        <div className="mt-3 border-t pt-3">
                            <div className="text-sm font-medium mb-2">Thông tin livestream</div>
                            <div className="grid grid-cols-1 gap-2">
                                <Input
                                    variant="normal"
                                    placeholder="Tiêu đề livestream"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full" />
                                <textarea
                                    placeholder="Mô tả ngắn"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="focus:ring-blue-400 forcus:ring-1 hover:border-blue-500 w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Bên phải: Quick action button + Khung chat */}
                    <div className="col-span-5 flex flex-col gap-4">
                        <div className="w-full flex justify-center gap-0">
                            <Button
                                onClick={async () => {
                                    try {
                                        if (!navigator.clipboard) throw new Error("Clipboard API không hỗ trợ");
                                        await navigator.clipboard.writeText(window.location.href);
                                        alert("Đã sao chép URL vào clipboard");
                                    } catch (err) {
                                        console.error("Copy URL failed", err);
                                        alert("Không thể sao chép URL");
                                    }
                                }}
                                variant="outline"
                                className="w-full flex-1 rounded-none rounded-tl-md rounded-bl-md"
                            >
                                Sao chép URL
                            </Button>

                            <Button
                                onClick={() => {
                                    if (watchUrlState) window.open(watchUrlState, "_blank");
                                    else alert("Chưa có link xem live. Vui lòng upload/bắt đầu stream.");
                                }}
                                variant="actionDelete"
                                className="w-full flex-1 rounded-none"
                            >
                                Watch
                            </Button>

                            <Button
                                onClick={() => window.open("https://www.youtube.com", "_blank")}
                                variant="actionDelete"
                                className="w-full flex-1 rounded-none"
                            >
                                Mở kênh
                            </Button>

                            <Button
                                onClick={() => window.open("https://studio.youtube.com", "_blank")}
                                variant="actionDelete"
                                className="w-full flex-1 rounded-none rounded-tr-md rounded-br-md"
                            >
                                Mở Studio
                            </Button>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 flex-1 flex flex-col">
                            <div className="grid gap-2 flex-1">
                                {watchUrlState ? (
                                    <>
                                        <iframe
                                            title="YouTube Chat"
                                            src={(function () {
                                                try {
                                                    const vid = new URL(watchUrlState).searchParams.get('v')
                                                        || watchUrlState.split('/').filter(Boolean).pop();
                                                    return `https://www.youtube.com/live_chat?v=${vid}&embed_domain=${window.location.hostname}`;
                                                } catch { return ''; }
                                            })()}
                                            className="w-full h-full flex-1 border rounded"
                                        />
                                    </>
                                ) : (
                                    <div className="text-xs text-gray-500">Chưa có link YouTube để đồng bộ chat.</div>
                                )}
                            </div>
                        </div>


                    </div>





                </div>
            </div>

            {/* RTMP / Watch info panel */}
            {rtmpVisible && (
                <div className="mt-3 px-1">
                    <div className="bg-white border rounded p-2 text-sm flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="truncate"><strong>RTMP:</strong> {rtmpPublishUrl || <span className="text-gray-400">-</span>}</div>
                            <div className="truncate"><strong>Stream Key:</strong> {streamKey || <span className="text-gray-400">-</span>}</div>
                            {watchUrlState && <div className="truncate"><strong>Watch URL:</strong> <span className="text-amber-600">{watchUrlState}</span></div>}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => {
                                const txt = `${rtmpPublishUrl ? rtmpPublishUrl + " " : ""}${streamKey ? "StreamKey: " + streamKey : ""}`.trim();
                                try { navigator.clipboard.writeText(txt); alert("Đã sao chép RTMP + StreamKey."); } catch { alert("Không thể sao chép."); }
                            }}>Sao chép</Button>
                            {watchUrlState ? <Button variant="actionUpdate" onClick={() => window.open(watchUrlState, "_blank")}>Mở trang xem</Button> : null}
                            <Button variant="actionDelete" onClick={() => window.open("https://studio.youtube.com", "_blank")}>Mở Studio</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}