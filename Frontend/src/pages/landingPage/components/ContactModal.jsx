import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { createLead } from "@/services/leads";
import { Input } from "@/components/ui/input";

const ContactModal = ({ open, onClose, campaignName, campaignId = null, defaultNotes = "", defaultProductInterest = "" }) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
        productInterest: "",
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
            setForm((prev) => ({
                ...prev,
                notes: defaultNotes || "",
                productInterest: defaultProductInterest || "",
            }));
        }
    }, [open, defaultNotes, defaultProductInterest]);

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
                source: "InBound",
                tags: campaignName ? [campaignName] : [],
                campaign_id: campaignId ?? null,
                notes: form.notes?.trim() || "",
                product_interest: form.productInterest?.trim() || "",
            };

            await createLead(payload);
            alert("Cảm ơn bạn! Thông tin đã được ghi nhận.");
            setForm({ name: "", email: "", phone: "", notes: "", productInterest: "" });
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
            <div ref={ref} role="dialog" aria-modal className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold">Thông Tin Liên Hệ</h3>
                        <p className="text-sm text-gray-600">Điền thông tin để chúng tôi liên hệ với bạn.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50" aria-label="Đóng">
                        <X />
                    </button>
                </div>

                <form className="p-4 space-y-3" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                        <Input variant="normal" required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nhập họ tên" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Email *</label>
                            <Input variant="normal" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">SĐT *</label>
                            <Input variant="normal" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0123456" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Sản phẩm quan tâm</label>
                        <Input variant="normal" type="text" value={form.productInterest} onChange={(e) => setForm({ ...form, productInterest: e.target.value })} placeholder="Nhập tên sản phẩm" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Ghi chú</label>
                        <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Nhập ghi chú (tùy chọn)" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <div className="text-xs text-gray-500">{campaignName ? `Chiến dịch: ${campaignName}` : ""}</div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                type="button" onClick={onClose}
                                disabled={isSubmitting}>Hủy</Button>
                            <Button
                                variant="actionCreate"
                                type="submit"
                                className="px-4 py-2 flex items-center justify-center gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                                {isSubmitting ? "Đang gửi..." : "Gửi Thông Tin"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactModal;
