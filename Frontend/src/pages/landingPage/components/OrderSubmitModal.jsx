import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const OrderSubmitModal = ({ open, onClose, onSubmit, isSubmitting }) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
    });
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!form.name?.trim() || !form.phone?.trim()) {
            alert("Vui lòng nhập Họ tên và SĐT để tiếp tục đặt hàng.");
            return;
        }

        onSubmit?.({
            full_name: form.name.trim(),
            email: form.email?.trim() || "",
            phone: form.phone.trim(),
            note: form.notes?.trim() || "",
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div ref={ref} role="dialog" aria-modal className="fade-in-80 zoom-in-95 duration-300 relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="text-lg font-semibold">Thông Tin Đặt Hàng</h3>
                        <p className="text-sm text-gray-600">Điền thông tin liên hệ để bắt đầu quá trình thanh toán.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50" aria-label="Đóng">
                        <X />
                    </button>
                </div>

                <form className="p-4 space-y-4" onSubmit={handleSubmit}>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
                            <Input
                                variant="normal"
                                required
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="0123456789"
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <Input
                                variant="normal"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="email@example.com (Tùy chọn)"
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
                            placeholder="Ghi chú về đơn hàng (tùy chọn)..."
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
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
                            className="px-6 py-2 flex items-center justify-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                            {isSubmitting ? "Đang xử lý..." : "Tiếp tục thanh toán"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderSubmitModal;
