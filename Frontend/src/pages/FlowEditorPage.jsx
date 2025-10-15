"use client";
import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  Settings,
  Bell,
  Mail,
  Clock,
  Tags,
  UserPlus,
  MoveRight,
  Trash2,
  Paperclip,
  Pencil,
  ChevronDown,
} from "lucide-react";

/* ---------- UI helpers ---------- */
const Section = ({ title, subtitle, children, footer }) => (
  <div>
    <div className="mb-2">
      <h3 className="text-gray-900 font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="space-y-3">{children}</div>
    {footer && <div className="mt-3">{footer}</div>}
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={
      "relative inline-flex h-6 w-11 items-center rounded-full transition " +
      (checked ? "bg-violet-600" : "bg-gray-300")
    }
  >
    <span
      className={
        "inline-block h-5 w-5 transform rounded-full bg-white transition " +
        (checked ? "translate-x-6" : "translate-x-1")
      }
    />
  </button>
);

const IconButton = ({ children, onClick, title }) => (
  <button
    title={title}
    onClick={onClick}
    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
  >
    {children}
  </button>
);

const Block = ({ icon: Icon, label, active, onClick, right, muted }) => (
  <button
    onClick={onClick}
    className={
      "w-full flex items-center justify-between px-3 py-3 rounded-xl border text-left transition " +
      (active
        ? "border-violet-500 bg-violet-50"
        : "border-gray-200 hover:border-gray-300") +
      (muted ? " opacity-70" : "")
    }
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-violet-600" />
      <div>
        <div className="text-sm font-medium text-gray-900 line-clamp-1">
          {label}
        </div>
        <div className="text-xs text-gray-500 line-clamp-1">{label}</div>
      </div>
    </div>
    {right}
  </button>
);

function EmailEditor({ value, onChange }) {
  const [openContent, setOpenContent] = useState(true);
  const [openAccount, setOpenAccount] = useState(false);
  const [openCheck, setOpenCheck] = useState(false);

  return (
    <div className="p-4">
      <div className="rounded-xl overflow-hidden border">
        {/* Nội dung */}
        <div className="bg-blue-50/60 px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">Nội dung</span>
            <span className="text-xs text-gray-500">• 2 Điểm</span>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setOpenContent((v) => !v)}
          >
            <ChevronDown
              className={
                "w-4 h-4 transition " + (openContent ? "rotate-0" : "-rotate-90")
              }
            />
          </button>
        </div>

        {openContent && (
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Tiêu đề email</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Nhập nội dung"
                value={value.subject || ""}
                onChange={(e) => onChange({ ...value, subject: e.target.value })}
              />
            </div>

            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-600">
              <Pencil className="w-5 h-5 mx-auto mb-2 text-gray-500" />
              <div className="font-medium mb-1">Mở trình thiết kế email</div>
              <div className="text-gray-500 mb-3">
                Tạo nội dung email qua trình kéo thả trực quan.
              </div>
              <button className="px-4 h-9 rounded-lg bg-gray-900 text-white">
                Mở trình thiết kế
              </button>
            </div>

            <button className="flex items-center gap-2 text-sm text-violet-600">
              <Paperclip className="w-4 h-4" />
              Thêm file đính kèm
            </button>

            <hr className="my-2" />

            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-800">
                Hành động bổ sung
              </div>
              <div className="text-sm text-gray-500">Hành động khi mở Email</div>
              <button className="w-full h-11 rounded-xl border border-dashed text-gray-700 hover:bg-gray-50">
                Chọn hành động
              </button>
              <button className="mt-2 text-sm text-violet-600">
                + Thêm hành động
              </button>
            </div>
          </div>
        )}

        {/* Chọn tài khoản */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">Chọn tài khoản</span>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setOpenAccount((v) => !v)}
          >
            <ChevronDown
              className={
                "w-4 h-4 transition " +
                (openAccount ? "rotate-0" : "-rotate-90")
              }
            />
          </button>
        </div>
        {openAccount && (
          <div className="px-4 pb-4">
            <select className="w-full h-10 px-3 rounded-lg border border-gray-300">
              <option>support@company.com</option>
              <option>noreply@company.com</option>
            </select>
          </div>
        )}

        {/* Kiểm tra */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">Kiểm tra</span>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setOpenCheck((v) => !v)}
          >
            <ChevronDown
              className={
                "w-4 h-4 transition " + (openCheck ? "rotate-0" : "-rotate-90")
              }
            />
          </button>
        </div>
        {openCheck && (
          <div className="px-4 pb-4">
            <button className="h-9 px-4 rounded-lg border">Gửi test</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */
export default function FlowBuilderPage() {
  const [saved, setSaved] = useState(true);

  const CATALOG_TRIGGERS = [
    { key: "signup", label: "Đăng ký mới (Tất cả kênh)", icon: UserPlus },
    { key: "tag_added", label: "Được gắn Tag", icon: Tags },
    { key: "tag_removed", label: "Bị xóa Tag", icon: Tags },
    { key: "seq_join", label: "Đăng ký Sequence", icon: UserPlus },
    { key: "seq_cancel", label: "Hủy đăng ký Sequence", icon: UserPlus },
    { key: "field_changed", label: "Trường tuỳ chỉnh thay đổi", icon: Settings },
  ];
  const CATALOG_ACTIONS = [
    { key: "msg", label: "Gửi tin Messenger", icon: Bell },
    { key: "sms", label: "Gửi SMS", icon: Bell },
    { key: "email", label: "Gửi Email", icon: Mail },
    { key: "goto_flow", label: "Bắt đầu một Flow khác", icon: MoveRight },
    { key: "condition", label: "Điều kiện", icon: Settings },
    { key: "zns", label: "Gửi tin Zalo ZNS", icon: Bell },
    { key: "time", label: "Chờ trong giây lát", icon: Clock },
  ];

  const [triggers, setTriggers] = useState([]);
  const [actions, setActions] = useState([]);

  const [showTriggerPicker, setShowTriggerPicker] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [qTrigger, setQTrigger] = useState("");
  const [qAction, setQAction] = useState("");

  const [selected, setSelected] = useState(null); // { type: 'trigger'|'action', key: string } | null

  const filteredTriggerCatalog = useMemo(() => {
    const q = qTrigger.trim().toLowerCase();
    return !q
      ? CATALOG_TRIGGERS
      : CATALOG_TRIGGERS.filter((i) => i.label.toLowerCase().includes(q));
  }, [qTrigger]);

  const filteredActionCatalog = useMemo(() => {
    const q = qAction.trim().toLowerCase();
    return !q
      ? CATALOG_ACTIONS
      : CATALOG_ACTIONS.filter((i) => i.label.toLowerCase().includes(q));
  }, [qAction]);

  const currentTrigger = useMemo(
    () =>
      selected?.type === "trigger"
        ? triggers.find((t) => t.key === selected.key) || null
        : null,
    [triggers, selected]
  );
  const currentAction = useMemo(
    () =>
      selected?.type === "action"
        ? actions.find((a) => a.key === selected.key) || null
        : null,
    [actions, selected]
  );

  const toggleTrigger = (itemKey) => {
    setTriggers((prev) =>
      prev.map((t) => (t.key === itemKey ? { ...t, enabled: !t.enabled } : t))
    );
    setSaved(false);
  };

  const publish = () => {
    setSaved(true);
    alert("Đã xuất bản!");
  };

  // Add
  const addTrigger = (item) => {
    setTriggers((prev) => [...prev, { ...item, enabled: true }]);
    setSelected({ type: "trigger", key: item.key });
    setShowTriggerPicker(false);
    setQTrigger("");
    setSaved(false);
  };
  const addAction = (item) => {
    const base = { ...item };
    if (item.key === "email") base.config = { subject: "" }; // default cho Email
    setActions((prev) => [...prev, base]);
    setSelected({ type: "action", key: item.key });
    setShowActionPicker(false);
    setQAction("");
    setSaved(false);
  };

  // Delete
  const deleteTrigger = (itemKey) => {
    setTriggers((prev) => prev.filter((t) => t.key !== itemKey));
    if (selected?.type === "trigger" && selected.key === itemKey) setSelected(null);
    setSaved(false);
  };
  const deleteAction = (itemKey) => {
    setActions((prev) => prev.filter((a) => a.key !== itemKey));
    if (selected?.type === "action" && selected.key === itemKey) setSelected(null);
    setSaved(false);
  };

  // Update email config
  const updateEmailConfig = (patch) => {
    if (!currentAction) return;
    setActions((prev) =>
      prev.map((a) =>
        a.key === currentAction.key
          ? { ...a, config: { ...a.config, ...patch } }
          : a
      )
    );
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="h-16 px-6 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span className="text-gray-900 font-medium">Flow_name</span>
          </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-700">{saved ? "Đã lưu" : "Có thay đổi"}</span>
          </div>
          <button
            onClick={publish}
            className="h-9 px-4 rounded-xl bg-gray-900 text-white hover:bg-black">
            Xuất bản
          </button>
        <div/>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left - Trigger & Actions */}
        <div className="lg:col-span-3 space-y-6 relative">
          <Section
            title="Trigger"
            subtitle="Sự kiện sẽ kích hoạt kịch bản flow"
            footer={
              <button
                onClick={() => setShowTriggerPicker((v) => !v)}
                className="w-full h-11 border border-dashed rounded-xl text-sm text-gray-700 hover:bg-gray-50"
              >
                <Plus className="inline w-4 h-4 mr-2" /> Thêm Trigger
              </button>
            }
          >
            {triggers.length === 0 && (
              <div className="text-sm text-gray-500 border rounded-xl p-3">
                Chưa có trigger. Nhấn "Thêm Trigger" để chọn.
              </div>
            )}
            {triggers.map((t) => (
              <Block
                key={t.key}
                icon={t.icon}
                label={t.label}
                active={selected?.type === "trigger" && selected?.key === t.key}
                onClick={() => setSelected({ type: "trigger", key: t.key })}
                right={
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={!!t.enabled}
                      onChange={() => toggleTrigger(t.key)}
                    />
                    <IconButton
                      title="Xoá Trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTrigger(t.key);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                }
              />
            ))}

            {/* Trigger picker */}
            {showTriggerPicker && (
              <div className="absolute left-full top-0 ml-3 w-[360px] bg-white rounded-2xl border shadow-lg p-3 z-10">
                <div className="px-2 pb-2 border-b">
                  <div className="text-sm font-semibold">Chọn Trigger</div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2 px-2 h-10 rounded-lg border bg-gray-50">
                    <input
                      className="w-full bg-transparent outline-none text-sm"
                      placeholder="Tìm kiếm theo tên hoặc nền tảng Trigger"
                      value={qTrigger}
                      onChange={(e) => setQTrigger(e.target.value)}
                    />
                  </div>
                  <div className="mt-3 max-h-96 overflow-auto pr-1">
                    {filteredTriggerCatalog.map((it) => (
                     <button
                        className="w-full flex items-start justify-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                        >
                        <it.icon className="w-5 h-5 mt-0.5 text-violet-600" />
                        <div className="min-w-0 text-left">
                            <div className="text-sm font-medium text-gray-900 truncate">
                            {it.label}
                            </div>
                            <div className="text-xs text-gray-500">
                            Kích hoạt khi điều kiện phù hợp
                            </div>
                        </div>
                    </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>

          <Section
            title="Hành động"
            subtitle="Thao tác cụ thể trong kịch bản flow"
            footer={
              <button
                onClick={() => setShowActionPicker((v) => !v)}
                className="w-full h-11 border border-dashed rounded-xl text-sm text-gray-700 hover:bg-gray-50"
              >
                <Plus className="inline w-4 h-4 mr-2" /> Thêm hành động
              </button>
            }
          >
            {actions.length === 0 && (
              <div className="text-sm text-gray-500 border rounded-xl p-3">
                Chưa có hành động. Nhấn "Thêm hành động" để chọn.
              </div>
            )}
            {actions.map((a) => (
              <Block
                key={a.key}
                icon={a.icon}
                label={a.label}
                active={selected?.type === "action" && selected?.key === a.key}
                onClick={() => setSelected({ type: "action", key: a.key })}
                right={
                  <IconButton
                    title="Xoá Hành động"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAction(a.key);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                }
              />
            ))}

            {/* Action picker */}
            {showActionPicker && (
              <div className="absolute left-full top-56 ml-3 w-[360px] bg-white rounded-2xl border shadow-lg p-3 z-10">
                {/* <div className="px-2 pb-2 border-b">
                  <div className="text-sm font-semibold">Chọn hành động tiếp theo</div>
                </div> */}
                <div className="mt-3">
                  <div className="flex items-center gap-2 px-2 h-10 rounded-lg border bg-gray-50">
                    <input
                      className="w-full bg-transparent outline-none text-sm"
                      placeholder="Tìm kiếm theo tên hoặc nền tảng hành động"
                      value={qAction}
                      onChange={(e) => setQAction(e.target.value)}
                    />
                  </div>
                  <div className="mt-3 max-h-96 overflow-auto pr-1">
                    {filteredActionCatalog.map((it) => (
                      <button
                        key={it.key}
                        onClick={() => addAction(it)}
                        className="w-full flex items-start justify-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                        >
                        <it.icon className="w-5 h-5 mt-0.5 text-violet-600" />
                        <div className="min-w-0 text-left">
                            <div className="text-sm font-medium text-gray-900 truncate">
                            {it.label}
                            </div>
                            <div className="text-xs text-gray-500">
                            Thực thi sau khi Trigger thoả
                            </div>
                        </div>
                        </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Middle - Inspector */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border bg-white">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentTrigger?.icon && selected?.type === "trigger" && (
                  <currentTrigger.icon className="w-5 h-5 text-violet-600" />
                )}
                {currentAction?.icon && selected?.type === "action" && (
                  <currentAction.icon className="w-5 h-5 text-violet-600" />
                )}
                <div>
                  <div className="font-medium text-gray-900 line-clamp-1">
                    {selected?.type === "trigger"
                      ? currentTrigger?.label || "Chưa chọn Trigger"
                      : selected?.type === "action"
                      ? currentAction?.label || "Chưa chọn Hành động"
                      : "Chưa chọn mục nào"}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {selected?.type
                      ? "Cấu hình chi tiết"
                      : "Hãy thêm và chọn một Trigger/Hành động để cấu hình"}
                  </div>
                </div>
              </div>

              {selected?.type === "trigger" && currentTrigger && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Kích hoạt</span>
                  <Toggle
                    checked={!!currentTrigger?.enabled}
                    onChange={() => toggleTrigger(currentTrigger.key)}
                  />
                </div>
              )}
            </div>

            {/* Body */}
            {!selected ? (
              <div className="p-4 text-sm text-gray-600">
                Chưa có mục nào được chọn.
              </div>
            ) : selected.type === "action" && currentAction?.key === "email" ? (
              <EmailEditor
                value={currentAction.config || {}}
                onChange={updateEmailConfig}
              />
            ) : (
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    {selected.type === "trigger" ? "Trigger" : "Hành động"}
                  </h4>
                  <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-4 text-sm text-gray-600">
                    Thêm UI cấu hình riêng cho loại này nếu cần.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column (để trống/preview tuỳ ý) */}
        <div className="lg:col-span-4" />
      </div>
    </div>
  );
}
