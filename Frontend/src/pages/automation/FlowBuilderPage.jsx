"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  ChevronLeft,
  Save,
} from "lucide-react";
import { mockAutomations } from "@/lib/data"; // hoặc fetch từ API
import { Button } from '@/components/ui/button';
import DropdownOptions from '@/components/common/DropdownOptions';
import Toggle from "./components/flow/Toggle";
import { Block } from "./components/flow/Block";
import EmailEditor from "./components/flow/EmailEditor";
import InspectorPanel from "./components/flow/InspectorPanel";


export default function FlowBuilderPage() {
  const { id } = useParams(); // id = 'new' hoặc flow_id
  const navigate = useNavigate();
  const [automation, setAutomation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "setup"

  // Giả lập fetch automation theo id
  useEffect(() => {
    setLoading(true);
    if (id === "new") {
      setAutomation({
        flow_id: "",
        name: "",
        description: "",
        status: "DRAFT",
        tags: [],
        enabled: true,
        triggers: [],
        actions: [],
        created_by: "",
        created_at: "",
        updated_at: ""
      });
      setLoading(false);
    } else {
      // Tìm automation theo flow_id
      const found = mockAutomations.find(a => a.flow_id === id);
      setAutomation(found || null);
      setLoading(false);
    }
  }, [id]);

  const [triggers, setTriggers] = useState([]);
  const [actions, setActions] = useState([]);

  // Hàm này giúp mapping event_type/action_type sang icon nếu có tương ứng
  const getTriggerIcon = (event_type) => {
    const found = CATALOG_TRIGGERS.find(t => t.key === event_type);
    return found ? found.icon : UserPlus;
  };
  const getActionIcon = (action_type) => {
    const found = CATALOG_ACTIONS.find(a => a.key === action_type);
    return found ? found.icon : Bell;
  };

  // Khi automation thay đổi, đồng bộ triggers/actions và bổ sung icon
  useEffect(() => {
    if (automation) {
      setTriggers(
        Array.isArray(automation.triggers)
          ? automation.triggers.map(t => ({
              ...t,
              key: t.event_type || t.key,
              icon: getTriggerIcon(t.event_type || t.key),
              label:
                CATALOG_TRIGGERS.find(i => i.key === (t.event_type || t.key))?.label ||
                t.event_type ||
                t.key ||
                "Trigger"
            }))
          : []
      );
      setActions(
        Array.isArray(automation.actions)
          ? automation.actions.map(a => ({
              ...a,
              key: a.action_type || a.key,
              icon: getActionIcon(a.action_type || a.key),
              label:
                CATALOG_ACTIONS.find(i => i.key === (a.action_type || a.key))?.label ||
                a.action_type ||
                a.key ||
                "Action",
              config: a.content || a.config // giữ cấu hình cho email editor
            }))
          : []
      );
    }
  }, [automation]);

  // Handlers
  const handleNameChange = (e) => {
    setAutomation((prev) => ({ ...prev, name: e.target.value }));
    setSaved(false);
  };
  const handleDescChange = (e) => {
    setAutomation((prev) => ({ ...prev, description: e.target.value }));
    setSaved(false);
  };

  const handleSave = (data) => {
    // TODO: Gọi API lưu hoặc cập nhật automation
    alert("Đã lưu automation!");
    navigate("/automation");
  };

  const handleDelete = () => {
    // TODO: Gọi API xoá automation
    alert("Đã xoá automation!");
    navigate("/automation");
  };

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

  const [showTriggerPicker, setShowTriggerPicker] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [qTrigger, setQTrigger] = useState("");
  const [qAction, setQAction] = useState("");

  const [selected, setSelected] = useState(null); // { type: 'trigger'|'action', key: string } | null

  // Lọc trigger/action theo từ khoá tìm kiếm
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

  // Chỗ này call API tạo flow nha
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

  // Handler cho các trường thông tin chung
  const handleFieldChange = (field, value) => {
    setAutomation((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  // Trạng thái options cho dropdown
  const statusOptions = [
    { value: 'ACTIVE', label: 'Đang chạy' },
    { value: 'DRAFT', label: 'Bản nháp' },
    { value: 'INACTIVE', label: 'Ngưng hoạt động' }
  ];

  // Ref cho picker
  const triggerPickerRef = useRef(null);
  const actionPickerRef = useRef(null);

  // Đóng picker khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (showTriggerPicker && triggerPickerRef.current && !triggerPickerRef.current.contains(event.target)) {
        setShowTriggerPicker(false);
      }
      if (showActionPicker && actionPickerRef.current && !actionPickerRef.current.contains(event.target)) {
        setShowActionPicker(false);
      }
    }
    if (showTriggerPicker || showActionPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTriggerPicker, showActionPicker]);

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <div className=" flex-col sticky top-[70px] z-20 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2 flex items-center  border-b">
      <div className="flex items-center justify-between w-full ">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            
            onClick={() => navigate("/automation")}
            className="mr-2"
          >
            <ChevronLeft className="w-4 h-4"/> Quay lại
          </Button>
          <span className="text-2xl font-bold text-gray-900">
            {automation?.name || "Tên automation"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-700">{saved ? "Đã lưu" : "Có thay đổi"}</span>
          </div>
          <Button
            variant="actionCreate"
            onClick={publish} //
          >
            <Save className="w-4 h-4 mr-2" />
            Xuất bản
          </Button>
        </div>
        </div>
        {/* Tabs */}
      <div className="px-0 pt-4 flex items-start w-full gap-2">
        <Button
          variant= {activeTab === "info" ? "actionCreate" : "actionNormal"}
          onClick={() => setActiveTab("info")}
        >
          Thông tin chung
        </Button>
        <Button
          variant= {activeTab === "setup" ? "actionCreate" : "actionNormal"}
          onClick={() => setActiveTab("setup")}
        >
          Thiết lập Trigger & Action
        </Button>
      </div>
      </div>

      

      {/* Tab content */}
      <div className="px-6 py-6">
        {activeTab === "info" ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên automation</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={automation?.name || ""}
                onChange={e => handleFieldChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={automation?.description || ""}
                onChange={e => handleFieldChange("description", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={automation?.type || ""}
                  onChange={e => handleFieldChange("type", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <DropdownOptions
                  options={statusOptions}
                  value={automation?.status || ""}
                  onChange={v => handleFieldChange("status", v)}
                  placeholder="Chọn trạng thái"
                  width="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={automation?.tags?.join(", ") || ""}
                  onChange={e => handleFieldChange("tags", e.target.value.split(",").map(t => t.trim()))}
                  placeholder="tag1, tag2, ..."
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <label className="text-sm font-medium text-gray-700">{automation?.enabled}</label>
                <Toggle
                  checked={!!automation?.enabled}
                  onChange={v => handleFieldChange("enabled", v)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Người tạo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={automation?.created_by || ""}
                  onChange={e => handleFieldChange("created_by", e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          // Tab setup
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Trigger & Actions */}
            <div className="lg:col-span-4 space-y-6 relative">
              <Section
                title="Trigger"
                subtitle="Sự kiện sẽ kích hoạt kịch bản flow"
                footer={
                  <Button
                    variant="actionUpdate"
                    onClick={() => setShowTriggerPicker((v) => !v)}
                    className="w-full"
                  >
                    <Plus className="inline w-4 h-4 mr-2" /> Thêm Trigger
                  </Button>
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
                        <Button
                          variant="actionDelete"
                          size="icon"
                          title="Xoá Trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTrigger(t.key);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    }
                  />
                ))}

                {/* Trigger picker */}
                {showTriggerPicker && (
                  <div ref={triggerPickerRef} className="absolute left-full top-0 ml-3 w-[360px] bg-white rounded-2xl border shadow-lg p-3 z-10">
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
                            key={it.key}
                            onClick={() => addTrigger(it)}
                            className="w-full flex items-start justify-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                          >
                            <it.icon className="w-5 h-5 mt-0.5 text-brand-600" />
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
                  <Button
                    variant="actionUpdate"
                    onClick={() => setShowActionPicker((v) => !v)}
                    className="w-full"
                    
                  >
                    <Plus className="inline w-4 h-4 mr-2" /> Thêm hành động
                  </Button>
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
                      <Button
                        variant="actionDelete"
                        size="icon"
                        title="Xoá Hành động"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAction(a.key);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    }
                  />
                ))}

                {/* Action picker */}
                {showActionPicker && (
                  <div ref={actionPickerRef} className="absolute left-full top-56 ml-3 w-[360px] bg-white rounded-2xl border shadow-lg p-3 z-10">
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
                            <it.icon className="w-5 h-5 mt-0.5 text-brand-600" />
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

            {/* Middle - Inspector (chiếm hết phần còn lại) */}
            <div className="lg:col-span-8">
              <InspectorPanel
                selected={selected}
                currentTrigger={currentTrigger}
                currentAction={currentAction}
                toggleTrigger={toggleTrigger}
                updateEmailConfig={updateEmailConfig}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Thêm Section helper component
const Section = ({ title, subtitle, footer, children }) => (
  <div className="bg-white rounded-2xl border p-4 space-y-3">
    <div>
      <div className="font-semibold text-gray-900">{title}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
    <div>{children}</div>
    {footer && <div className="pt-2">{footer}</div>}
  </div>
);
