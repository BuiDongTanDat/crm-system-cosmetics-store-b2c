import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { createLead } from "@/services/leads";

const ContactPage = ({ onContact }) => {
    // inline form state (same fields as ContactModal)
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        productInterest: "",
        notes: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                tags: [],
                campaign_id: null,
                notes: form.notes?.trim() || "",
                product_interest: form.productInterest?.trim() || "",
            };
            await createLead(payload);
            alert("Cảm ơn bạn! Thông tin đã được ghi nhận.");
            setForm({ name: "", email: "", phone: "", productInterest: "", notes: "" });
            onContact?.();
        } catch (err) {
            console.error("createLead error", err);
            alert("Gửi thất bại. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Liên hệ với CChain Beauty</h2>
            <p className="mt-2 text-gray-600">Bạn có câu hỏi? Hãy để lại thông tin, chúng tôi sẽ liên hệ lại sớm nhất.</p>

            <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                    <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Họ tên" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">SĐT *</label>
                    <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0123456" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Sản phẩm quan tâm</label>
                    <input type="text" value={form.productInterest} onChange={(e) => setForm({ ...form, productInterest: e.target.value })} placeholder="Tên sản phẩm (tùy chọn)" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Ghi chú</label>
                    <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Nhập ghi chú (tùy chọn)" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="md:col-span-2 flex items-center justify-between">
                    <div className="text-sm text-gray-500">Hoặc <span className="font-medium cursor-pointer" onClick={onContact}>mở modal liên hệ</span></div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setForm({ name: "", email: "", phone: "", productInterest: "", notes: "" })} disabled={isSubmitting}>Hủy</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}</Button>
                    </div>
                </div>
            </form>
        </section>
    );
};

export default ContactPage;
