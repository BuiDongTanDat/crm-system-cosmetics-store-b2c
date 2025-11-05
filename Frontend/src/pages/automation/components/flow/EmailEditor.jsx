import React, { useState } from "react";
import { ChevronDown, Paperclip, Settings, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DropdownOptions from "@/components/common/DropdownOptions";
import { generateEmailContent } from "@/services/automation";

export default function EmailEditor({ value = {}, onChange, onGenAI }) {
  const [openContent, setOpenContent] = useState(true);
  const [openAccount, setOpenAccount] = useState(false);
  const [openCheck, setOpenCheck] = useState(false);

  // mini form cho AI
  const [aiInput, setAiInput] = useState({
    name: "",
    product: "",
    campaign: "",
    tone: "chuyên nghiệp",
    purpose: "promotion",
  });
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenAI = async () => {
    setAiLoading(true);
    try {
      if (onGenAI) {
        await onGenAI(aiInput);
      } else {
        const res = await generateEmailContent({
          input: {
            name: aiInput.name,
            product: aiInput.product,
            campaign: aiInput.campaign,
            tone: aiInput.tone,
          },
          options: { purpose: aiInput.purpose },
        });

        const subject =
          res?.data?.subject || res?.subject || res?.result?.subject || "Ưu đãi dành cho bạn";
        const body =
          res?.data?.body || res?.body || res?.result?.body || "";

        onChange?.({ ...value, subject, body });
      }
    } catch (e) {
      console.error("Gen AI failed:", e);
      alert(e?.message || "Gen AI thất bại");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-0">
      <div className="overflow-hidden border bg-white rounded-bl-2xl rounded-br-2xl flex flex-col">
        {/* ========== NỘI DUNG ========== */}
        <div
          className="bg-white hover:bg-brand-50 px-4 py-3 border-b flex items-center justify-between"
          onClick={() => setOpenContent((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">Nội dung</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              setOpenContent((v) => !v);
            }}
          >
            <ChevronDown
              className={"w-4 h-4 transition " + (openContent ? "rotate-0" : "-rotate-90")}
            />
          </Button>
        </div>

        {openContent && (
          <div className="p-4 space-y-4">
            {/* Subject */}
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Tiêu đề email</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500"
                placeholder="Nhập tiêu đề"
                value={value.subject || ""}
                onChange={(e) => onChange?.({ ...value, subject: e.target.value })}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung email</label>
              <textarea
                className="w-full min-h-[200px] rounded-lg border border-gray-300 p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Nhập nội dung email..."
                value={value.body || ""}
                onChange={(e) => onChange?.({ ...value, body: e.target.value })}
              />
            </div>

            {/* Gen AI */}
            <div className="rounded-lg border p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm flex items-center">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Gen AI (tạo nội dung nhanh)
                </div>
                <Button onClick={handleGenAI} disabled={aiLoading}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {aiLoading ? "Đang tạo…" : "Tạo bằng AI"}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="px-3 py-2 border rounded"
                  placeholder="Tên lead"
                  value={aiInput.name}
                  onChange={(e) => setAiInput((s) => ({ ...s, name: e.target.value }))}
                />
                <input
                  className="px-3 py-2 border rounded"
                  placeholder="Sản phẩm"
                  value={aiInput.product}
                  onChange={(e) => setAiInput((s) => ({ ...s, product: e.target.value }))}
                />
                <input
                  className="px-3 py-2 border rounded"
                  placeholder="Chiến dịch"
                  value={aiInput.campaign}
                  onChange={(e) => setAiInput((s) => ({ ...s, campaign: e.target.value }))}
                />
                <input
                  className="px-3 py-2 border rounded"
                  placeholder="Tone (vd: chuyên nghiệp)"
                  value={aiInput.tone}
                  onChange={(e) => setAiInput((s) => ({ ...s, tone: e.target.value }))}
                />
                <DropdownOptions
                  options={[
                    { value: "promotion", label: "promotion" },
                    { value: "welcome", label: "welcome" },
                    { value: "reminder", label: "reminder" },
                    { value: "follow_up", label: "follow_up" },
                  ]}
                  value={aiInput.purpose}
                  onChange={(val) => setAiInput((s) => ({ ...s, purpose: val }))}
                  placeholder="Mục đích"
                  width="w-full md:col-span-2"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                API: <code>POST /ai/generate-email-content</code> — body:
                {" { input: { name, product, campaign, tone }, options: { purpose } }"}
              </p>
            </div>

            <Button variant="outline" className="flex items-center gap-2 text-sm text-blue-600">
              <Paperclip className="w-4 h-4" />
              Thêm file đính kèm
            </Button>

            <hr className="my-2" />

            {/* Hành động bổ sung */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-800">Hành động bổ sung</div>
              <div className="text-sm text-gray-500">Hành động khi mở Email</div>
              <Button variant="actionUpdate" className="w-full">
                Chọn hành động
              </Button>
              <Button variant="actionCreate" className="mt-2 text-sm">
                + Thêm hành động
              </Button>
            </div>
          </div>
        )}

        {/* ========== CHỌN TÀI KHOẢN ========== */}
        <div
          className="px-4 py-3 border-t flex items-center justify-between bg-white hover:bg-brand-50"
          onClick={() => setOpenAccount((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-500" />
            <span className="font-medium text-gray-900">Chọn tài khoản</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              setOpenAccount((v) => !v);
            }}
          >
            <ChevronDown
              className={"w-4 h-4 transition " + (openAccount ? "rotate-0" : "-rotate-90")}
            />
          </Button>
        </div>
        {openAccount && (
          <div className="px-4 py-3">
            <DropdownOptions
              options={[
                { value: "account1", label: "Tài khoản Email 1" },
                { value: "account2", label: "Tài khoản Email 2" },
              ]}
              value={value.emailAccount || ""}
              onChange={(val) => onChange?.({ ...value, emailAccount: val })}
              placeholder="Chọn tài khoản email"
            />
          </div>
        )}

        {/* ========== KIỂM TRA ========== */}
        <div
          className="px-4 py-3 border-t flex items-center justify-between bg-white hover:bg-brand-50"
          onClick={() => setOpenCheck((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-500" />
            <span className="font-medium text-gray-900">Kiểm tra</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              setOpenCheck((v) => !v);
            }}
          >
            <ChevronDown
              className={"w-4 h-4 transition " + (openCheck ? "rotate-0" : "-rotate-90")}
            />
          </Button>
        </div>
        {openCheck && (
          <div className="px-4 py-3 bg-gray-50">
            <Button variant="actionUpdate" className="h-9 px-4">
              Gửi test
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
