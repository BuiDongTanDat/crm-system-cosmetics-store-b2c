import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { createLeadFromInterest } from "@/services/leads";
import { Input } from "@/components/ui/input";

// Helper function để tạo UUID v4 chuẩn
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const InterestSubmitModal = ({ open, onClose, campaignName, campaignId = null }) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onEsc = (e) => e.key === "Escape" && onClose?.();
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [onClose]);

    useEffect(() => {
        if (open) {
            setForm({
                name: "",
                email: "",
                phone: "",
                notes: "",
            });
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!form.name?.trim() || !form.email?.trim() || !form.phone?.trim()) {
            alert("Vui lòng nhập đầy đủ Họ tên, Email và SĐT.");
            return;
        }

        try {
            setIsSubmitting(true);

            // Lấy anon_id từ localStorage (được tạo khi user click quan tâm)
            let anonId = localStorage.getItem("anon_id");
            
            // Nếu chưa có (trường hợp user chưa click quan tâm) thì tạo mới
            if (!anonId) {
                anonId = generateUUID();
                localStorage.setItem("anon_id", anonId);
            }

            const payload = {
                anon_id: anonId,
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                source: "inbound",
                campaign_id: campaignId ?? null,
                assigned_to: null,
                priority: "medium",
                note: form.notes?.trim() || "",
                tags: campaignName ? [campaignName] : [],
                meta: {
                    submitted_from: "interest_submit_modal",
                    product_count: JSON.parse(localStorage.getItem("likedProducts") || "[]").length,
                },
                rescore: true,
            };

            // Gọi API from-interest để tạo lead từ danh sách quan tâm
            await createLeadFromInterest(payload);
            
            alert("Cảm ơn bạn! Chúng tôi đã ghi nhận danh sách sản phẩm bạn quan tâm.");
            setForm({ name: "", email: "", phone: "", notes: "" });
            
            // Xóa anon_id và danh sách quan tâm sau khi submit thành công
            localStorage.removeItem("anon_id");
            localStorage.removeItem("likedProducts");
            
            onClose?.();
        } catch (err) {
            console.error("Submit interest error:", err);
            alert("Xin lỗi, gửi thông tin thất bại. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div ref={ref} role="dialog" aria-modal className="fade-in-80 zoom-in-95 duration-300 relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold">Gửi Yêu Cầu Quan Tâm</h3>
                        <p className="text-sm text-gray-600">Điền thông tin để chúng tôi tư vấn các sản phẩm bạn quan tâm.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50" aria-label="Đóng">
                        <X />
                    </button>
                </div>

                <form className="p-4 space-y-3" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                        <Input 
                            variant="normal" 
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
                            <Input 
                                variant="normal" 
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
                            <Input 
                                variant="normal" 
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
                        <div className="text-xs text-gray-500">
                            {campaignName ? `Chiến dịch: ${campaignName}` : ""}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                type="button" 
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="actionCreate"
                                type="submit"
                                className="px-4 py-2 flex items-center justify-center gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                                {isSubmitting ? "Đang gửi..." : "Gửi Yêu Cầu"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InterestSubmitModal;
