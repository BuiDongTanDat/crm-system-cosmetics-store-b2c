import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addFlowToChannel } from "@/services/campaign";
import { getFlow as listFlows } from "@/services/automation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function MapFlowDialog({ open, onClose, channelId, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [availableFlows, setAvailableFlows] = useState([]);
    const [flowId, setFlowId] = useState('');

    useEffect(() => {
        if (open) {
            listFlows().then(res => {
                setAvailableFlows(res || []);
            }).catch(e => {
                console.error("Failed to load flows:", e);
                toast.error("Không thể tải danh sách Flow");
            });
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!flowId) {
            toast.error("Vui lòng chọn Flow tự động hóa");
            return;
        }

        try {
            setLoading(true);
            await addFlowToChannel(channelId, {
                flow_id: flowId,
                order_index: 0,
                is_active: true
            });

            toast.success("Gán Flow thành công!");
            onSuccess?.();
            handleClose();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Lỗi khi gán Flow");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFlowId('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Cấu hình Luồng Tự Động (Flow)</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Chọn Flow tự động hóa cho kênh này</Label>
                        <select
                            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-blue-500"
                            value={flowId}
                            onChange={(e) => setFlowId(e.target.value)}
                        >
                            <option value="">-- Chọn flow --</option>
                            {availableFlows.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Hủy</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gán Luồng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
