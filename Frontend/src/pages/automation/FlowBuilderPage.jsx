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
  Search,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import DropdownOptions from '@/components/common/DropdownOptions';
import Toggle from "./components/flow/Toggle";
import { Block } from "./components/flow/Block";
import InspectorPanel from "./components/flow/InspectorPanel";
import {
  getEventTypes,
  getActionTypes,
} from "@/services/automationCatalog";
// ==== SERVICES ====
import {
  createFlow,
  getFlowEditor,
  saveFlowEditor,
  generateEmailContent,
} from "@/services/automation";
import { Input } from "@/components/ui/input";
// ---- NORMALIZERS ----

const toTagsArray = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    return tags.split(",").map(t => t.trim()).filter(Boolean);
  }
  return [];
};

const normalizeEditor = (res, idFallback) => {
  // Lấy payload gốc của service (tuỳ service có unwrap hay không)
  const root =
    res?.data?.data ||
    res?.data ||
    res?.item ||
    res ||
    {};

  // Meta của flow nằm trong root.flow (chuẩn theo API),
  // còn vài API khác có thể trả flow_meta/meta ngay level này → fallback.
  const flowMeta =
    root.flow ||
    root.flow_meta ||
    root.meta ||
    {};

  return {
    flow_id: flowMeta.flow_id || root.flow_id || idFallback || "",
    name: flowMeta.name || "",
    description: flowMeta.description || "",
    status: (flowMeta.status || "DRAFT"),
    tags: toTagsArray(flowMeta.tags),
    enabled: typeof flowMeta.enabled === "boolean" ? flowMeta.enabled : true,

    // triggers/actions: ưu tiên mảng tách riêng, rồi mới fallback vào trong meta
    triggers: Array.isArray(root.triggers) ? root.triggers : (flowMeta.triggers || []),
    actions: Array.isArray(root.actions) ? root.actions : (flowMeta.actions || []),

    created_by: flowMeta.created_by || "",
    created_at: flowMeta.created_at || "",
    updated_at: flowMeta.updated_at || "",
  };
};

// helper pick id từ nhiều shape
const pickFlowId = (res) =>
  res?.flow_id ||
  res?.data?.flow_id ||
  res?.data?.id ||
  res?.id ||
  res?.data?.data?.flow_id ||
  res?.data?.items?.[0]?.flow_id ||
  null;
// NEW: chuẩn hóa list triggers gửi lên server
const toUpsertTriggers = (list) =>
  list.map(t => ({
    trigger_id: t.trigger_id ?? null,              // giữ id cũ để UPDATE, null = CREATE
    event_type: t.event_type || t.key,
    is_active: t.is_active ?? t.enabled ?? true,
    conditions: t.conditions || {},
  }));

// NEW: chuẩn hóa list actions gửi lên server
const toUpsertActions = (list) =>
  list.map((a, idx) => {
    const action_type = a.action_type || a.key;
    const channel = a.channel || (action_type === "send_email" ? "email" : undefined);
    return {
      action_id: a.action_id ?? null,          // giữ id cũ để UPDATE, null = CREATE
      trigger_id: a.trigger_id ?? null,
      action_type,
      channel,
      content: a.content || a.config || {},  // object/chuỗi thuần
      delay_minutes: Number(a.delay_minutes || 0),
      order_index: Number(a.order_index ?? idx),
      status: a.status || "pending",
    };
  });

// NEW: tính danh sách id bị xóa (diff giữa snapshot và hiện tại)
const calcDeletes = (initial, current) => {
  const initT = new Set(initial.triggers.map(t => t.trigger_id).filter(Boolean));
  const initA = new Set(initial.actions.map(a => a.action_id).filter(Boolean));
  const nowT = new Set(current.triggers.map(t => t.trigger_id).filter(Boolean));
  const nowA = new Set(current.actions.map(a => a.action_id).filter(Boolean));
  return {
    trigger_ids: [...initT].filter(id => !nowT.has(id)),
    action_ids: [...initA].filter(id => !nowA.has(id)),
  };
};

export default function FlowBuilderPage() {
  const { id } = useParams(); // "new" | flow_id
  const navigate = useNavigate();

  const [automation, setAutomation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(true);

  const [activeTab, setActiveTab] = useState("info"); // "info" | "setup"
  const [triggers, setTriggers] = useState([]);
  const [actions, setActions] = useState([]);
  // NEW: lưu snapshot ban đầu để tính phần xóa
  const [initialServer, setInitialServer] = useState({ triggers: [], actions: [] });
  // catalog
  const [eventCatalog, setEventCatalog] = useState([]);   // trigger catalog từ DB
  const [actionCatalog, setActionCatalog] = useState([]); // action catalog từ DB
  const [catalogLoading, setCatalogLoading] = useState(false);
  const TRIGGER_ICON_MAP = {
    "lead.created": UserPlus,
    "lead.updated": Settings,
    "tag.added": Tags,
    "tag.removed": Tags,
    "order.created": Bell,
    "order.paid": Bell,
    "order.refunded": Bell,
    "segment.scheduled": Clock,
    "engagement.email_opened": Mail,
    "engagement.link_clicked": MoveRight,
    "engagement.video_played": Bell,
    "campaign.run": Bell,
    "campaign.approved": CheckCircle2,
    "campaign.pause": Clock,
    "campaign.end": Trash2,
    "zalo.message": Bell,
  };

  const ACTION_ICON_MAP = {
    "send_email": Mail,
    "send_zalo": Bell,
    "post_facebook": Bell,
    "add_interaction": Bell,
    "update_status_if": Settings,
    "tag_update": Tags,
    "create_task": Bell,
    "schedule": Clock,
    "log": Settings,
    "campaign.run": MoveRight,
    "campaign.stop": Trash2,
  };
  const getTriggerIcon = (event_type) => {
    const found = eventCatalog.find(t => t.key === event_type);
    return found ? found.icon : UserPlus;
  };

  const getActionIcon = (action_type) => {
    const found = actionCatalog.find(a => a.key === action_type);
    return found ? found.icon : Bell;
  };


  // ===== Load data (prefill khi Chỉnh sửa) =====
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (id === "new") {
          if (!alive) return;
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
            updated_at: "",
          });
        } else {
          const res = await getFlowEditor(id);
          const data = normalizeEditor(res, id);
          if (!alive) return;
          setAutomation(data);

          // NEW: lưu snapshot để sau này tính deletes
          setInitialServer({
            triggers: Array.isArray(data.triggers) ? data.triggers : [],
            actions: Array.isArray(data.actions) ? data.actions : [],
          });

        }
      } catch (e) {
        console.error(e);
        if (alive) setAutomation(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);
  useEffect(() => {
    let alive = true;
    (async () => {
      setCatalogLoading(true);
      try {
        const [evRes, acRes] = await Promise.all([
          getEventTypes({ is_active: true }),
          getActionTypes({ is_active: true }),
        ]);

        // tùy API bạn trả shape nào, normalize nhẹ:
        const evItems = evRes?.data?.data || evRes?.data || evRes?.items || [];
        const acItems = acRes?.data?.data || acRes?.data || acRes?.items || [];

        const evNormalized = (evItems || []).map((e) => ({
          key: e.event_type,                         // dùng event_type làm key
          label: e.name || e.event_type,             // label hiển thị
          icon: TRIGGER_ICON_MAP[e.event_type] || UserPlus,
          description: e.description || "",
          default_conditions: e.default_conditions || {},
        }));

        const acNormalized = (acItems || []).map((a) => ({
          key: a.action_type,                        // dùng action_type làm key
          label: a.name || a.action_type,
          icon: ACTION_ICON_MAP[a.action_type] || Bell,
          description: a.description || "",
          default_content: a.default_content || {},
          default_channel: a.default_channel || undefined,
        }));

        if (!alive) return;
        setEventCatalog(evNormalized);
        setActionCatalog(acNormalized);
      } catch (e) {
        console.error("[FlowBuilder] load catalog failed:", e);
        if (alive) {
          setEventCatalog([]);
          setActionCatalog([]);
        }
      } finally {
        if (alive) setCatalogLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);
  // đồng bộ UI list khi automation đổi
  useEffect(() => {
    if (!automation) return;

    setTriggers(
      Array.isArray(automation.triggers)
        ? automation.triggers.map(t => {
          const k = t.event_type || t.key;
          const cat = eventCatalog.find(i => i.key === k);
          return {
            ...t,
            key: k,
            icon: cat?.icon || getTriggerIcon(k),
            label: cat?.label || k || "Trigger",
            enabled: t.is_active ?? t.enabled ?? true,
          };
        })
        : []
    );

    setActions(
      Array.isArray(automation.actions)
        ? automation.actions.map((a, idx) => {
          const k = a.action_type || a.key;
          const cat = actionCatalog.find(i => i.key === k);
          return {
            ...a,
            key: k,
            icon: cat?.icon || getActionIcon(k),
            label: cat?.label || k || "Action",
            config: a.content || a.config || {},
            order_index: a.order_index ?? idx,
            delay_minutes: a.delay_minutes ?? 0,
          };
        })
        : []
    );
  }, [automation, eventCatalog, actionCatalog]);


  // UI states
  const [showTriggerPicker, setShowTriggerPicker] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [qTrigger, setQTrigger] = useState("");
  const [qAction, setQAction] = useState("");
  const [selected, setSelected] = useState(null); // {type, key}

  const filteredTriggerCatalog = useMemo(() => {
    const q = qTrigger.trim().toLowerCase();
    const src = eventCatalog;
    return q ? src.filter(i => (i.label || "").toLowerCase().includes(q)) : src;
  }, [qTrigger, eventCatalog]);

  const filteredActionCatalog = useMemo(() => {
    const q = qAction.trim().toLowerCase();
    const src = actionCatalog;
    return q ? src.filter(i => (i.label || "").toLowerCase().includes(q)) : src;
  }, [qAction, actionCatalog]);

  const currentTrigger = useMemo(
    () => selected?.type === "trigger" ? (triggers.find(t => t.key === selected.key) || null) : null,
    [triggers, selected]
  );
  const currentAction = useMemo(
    () => selected?.type === "action" ? (actions.find(a => a.key === selected.key) || null) : null,
    [actions, selected]
  );

  // Common handlers
  const handleFieldChange = (field, value) => {
    setAutomation(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  // Tabs guard
  const goSetupGuard = () => {
    if (!automation?.flow_id) return;
    setActiveTab("setup");
  };

  // ====== ACTIONS ======
  const toggleTrigger = (itemKey) => {
    setTriggers(prev => prev.map(t => t.key === itemKey ? { ...t, enabled: !t.enabled } : t));
    setSaved(false);
  };

  const addTrigger = (item) => {
    setTriggers(prev => [
      ...prev,
      {
        ...item,
        event_type: item.key,
        conditions: item.default_conditions || {},
        enabled: true,
        is_active: true,
      },
    ]);
    setSelected({ type: "trigger", key: item.key });
    setShowTriggerPicker(false);
    setQTrigger("");
    setSaved(false);
  };


  const deleteTrigger = (itemKey) => {
    setTriggers(prev => prev.filter(t => t.key !== itemKey));
    if (selected?.type === "trigger" && selected.key === itemKey) setSelected(null);
    setSaved(false);
  };

  const addAction = (item) => {
    const action_type = item.key;

    const base = {
      ...item,
      action_type,
      channel: item.default_channel || (action_type === "send_email" ? "email" : undefined),
      config: item.default_content || {},
      order_index: actions.length,
      delay_minutes: 0,
    };

    // nếu muốn đảm bảo email luôn có subject/body
    if (action_type === "send_email") {
      base.config = { subject: "", body: "", ...(base.config || {}) };
    }

    setActions(prev => [...prev, base]);
    setSelected({ type: "action", key: item.key });
    setShowActionPicker(false);
    setQAction("");
    setSaved(false);
  };


  const deleteAction = (itemKey) => {
    setActions(prev => prev.filter(a => a.key !== itemKey));
    if (selected?.type === "action" && selected.key === itemKey) setSelected(null);
    setSaved(false);
  };

  // update email config (subject/body)
  const updateEmailConfig = (patch) => {
    if (!currentAction) return;
    setActions(prev =>
      prev.map(a => a.key === currentAction.key ? { ...a, config: { ...(a.config || {}), ...patch } } : a)
    );
    setSaved(false);
  };

  // ====== API handlers ======

  // 1) Tạo flow rồi chuyển sang tab "Thiết lập"
  const handleCreateFlowThenSetup = async () => {
    try {
      const body = {
        name: (automation?.name || '').trim(),
        description: (automation?.description || '').trim(),
        tags: Array.isArray(automation?.tags) ? automation.tags : [],
      };
      if (!body.name) {
        alert("Nhập tên automation trước khi tạo");
        return;
      }
      const res = await createFlow(body);
      const newId = pickFlowId(res);
      if (!newId) {
        alert("Không lấy được flow_id sau khi tạo");
        return;
      }
      setAutomation(prev => ({ ...prev, flow_id: newId, updated_at: new Date().toISOString() }));
      setActiveTab("setup");
      setSaved(false);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Tạo flow thất bại");
    }
  };

  // 2) Lưu thông tin chung (meta)
  const handleSaveInfo = async () => {
    if (!automation?.flow_id) {
      alert("Chưa có flow_id — hãy tạo flow trước");
      return;
    }
    try {
      const payload = {
        flow_meta: {
          name: automation?.name || "New Flow",
          description: automation?.description || "",
          tags: Array.isArray(automation?.tags) ? automation.tags : [],
        },
        upserts: { triggers: [], actions: [] },
        deletes: { trigger_ids: [], action_ids: [] },
      };
      await saveFlowEditor(automation.flow_id, payload);
      setSaved(true);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Lưu thông tin chung thất bại");
    }
  };

  // 3) Lưu tab thiết lập (triggers + actions)
  const handleSaveSetup = async () => {
    if (!automation?.flow_id) {
      alert("Chưa có flow_id — hãy tạo flow trước");
      return;
    }
    try {
      // giữ id cũ để UPDATE, null = CREATE
      const upsertTriggers = toUpsertTriggers(triggers);
      const upsertActions = toUpsertActions(actions);

      // các id bị xóa
      const deletes = calcDeletes(initialServer, { triggers, actions });

      const payload = {
        flow_meta: {
          name: automation?.name || "New Flow",
          description: automation?.description || "",
          tags: Array.isArray(automation?.tags) ? automation.tags : [],
        },
        upserts: { triggers: upsertTriggers, actions: upsertActions },
        deletes, // <— QUAN TRỌNG
      };

      await saveFlowEditor(automation.flow_id, payload);

      // cập nhật snapshot mới sau khi lưu thành công
      setInitialServer({ triggers, actions });

      setSaved(true);
      alert("Đã lưu thiết lập");
    } catch (e) {
      console.error(e);
      alert(e?.message || "Lưu thiết lập thất bại");
    }
  };


  // 4) Gen AI cho action Email hiện chọn
  const handleGenEmailAI = async () => {
    if (!selected || selected.type !== "action") {
      alert("Hãy chọn hành động Gửi Email");
      return;
    }
    const act = actions.find(a => a.key === selected.key);
    if (!act || act.key !== "send_email") {
      alert("Chỉ hỗ trợ Gen AI cho hành động Gửi Email");
      return;
    }
    try {
      const res = await generateEmailContent({
        input: {
          name: automation?.lead_name || "",
          product: automation?.product || "",
          campaign: automation?.campaign || "",
          tone: automation?.tone || "chuyên nghiệp",
        },
        options: { purpose: automation?.purpose || "promotion" },
      });
      const subject = res?.data?.subject || res?.subject || res?.result?.subject || "Ưu đãi dành cho bạn";
      const body = res?.data?.body || res?.body || res?.result?.body || "";
      setActions(prev => prev.map(a =>
        a.key === "send_email" ? { ...a, config: { ...(a.config || {}), subject, body } } : a
      ));
      setSaved(false);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Gen AI thất bại");
    }
  };

  // refs + close pickers
  const triggerPickerRef = useRef(null);
  const actionPickerRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(ev) {
      if (showTriggerPicker && triggerPickerRef.current && !triggerPickerRef.current.contains(ev.target)) {
        setShowTriggerPicker(false);
      }
      if (showActionPicker && actionPickerRef.current && !actionPickerRef.current.contains(ev.target)) {
        setShowActionPicker(false);
      }
    }
    if (showTriggerPicker || showActionPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTriggerPicker, showActionPicker]);

  // options dropdown
  const statusOptions = [
    { value: 'ACTIVE', label: 'Đang chạy' },
    { value: 'DRAFT', label: 'Bản nháp' },
    { value: 'INACTIVE', label: 'Ngưng hoạt động' },
  ];

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <div className="flex-col sticky top-[70px] z-20 p-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2 flex items-center border-b">
        <div className="flex items-center justify-between w-full ">
          <div className="flex items-center gap-2">
            <Button variant="actionNormal" onClick={() => navigate("/automations")} className="mr-2">
              <ChevronLeft className="w-4 h-4" />
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
              onClick={handleSaveSetup}
              disabled={!automation?.flow_id}
              title={!automation?.flow_id ? "Tạo flow trước" : "Lưu thiết lập"}
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu thiết lập
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-0 pt-4 flex items-start w-full gap-2">
          <Button
            variant={activeTab === "info" ? "actionCreate" : "actionNormal"}
            onClick={() => setActiveTab("info")}
          >
            Thông tin chung
          </Button>
          <Button
            variant={activeTab === "setup" ? "actionCreate" : "actionNormal"}
            disabled={!automation?.flow_id}
            onClick={goSetupGuard}
          >
            Thiết lập Trigger & Action
          </Button>
        </div>
      </div>

      {/* Tab content */}
      <div className=" py-6">
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
                  value={Array.isArray(automation?.tags) ? automation.tags.join(", ") : ""}
                  onChange={e => handleFieldChange("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                  placeholder="tag1, tag2, ..."
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <label className="text-sm font-medium text-gray-700">Kích hoạt</label>
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

            {/* Info actions */}
            <div className="mt-4 flex gap-2">
              {!automation?.flow_id ? (
                <Button variant="actionUpdate" onClick={handleCreateFlowThenSetup}>
                  <Save className="w-4 h-4 mr-2" /> Tạo flow & sang thiết lập
                </Button>
              ) : (
                <>
                  <Button variant="actionUpdate" onClick={handleSaveInfo}>
                    <Save className="w-4 h-4 mr-2" /> Lưu thông tin
                  </Button>
                  <Button variant="outline" onClick={goSetupGuard}>
                    Đi tới Thiết lập
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          // Tab setup
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Trigger & Actions */}
            <div className="lg:col-span-4 space-y-3 relative">
              <Section
                title="Trigger"
                subtitle="Sự kiện sẽ kích hoạt kịch bản flow"
                footer={
                  <Button
                    variant="actionUpdate"
                    onClick={() => setShowTriggerPicker(v => !v)}
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
                    className="cursor-pointer"
                    active={selected?.type === "trigger" && selected?.key === t.key}
                    onClick={() => setSelected({ type: "trigger", key: t.key })}
                    right={
                      <div className="flex items-center gap-2">
                        <Toggle checked={!!t.enabled} onChange={() => toggleTrigger(t.key)} />
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
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="text"
                          placeholder="Tìm kiếm chiến dịch..."
                          value={qTrigger}
                          onChange={e => setQTrigger(e.target.value)}
                        />
                      </div>
                      <div className="mt-3 max-h-96 overflow-auto pr-1">
                        {filteredTriggerCatalog.map((it) => (
                          <button
                            key={it.key}
                            onClick={() => addTrigger(it)}
                            className="cursor-pointer w-full flex items-start justify-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                          >
                            <it.icon className="w-5 h-5 mt-0.5 text-brand-600" />
                            <div className="min-w-0 text-left">
                              <div className="text-sm font-medium text-gray-900 truncate">{it.label}</div>
                              <div className="text-xs text-gray-500">Kích hoạt khi điều kiện phù hợp</div>
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
                    onClick={() => setShowActionPicker(v => !v)}
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
                    className="cursor-pointer"
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
                    <div className="mt-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="text"
                          placeholder="Tìm kiếm chiến dịch..."
                          value={qAction}
                          onChange={e => setQAction(e.target.value)}
                        />
                      </div>
                      <div className="mt-3 max-h-96 overflow-auto pr-1">
                        {filteredActionCatalog.map((it) => (
                          <button
                            key={it.key}
                            onClick={() => addAction(it)}
                            className="cursor-pointer w-full flex items-start justify-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                          >
                            <it.icon className="w-5 h-5 mt-0.5 text-brand-600" />
                            <div className="min-w-0 text-left">
                              <div className="text-sm font-medium text-gray-900 truncate">{it.label}</div>
                              <div className="text-xs text-gray-500">Thực thi sau khi Trigger thoả</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Section>
            </div>

            {/* Inspector */}
            <div className="lg:col-span-8">
              <InspectorPanel
                selected={selected}
                currentTrigger={currentTrigger}
                currentAction={currentAction}
                toggleTrigger={toggleTrigger}
                updateEmailConfig={updateEmailConfig}
                onGenEmailAI={handleGenEmailAI}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
const updateActionConfig = (actionKey, patch) => {
  setActions(prev =>
    prev.map(a =>
      a.key === actionKey
        ? { ...a, config: { ...(a.config || {}), ...patch } }
        : a
    )
  );
  setSaved(false);
};
// Section helper
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
