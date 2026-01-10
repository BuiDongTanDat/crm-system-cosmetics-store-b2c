import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCampaignChannel } from "@/services/campaign";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import DateButtonPicker from "@/components/common/DateButtonPicker";
import { format } from "date-fns";
import DropdownOptions from "@/components/common/DropdownOptions";

const CHANNEL_TYPES = [
  { value: "Email", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "Zalo", label: "Zalo" },
  { value: "Facebook", label: "Facebook" },
  { value: "TikTok", label: "TikTok" },
  { value: "Google Ads", label: "Google Ads" },
  { value: "Livestream", label: "Youtube live" },
];

export default function AddChannelDialog({
  open,
  onClose,
  campaignId,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    channel: "Email",
    account_name: "",
    budget: "",
    start_date: "",
    end_date: "",
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Sửa: chọn channel đúng logic (DropdownOptions trả về value)
  const handleChannelChange = (val) => {
    setForm((prev) => ({ ...prev, channel: val }));
  };

  // Sửa: handle chọn ngày cho DateButtonPicker
  const handleDateChange = (field) => (date) => {
    setForm((prev) => ({
      ...prev,
      [field]: date ? format(date, "yyyy-MM-dd") : "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.channel) {
      toast.error("Vui lòng chọn loại kênh");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        channel: form.channel.toLowerCase(),
        account_name: form.account_name,
        budget: Number(form.budget),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: "draft",
      };

      await createCampaignChannel(campaignId, payload);
      toast.success("Thêm kênh thành công!");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Lỗi khi thêm kênh");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      channel: "Email",
      account_name: "",
      budget: "",
      start_date: "",
      end_date: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm Kênh Chạy Chiến Dịch</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Loại kênh</Label>
            <DropdownOptions
              options={CHANNEL_TYPES}
              value={form.channel}
              onChange={handleChannelChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tên tài khoản</Label>
            <Input
              variant="normal"
              className="col-span-3"
              placeholder="VD: Tài khoản QC 1 (Tuỳ chọn)"
              value={form.account_name}
              onChange={handleChange("account_name")}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Ngân sách</Label>
            <Input
              variant="normal"
              type="number"
              className="col-span-3"
              placeholder="0"
              value={form.budget}
              onChange={handleChange("budget")}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Ngày bắt đầu</Label>
            <DateButtonPicker
              value={form.start_date ? new Date(form.start_date) : undefined}
              onChange={handleDateChange("start_date")}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4  items-center gap-4">
            <Label className="text-right">Ngày kết thúc</Label>
            <DateButtonPicker
              value={form.end_date ? new Date(form.end_date) : undefined}
              onChange={handleDateChange("end_date")}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            variant="actionCreate"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Thêm kênh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
