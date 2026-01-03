import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, CirclePause, CirclePlay, KeyRound, Paperclip, SendHorizontal, Upload, Loader2 } from "lucide-react";
import { createStream, prepareYoutube, uploadStreamFile, startStreamFile, stopStreamFile } from "@/services/stream";
import { getYoutubeAuthUrl, isAuthenticated } from "@/services/youtube";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { toast } from "sonner";

export default function YoutubeStreamVideo() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const campaignFromState = location.state?.campaign;

    //Đổi mới campaign state logic to handle Promise case
    const [campaign, setCampaign] = useState(() => {
        // if no campaign provided, use a fallback
        if (!campaignFromState) return { id, title: `Chiến dịch ${id || ""}` };
        // if campaignFromState is a Promise, return a temporary placeholder and resolve later
        if (campaignFromState && typeof campaignFromState.then === "function") {
            return { id, title: `Chiến dịch ${id || ""}` };
        }
        // otherwise it's a plain object
        return campaignFromState;
    });

    // Nếu campaignFromState là Promise, resolve nó và cập nhật state khi xong
    useEffect(() => {
        let mounted = true;
        if (campaignFromState && typeof campaignFromState.then === "function") {
            campaignFromState
                .then((resolved) => {
                    if (!mounted) return;
                    // guard against null/undefined
                    setCampaign(resolved || { id, title: `Chiến dịch ${id || ""}` });
                })
                .catch((err) => {
                    console.error("Campaign promise rejected:", err);
                    if (mounted) setCampaign({ id, title: `Chiến dịch ${id || ""}` });
                });
        }
        return () => { mounted = false; };
    }, [campaignFromState, id]);

    // Restore lại campaign/title/description từ sessionStorage sau khi OAuth redirect
    useEffect(() => {
        // only attempt restore when there's no campaign provided by location.state
        if (campaignFromState) return;
        try {
            const raw = sessionStorage.getItem('yt_campaign_restore');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed?.campaign) {
                setCampaign(parsed.campaign);
            }
            // restore title/description if provided (overrides placeholder)
            if (parsed?.title) setTitle(parsed.title);
            if (parsed?.description) setDescription(parsed.description || "");
        } catch (err) {
            console.error("Failed to restore campaign from sessionStorage", err);
        } finally {
            sessionStorage.removeItem('yt_campaign_restore');
        }
    }, [campaignFromState]);

    // Stream state
    const fileInputRef = useRef(null);
    // Initialize title from campaign (campaign may be placeholder initially)
    const [title, setTitle] = useState(campaign?.title || "");
    // keep description etc.
    const [description, setDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [starting, setStarting] = useState(false); // Khi bấm BẮT ĐẦU, set trạng thái xử lý

    const [activeStreamId, setActiveStreamId] = useState(null);
    const [rtmpUrl, setRtmpUrl] = useState("");
    const [watchUrlState, setWatchUrlState] = useState("");
    const [uploadedPath, setUploadedPath] = useState(null);
    const [error, setError] = useState("");

    //compact file display helpers & chat tab
    const compactFileLabel = (f) => {
        if (!f) return "";
        const max = 28;
        const name = f.name.length > max ? `${f.name.slice(0, max - 3)}...${f.name.slice(-8)}` : f.name;
        return `${name} - ${(f.size / 1024 / 1024).toFixed(2)}MB`;
    };

    const onFileChange = (e) => {
        const f = e.target.files?.[0] || null;
        setSelectedFile(f);
        setUploadedPath(null);
        setRtmpUrl("");
        setWatchUrlState("");
    };


    // Upload video + prepare youtube
    const handleUploadOnly = async () => {
        if (!selectedFile) { toast.error("Chọn file video trước."); return; }

        setError("");
        try {
            const status = await isAuthenticated();
            if (!status?.authenticated) {
                // persist current campaign/title/description so we can restore after OAuth redirect
                try {
                    const toSave = {
                        campaign: campaign || { id, title: `Chiến dịch ${id || ""}` },
                        title: title || "",
                        description: description || ""
                    };
                    sessionStorage.setItem('yt_campaign_restore', JSON.stringify(toSave));
                } catch (e) {
                    console.error("Failed to save campaign to sessionStorage before redirect", e);
                }
                await getYoutubeAuthUrl('/streams');
                return;
            }

        } catch {
            toast.error("Không thể kiểm tra trạng thái YouTube. Thử lại.");
            return;
        }

        setUploading(true);
        try {
            const titleForStream = title || `Youtube Live - ${campaign.title || campaign.name || campaign.id || ''}`;

            // If we already have an activeStreamId, reuse it (allow multiple uploads to same stream)
            let streamId = activeStreamId;
            if (!streamId) {
                const createRes = await createStream({ title: titleForStream, description });
                console.debug('[YouTubeStream] createStream response:', createRes);
                streamId = createRes?.streamId || createRes?.id || createRes?.data?.streamId;
                if (!streamId) throw new Error('Không nhận được streamId từ server.');
                setActiveStreamId(streamId);
            } else {
                console.debug('[YouTubeStream] Reusing existing streamId for upload:', streamId);
            }

            const uploadResp = await uploadStreamFile(streamId, selectedFile, { title: titleForStream, description });
            setUploadedPath(uploadResp.filePath || uploadResp.filename || null);

            toast.success("Upload thành công. Bấm 'BẮT ĐẦU' để phát video lên YouTube.");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Upload thất bại");
        } finally {
            setUploading(false);
        }
    };

    // Split handlers: start only
    const handleStartStream = async () => {
        if (isStreaming) return;
        if (!activeStreamId) {
            toast.error("Chưa có stream đã upload.");
            return;
        }

        setStarting(true);
        try {
            const titleForStream = title || `Youtube Live - ${campaign.title || campaign.name || campaign.id || ''}`;

            if (!watchUrlState) {
                
                const prep = await prepareYoutube(activeStreamId, { title: titleForStream, description });
                console.debug('[YouTubeStream] prepareYoutube response:', prep);
                const fullRtmp = prep?.youtube?.fullRtmp || prep?.fullRtmp;
                const ytWatchUrl = prep?.youtube?.watchUrl || prep?.watchUrl;
                setRtmpUrl(fullRtmp || "");
                setWatchUrlState(ytWatchUrl || "");
            }

            
            const startResp = await startStreamFile(activeStreamId, { title: titleForStream, description });
            console.debug('[YouTubeStream] startStreamFile response:', startResp);
            setIsStreaming(true);

            toast.success("Đã bắt đầu phát.");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Bắt đầu stream thất bại");
        } finally {
            setStarting(false);
        }
    };

    // dedicated stop handler (called by ConfirmDialog onConfirm)
    const handleStopStream = async () => {
        if (!activeStreamId) { toast.error("Không có stream để dừng."); return; }
        try {
            await stopStreamFile(activeStreamId);
            setIsStreaming(false);

            // Reset states
            setWatchUrlState("");
            setUploadedPath(null);
            setActiveStreamId(null);
            setSelectedFile(null);

            // Reset file input using the ref (ensure input has this ref)
            if (fileInputRef.current) fileInputRef.current.value = null;

            toast.success("Stream đã dừng và preview đã được xoá.");
        } catch (e) {
            console.error(e);
            toast.error("Dừng stream thất bại.");
        }
    };

    // When campaign is resolved/updated, sync title if user hasn't set a custom one yet.
    useEffect(() => {
        // Only auto-update if title is empty or still the placeholder form
        if (!campaign) return;
        const isPlaceholder = !title || title.startsWith("Chiến dịch");
        if (campaign.title && isPlaceholder) {
            setTitle(campaign.title);
        }
    }, [campaign, title]);

    // helper: extract youtube video id from various watch URL forms
    const extractVideoId = (url) => {
        if (!url) return null;
        try {
            const u = new URL(url);
            const v = u.searchParams.get('v');
            if (v) return v;
            // fallback: last path segment (for youtu.be or /watch/...)
            const seg = u.pathname.split('/').filter(Boolean).pop();
            return seg || null;
        } catch { return null; }
    };

    const needsBackConfirm = uploading || isStreaming || !!uploadedPath;

    return (
        <div className="max-h-screen flex flex-col">
            {/* Sticky header */}
            <div className="flex-col my-3 z-20 flex gap-1 px-3 py-3 bg-brand/10 backdrop-blur-lg rounded-md">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Back button: ask confirmation when there's an upload/stream in progress */}
                        {needsBackConfirm ? (
                            <ConfirmDialog
                                title="Bạn có muốn thoát?"
                                description={<>Hiện có file đã upload hoặc buổi phát đang chạy. Thoát sẽ dừng/huỷ và xoá dữ liệu liên quan.</>}
                                confirmText="Có, thoát"
                                cancelText="Hủy"
                                onConfirm={async () => {
                                    try {
                                        // try to stop/cleanup if we have a stream id or active streaming
                                        if (isStreaming || activeStreamId) {
                                            await handleStopStream();
                                        }
                                    } catch (e) {
                                        console.error('Cleanup on back failed', e);
                                    } finally {
                                        navigate("/streams");
                                    }
                                }}
                            >
                                <Button size="icon" variant="actionNormal">
                                    <ChevronLeft className="w-10 h-10" />
                                </Button>
                            </ConfirmDialog>
                        ) : (
                            <Button size="icon" variant="actionNormal" onClick={() => navigate("/streams")}>
                                <ChevronLeft className="w-10 h-10" />
                            </Button>
                        )}

                        <h1 className="text-md font-medium ">
                            <div className="text-gray-900 font-bold text-md">{campaign.name} - Live video </div>
                        </h1>
                    </div>

                </div>

            </div>

            {/* Main body with responsive layout */}
            <div className="flex-1 pt-4 px-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Preview + metadata */}
                    <div className="lg:col-span-7 col-span-1 bg-white rounded-lg shadow p-4 relative">
                        <div className="mb-2 flex justify-between items-center">
                            <div>
                                <div className="text-sm font-medium">Video / Preview</div>

                            </div>
                            <div className="flex items-center gap-2">
                                {/* Top-right overlay controls */}
                                <div className="flex items-center gap-1 px-2 py-1">
                                    <input id="videoFileInput2" ref={fileInputRef} type="file" accept="video/*" onChange={onFileChange} className="hidden" />
                                    <Button variant="outline" onClick={() => document.getElementById("videoFileInput2")?.click()} disabled={isStreaming || uploading || starting}>
                                        <Paperclip className="w-4 h-4" />
                                        {selectedFile ? "Thay file" : "Chọn file"}
                                    </Button>

                                    {/* compact label: render only when there's a selected file to avoid taking space when empty */}
                                    {selectedFile && (
                                        <div className="hidden sm:flex items-center text-xs text-gray-700 bg-transparent px-1 py-1 ml-1">
                                            <span className="truncate max-w-[200px]">{compactFileLabel(selectedFile)}</span>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleUploadOnly}
                                        variant="actionCreate"
                                        disabled={uploading || isStreaming || !selectedFile || starting}>
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {uploading ? "Đang upload..." : "Upload"}
                                    </Button>

                                    {/* Start / Stop with confirmation for stop */}
                                    {isStreaming ? (
                                        <ConfirmDialog
                                            title="Xác nhận dừng"
                                            description={<>Bạn có chắc chắn muốn dừng buổi phát trực tiếp?</>}
                                            confirmText="Dừng"
                                            cancelText="Hủy"
                                            onConfirm={handleStopStream}
                                        >
                                            <Button
                                                variant="actionDelete"
                                                disabled={starting}
                                            >
                                                <CirclePause className="w-4 h-4" />
                                                Dừng
                                            </Button>
                                        </ConfirmDialog>
                                    ) : (
                                        <Button
                                            onClick={handleStartStream}
                                            variant="actionCreate"
                                            disabled={(!activeStreamId && !isStreaming) || starting}
                                        >
                                            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CirclePlay className="w-4 h-4" />}
                                            {starting ? "Đang xử lý..." : "Bắt đầu"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-full rounded overflow-hidden relative mt-3">
                            <div className="w-full h-[220px] sm:h-[320px] bg-white border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden rounded">
                                {/* If watch URL present embed, else show placeholder / local preview */}
                                {watchUrlState ? (
                                    (() => {
                                        const vid = extractVideoId(watchUrlState);
                                        const src = vid ? `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1` : watchUrlState;
                                        return (
                                            <iframe
                                                title="youtube-embed"
                                                src={src}
                                                className="absolute inset-0 w-full h-full"
                                                allow="autoplay; encrypted-media"
                                                allowFullScreen
                                            />
                                        );
                                    })()
                                ) : (
                                    <div className="text-sm text-gray-500">
                                        Upload file và BẮT ĐẦU stream để xem review trực tiếp trên youtube<br />
                                        1) Chọn file video từ máy tính.<br />
                                        2) Bấm "Upload" để tải video lên hệ thống.<br />
                                        3) Bấm "Bắt đầu" để phát trực tiếp video lên YouTube và xem trước tại đây.
 
                                    </div>
                                )}


                            </div>
                        </div>

                        {/* New: Metadata panel moved under preview */}
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

                    {/* Right: Quick actions + chat + local feed */}
                    <div className="lg:col-span-5 col-span-1 flex flex-col gap-4">
                        <div className="w-full flex flex-col sm:flex-row justify-center gap-1 bg-red-100 p-2 rounded-md">
                            <Button
                                onClick={async () => {
                                    try {
                                        if (!navigator.clipboard) throw new Error('Clipboard API không hỗ trợ');
                                        await navigator.clipboard.writeText(window.location.href);
                                        toast.success("Đã sao chép URL vào clipboard");
                                    } catch (err) {
                                        console.error("Copy URL failed", err);
                                        toast.error("Không thể sao chép URL");
                                    }
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full flex-1"
                            >
                                Sao chép URL
                            </Button>
                            <Button
                                onClick={() => {
                                    if (watchUrlState) window.open(watchUrlState, "_blank");
                                    else toast.error("Chưa có link xem live. Vui lòng upload và bấm Bắt đầu.");
                                }}
                                variant="actionDelete"
                                size="sm"
                                className="w-full flex-1"
                            >
                                Watch
                            </Button>
                            <Button
                                onClick={() => {
                                    const vid = extractVideoId(watchUrlState);
                                    if (vid) {
                                        // open Studio for the specific live video (fallback to studio root)
                                        window.open(`https://studio.youtube.com/video/${vid}/live`, "_blank");
                                    } else {
                                        window.open("https://studio.youtube.com", "_blank");
                                    }
                                }}
                                variant="actionDelete"
                                size="sm"
                                className="w-full flex-1 ">
                                Mở kênh
                            </Button>
                            <Button
                                onClick={() => {
                                    const vid = extractVideoId(watchUrlState);
                                    if (vid) {
                                        // open Studio for the specific live video (fallback to studio root)
                                        window.open(`https://studio.youtube.com/video/${vid}/livestreaming`, "_blank");
                                    } else {
                                        window.open("https://www.youtube.com/live_dashboard", "_blank");
                                    }
                                }}
                                variant="actionDelete"
                                size="sm"
                                className="w-full flex-1">
                                Mở Studio
                            </Button>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 flex-1 flex flex-col min-h-[200px]">
                            <div className="grid gap-2 flex-1">
                                {watchUrlState ? (
                                    (() => {
                                        const vid = extractVideoId(watchUrlState);
                                        if (!vid) return <div className="text-xs text-gray-500">Không thể xác định video id để hiển thị chat.</div>;
                                        // chat embeds can be blocked by adblockers; show a friendly fallback message when not available
                                        const chatSrc = `https://www.youtube.com/live_chat?v=${vid}&embed_domain=${window.location.hostname}`;
                                        return (
                                            <iframe
                                                title="YouTube Chat"
                                                src={chatSrc}
                                                className="w-full h-full flex-1 border rounded"
                                            />
                                        );
                                    })()
                                ) : (
                                    <div className="text-xs text-gray-500">Chưa có link YouTube để đồng bộ chat.</div>
                                )}
                            </div>
                        </div>

                     </div>
                 </div>
             </div>
         </div>
     );
 }
