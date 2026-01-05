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
  Info,
  Settings2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DropdownOptions from "@/components/common/DropdownOptions";
import { Block } from "./components/flow/Block";
import { SortableBlock } from "./components/flow/SortableBlock";
import Toggle from "./components/flow/Toggle";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import InspectorPanel from "./components/flow/InspectorPanel";
import { getEventTypes, getActionTypes } from "@/services/automationCatalog";
import {
  createFlow,
  getFlowEditor,
  saveFlowEditor,
  generateEmailContent,
} from "@/services/automation";
import { Input } from "@/components/ui/input";
import AppDialog from "@/components/dialogs/AppDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const toTagsArray = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeEditor = (res, idFallback) => {
  // Lấy payload gốc của service (tuỳ service có unwrap hay không)
  const root = res?.data?.data || res?.data || res?.item || res || {};

  // Meta của flow nằm trong root.flow (chuẩn theo API),
  // còn vài API khác có thể trả flow_meta/meta ngay level này → fallback.
  const flowMeta = root.flow || root.flow_meta || root.meta || {};

  return {
    flow_id: flowMeta.flow_id || root.flow_id || idFallback || "",
    name: flowMeta.name || "",
    description: flowMeta.description || "",
    status: flowMeta.status || "DRAFT",
    tags: toTagsArray(flowMeta.tags),
    enabled: typeof flowMeta.enabled === "boolean" ? flowMeta.enabled : true,

    // triggers/actions: ưu tiên mảng tách riêng, rồi mới fallback vào trong meta
    triggers: Array.isArray(root.triggers)
      ? root.triggers
      : flowMeta.triggers || [],
    actions: Array.isArray(root.actions)
      ? root.actions
      : flowMeta.actions || [],

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

//chuẩn hóa list triggers gửi lên server
const toUpsertTriggers = (list) =>
  list.map((t) => ({
    trigger_id: t.trigger_id ?? null,
    node_id: t.nodeId ?? t.node_id ?? null,     // ✅ thêm
    event_type: t.event_type || t.key,
    is_active: t.enabled ?? t.is_active ?? true,
    conditions: t.conditions || {},
  }));

//chuẩn hóa list actions gửi lên server
const toUpsertActions = (list) =>
  list.map((a, idx) => {
    const action_type = a.action_type || a.key;
    const channel = a.channel || (action_type === "send_email" ? "email" : undefined);

    return {
      action_id: a.action_id ?? null,
      node_id: a.nodeId ?? a.node_id ?? null,   // ✅ thêm
      trigger_id: a.trigger_id ?? null,

      action_type,
      channel,
      content: a.config || a.content || {},      // ✅ UI dùng config, backend dùng content
      delay_minutes: Number(a.delay_minutes || 0),
      order_index: Number(a.order_index ?? idx),
      status: a.status || "pending",
    };
  });

const calcDeletes = (initial, current) => {
  const initT = new Set(
    initial.triggers.map((t) => t.trigger_id).filter(Boolean)
  );
  const initA = new Set(
    initial.actions.map((a) => a.action_id).filter(Boolean)
  );
  const nowT = new Set(
    current.triggers.map((t) => t.trigger_id).filter(Boolean)
  );
  const nowA = new Set(current.actions.map((a) => a.action_id).filter(Boolean));
  return {
    trigger_ids: [...initT].filter((id) => !nowT.has(id)),
    action_ids: [...initA].filter((id) => !nowA.has(id)),
  };
};
const makeNodeId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `node_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
  const [initialServer, setInitialServer] = useState({
    triggers: [],
    actions: [],
  });
  // catalog
  const [eventCatalog, setEventCatalog] = useState([]); // trigger catalog từ DB
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
    send_email: Mail,
    send_zalo: Bell,
    post_facebook: Bell,
    add_interaction: Bell,
    update_status_if: Settings,
    tag_update: Tags,
    create_task: Bell,
    schedule: Clock,
    log: Settings,
    "campaign.run": MoveRight,
    "campaign.stop": Trash2,
  };
  const getTriggerIcon = (event_type) => {
    const found = eventCatalog.find((t) => t.key === event_type);
    return found ? found.icon : UserPlus;
  };

  const getActionIcon = (action_type) => {
    const found = actionCatalog.find((a) => a.key === action_type);
    return found ? found.icon : Bell;
  };

  // Load data (prefill khi Chỉnh sửa)
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
    return () => {
      alive = false;
    };
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
          ...e, // keep all original fields (including config_schema)
          key: e.event_type,
          label: e.name || e.event_type,
          icon: TRIGGER_ICON_MAP[e.event_type] || UserPlus,
          description: e.description || "",
          default_conditions: e.default_conditions || {},
        }));

        const acNormalized = (acItems || []).map((a) => ({
          ...a, // keep all original fields (including config_schema)
          key: a.action_type,
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

    return () => {
      alive = false;
    };
  }, []);
  // đồng bộ UI list khi automation đổi
  useEffect(() => {
    if (!automation) return;

    setTriggers(
      Array.isArray(automation.triggers)
        ? automation.triggers.map((t, idx) => {
          const eventType = t.event_type || t.key;
          const cat = eventCatalog.find((i) => i.key === eventType);

          return {
            ...t,
            nodeId: t.trigger_id || `trg_${eventType}_${idx}`, // UI identity
            event_type: eventType,
            key: eventType, // giữ để lookup catalog (không dùng làm identity)
            icon: cat?.icon || getTriggerIcon(eventType),
            label: cat?.label || eventType || "Trigger",
            description: cat?.description || "",
            payload_schema: cat?.payload_schema || {}, // chỉ để hiển thị, không edit
            enabled: t.is_active ?? t.enabled ?? true,
          };
        })
        : []
    );

    setActions(
      Array.isArray(automation.actions)
        ? [...automation.actions]
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((a, idx) => {
            const actionType = a.action_type || a.key;
            const cat = actionCatalog.find((i) => i.key === actionType);

            // Clean up 'config' key and ensure 'content' is used
            const { config, ...rest } = a; // Destructure to remove 'config' if it exists

            return {
              ...rest, // Use rest to include all other properties
              nodeId: a.action_id || `act_${actionType}_${idx}`, // UI identity
              action_type: actionType,
              key: actionType, // giữ để lookup catalog
              icon: cat?.icon || getActionIcon(actionType),
              label: cat?.label || actionType || "Action",
              content: a.content || config || {}, // Prioritize a.content, fallback to config, then empty object
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

  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null); // "trigger" | "action"

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event, type) => {
    setActiveId(event.active.id);
    setActiveType(type);
  };

  const handleDragEnd = (event, type) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over || active.id === over.id) return;

    if (type === "trigger") {
      setTriggers((items) => {
        const oldIndex = items.findIndex((i) => i.nodeId === active.id);
        const newIndex = items.findIndex((i) => i.nodeId === over.id);
        const next = arrayMove(items, oldIndex, newIndex);
        return next.map((t, idx) => ({ ...t, order_index: idx }));
      });
    } else {
      setActions((items) => {
        const oldIndex = items.findIndex((i) => i.nodeId === active.id);
        const newIndex = items.findIndex((i) => i.nodeId === over.id);
        const next = arrayMove(items, oldIndex, newIndex);
        return next.map((a, idx) => ({ ...a, order_index: idx }));
      });
    }
    setSaved(false);
  };

  const filteredTriggerCatalog = useMemo(() => {
    const q = qTrigger.trim().toLowerCase();
    const src = eventCatalog;
    return q
      ? src.filter((i) => (i.label || "").toLowerCase().includes(q))
      : src;
  }, [qTrigger, eventCatalog]);

  const filteredActionCatalog = useMemo(() => {
    const q = qAction.trim().toLowerCase();
    const src = actionCatalog;
    return q
      ? src.filter((i) => (i.label || "").toLowerCase().includes(q))
      : src;
  }, [qAction, actionCatalog]);

  const currentTrigger = useMemo(
    () =>
      selected?.type === "trigger"
        ? triggers.find((t) => t.nodeId === selected.nodeId) || null
        : null,
    [triggers, selected]
  );
  const currentAction = useMemo(
    () =>
      selected?.type === "action"
        ? actions.find((a) => a.nodeId === selected.nodeId) || null
        : null,
    [actions, selected]
  );

  // Common handlers
  const handleFieldChange = (field, value) => {
    setAutomation((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  // Tabs guard
  const goSetupGuard = () => {
    if (!automation?.flow_id) return;
    setActiveTab("setup");
  };

  // ACTIONS
  const toggleTrigger = (nodeId) => {
    setTriggers((prev) =>
      prev.map((t) => (t.nodeId === nodeId ? { ...t, enabled: !t.enabled } : t))
    );
    setSaved(false);
  };

  const addTrigger = (item) => {
    const nodeId = makeNodeId();
    setTriggers((prev) => [
      ...prev,
      {
        nodeId,
        trigger_id: null,
        event_type: item.key,
        key: item.key,
        icon: item.icon,
        label: item.label,
        description: item.description,
        payload_schema: item.payload_schema || {}, // read-only
        conditions: item.default_conditions || {},
        enabled: true,
        is_active: true,
      },
    ]);
    setSelected({ type: "trigger", nodeId });
    setShowTriggerPicker(false);
    setQTrigger("");
    setSaved(false);
  };


  const deleteTrigger = (nodeId) => {
    setTriggers((prev) => prev.filter((t) => t.nodeId !== nodeId));
    if (selected?.type === "trigger" && selected.nodeId === nodeId) setSelected(null);
    setSaved(false);
  };

  const addAction = (item) => {
    const nodeId = makeNodeId();
    const action_type = item.key;

    const base = {
      nodeId,
      action_id: null,
      trigger_id: null,
      action_type,
      key: action_type,
      icon: item.icon,
      label: item.label,
      channel:
        item.default_channel ||
        (action_type === "send_email" ? "email" : undefined),
      content: item.default_content || {},
      order_index: actions.length,
      delay_minutes: 0,
    };

    if (action_type === "send_email") {
      base.content = { subject: "", body: "", ...(base.content || {}) };
    }

    setActions((prev) => [...prev, base]);
    setSelected({ type: "action", nodeId });
    setShowActionPicker(false);
    setQAction("");
    setSaved(false);
  };

  const deleteAction = (nodeId) => {
    setActions((prev) => prev.filter((a) => a.nodeId !== nodeId));
    if (selected?.type === "action" && selected.nodeId === nodeId) setSelected(null);
    setSaved(false);
  };

  // update email config (subject/body)
  const updateEmailConfig = (patch) => {
    if (!currentAction) return;
    setActions((prev) =>
      prev.map((a) =>
        a.nodeId === currentAction.nodeId
          ? { ...a, content: { ...(a.content || {}), ...patch } }
          : a
      )
    );
    setSaved(false);
  };

  // update trigger config
  const updateTriggerConfig = (patch) => {
    if (!currentTrigger) return;
    setTriggers((prev) =>
      prev.map((t) =>
        t.nodeId === currentTrigger.nodeId
          ? { ...t, conditions: patch } // ✅ conditions là object (không merge lung tung)
          : t
      )
    );
    setSaved(false);
  };

  // update action config (generic)
  const updateActionConfig = (patch) => {
    if (!currentAction) return;
    setActions((prev) =>
      prev.map((a) =>
        a.nodeId === currentAction.nodeId
          ? { ...a, content: { ...(a.content || {}), ...patch } }
          : a
      )
    );
    setSaved(false);
  };

  //API handlers

  // 1) Tạo flow rồi chuyển sang tab "Thiết lập"
  const handleCreateFlowThenSetup = async () => {
    try {
      const body = {
        name: (automation?.name || "").trim(),
        description: (automation?.description || "").trim(),
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
      setAutomation((prev) => ({
        ...prev,
        flow_id: newId,
        updated_at: new Date().toISOString(),
      }));
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
          enabled: automation?.enabled ?? true,
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
          enabled: automation?.enabled ?? true,
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
    const act = actions.find((a) => a.key === selected.key);
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
      const subject =
        res?.data?.subject ||
        res?.subject ||
        res?.result?.subject ||
        "Ưu đãi dành cho bạn";
      const body = res?.data?.body || res?.body || res?.result?.body || "";
      setActions((prev) =>
        prev.map((a) =>
          a.key === "send_email"
            ? { ...a, config: { ...(a.config || {}), subject, body } }
            : a
        )
      );
      setSaved(false);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Gen AI thất bại");
    }
  };

  // options dropdown
  const statusOptions = [
    { value: "ACTIVE", label: "Đang chạy" },
    { value: "DRAFT", label: "Bản nháp" },
    { value: "INACTIVE", label: "Ngưng hoạt động" },
  ];

  // Picker dialog content for triggers
  const TriggerPickerContent = (
    <div className="p-2">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Tìm kiếm chiến dịch..."
          value={qTrigger}
          onChange={(e) => setQTrigger(e.target.value)}
          className="pl-9 pr-3 py-2 w-full"
        />
      </div>
      <div className="max-h-96 overflow-auto pr-1">
        {filteredTriggerCatalog.map((it) => (
          <button
            key={it.key}
            onClick={() => addTrigger(it)}
            className="cursor-pointer w-full flex items-start justify-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
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
        {filteredTriggerCatalog.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            Không tìm thấy Trigger phù hợp
          </div>
        )}
      </div>
    </div>
  );

  // Picker dialog content for actions
  const ActionPickerContent = (
    <div className="p-2">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Tìm kiếm chiến dịch..."
          value={qAction}
          onChange={(e) => setQAction(e.target.value)}
          className="pl-9 pr-3 py-2 w-full"
        />
      </div>
      <div className="max-h-96 overflow-auto pr-1">
        {filteredActionCatalog.map((it) => (
          <button
            key={it.key}
            onClick={() => addAction(it)}
            className="cursor-pointer w-full flex items-start justify-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
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
        {filteredActionCatalog.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            Không tìm thấy Hành động phù hợp
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <div className="my-3 z-20 p-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between mb-4">
          {/* Left: Title */}
          <div className="flex items-center gap-2 w-full lg:justify-start">
            <Button
              variant="actionNormal"
              onClick={() => navigate("/automations")}
              className="mr-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {automation?.name || "Tên automation"}
            </h1>
          </div>
          {/* Right: Status & Save */}
          <div className="flex flex-col gap-2 w-full lg:flex-row lg:items-center lg:gap-3 lg:w-auto">
            <div className="flex w-full gap-1.5 text-sm justify-end">
              <Badge
                variant="status"
                className={cn("w-28", saved ? "border-emerald-500" : "border-amber-500")}
              >
                {saved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                <span className={saved ? "text-emerald-700" : "text-amber-700"}>
                  {saved ? "Đã lưu" : "Có thay đổi"}
                </span>
              </Badge>
            </div>
            <Button
              variant="actionCreate"
              onClick={handleSaveSetup}
              disabled={!automation?.flow_id}
              title={!automation?.flow_id ? "Tạo flow trước" : "Lưu thiết lập"}
              className="w-full lg:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu thiết lập
            </Button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex items-start w-full gap-0">
          <Button
            variant={activeTab === "info" ? "actionCreate" : "actionNormal"}
            onClick={() => setActiveTab("info")}
            className="flex-1 rounded-none rounded-tl-sm rounded-bl-sm"
          >
            <Info className="w-4 h-4" />
            Thông tin chung
          </Button>
          <Button
            variant={activeTab === "setup" ? "actionCreate" : "actionNormal"}
            disabled={!automation?.flow_id}
            onClick={goSetupGuard}
            className="flex-1 rounded-none rounded-tr-sm rounded-br-sm"
          >
            <Settings2 className="w-4 h-4" />
            Thiết lập Trigger & Action
          </Button>
        </div>
      </div>
      {/* Tab content */}
      <div className="py-6">
        {activeTab === "info" ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên automation
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={automation?.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={automation?.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={automation?.type || ""}
                  onChange={(e) => handleFieldChange("type", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <DropdownOptions
                  options={statusOptions}
                  value={automation?.status || ""}
                  onChange={(v) => handleFieldChange("status", v)}
                  placeholder="Chọn trạng thái"
                  width="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={
                    Array.isArray(automation?.tags)
                      ? automation.tags.join(", ")
                      : ""
                  }
                  onChange={(e) =>
                    handleFieldChange(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="tag1, tag2, ..."
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <label className="text-sm font-medium text-gray-700">
                  Kích hoạt
                </label>
                <Toggle
                  checked={!!automation?.enabled}
                  onChange={(v) => handleFieldChange("enabled", v)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người tạo
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={automation?.created_by || ""}
                  onChange={(e) =>
                    handleFieldChange("created_by", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Info actions */}
            <div className="mt-4 flex gap-2">
              {!automation?.flow_id ? (
                <Button
                  variant="actionUpdate"
                  onClick={handleCreateFlowThenSetup}
                >
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
                title={
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-gray-900 text-base md:text-lg">
                      Trigger
                    </span>
                    <Button
                      variant="actionCreate"
                      size="icon"
                      onClick={() => setShowTriggerPicker(true)}
                      title="Thêm Trigger"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                }
                subtitle="Sự kiện sẽ kích hoạt kịch bản flow"
              >
                {triggers.length === 0 && (
                  <div className="text-sm text-gray-500 border rounded-xl p-3">
                    Chưa có trigger. Nhấn "+" để chọn.
                  </div>
                )}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(e) => handleDragStart(e, "trigger")}
                  onDragEnd={(e) => handleDragEnd(e, "trigger")}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={triggers.map(t => t.nodeId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {triggers.map((t) => (
                      <SortableBlock
                        key={t.nodeId}
                        id={t.nodeId}
                        icon={t.icon}
                        label={t.label}
                        active={selected?.type === "trigger" && selected?.nodeId === t.nodeId}
                        onClick={() => setSelected({ type: "trigger", nodeId: t.nodeId })}
                        right={
                          <div className="flex items-center gap-2">
                            <Toggle checked={!!t.enabled} onChange={() => toggleTrigger(t.nodeId)} />
                            <Button
                              variant="actionDelete"
                              size="icon"
                              title="Xoá Trigger"
                              onClick={(e) => { e.stopPropagation(); deleteTrigger(t.nodeId); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        }
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay adjustScale={false}>
                    {activeId && activeType === "trigger" ? (
                      <div className="scale-105 shadow-2xl rounded-xl cursor-grabbing">
                        <Block
                          label={triggers.find(t => t.nodeId === activeId)?.label}
                          icon={triggers.find(t => t.nodeId === activeId)?.icon}
                          isDragging
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </Section>

              <Section
                title={
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-gray-900 text-base md:text-lg">
                      Action
                    </span>
                    <Button
                      variant="actionCreate"
                      size="icon"
                      onClick={() => setShowActionPicker(true)}
                      className="ml-2"
                      title="Thêm hành động"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                }
                subtitle="Thao tác cụ thể trong kịch bản flow"
              >
                {actions.length === 0 && (
                  <div className="text-sm text-gray-500 border rounded-xl p-3">
                    Chưa có hành động. Nhấn "+" để chọn.
                  </div>
                )}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(e) => handleDragStart(e, "action")}
                  onDragEnd={(e) => handleDragEnd(e, "action")}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={actions.map(a => a.nodeId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {actions.map((a) => (
                      <SortableBlock
                        key={a.nodeId}
                        id={a.nodeId}
                        icon={a.icon}
                        label={a.label}
                        active={selected?.type === "action" && selected?.nodeId === a.nodeId}
                        onClick={() => setSelected({ type: "action", nodeId: a.nodeId })}
                        right={
                          <div className="flex items-center gap-2">
                            <Button
                              variant="actionDelete"
                              size="icon"
                              title="Xoá Action"
                              onClick={(e) => { e.stopPropagation(); deleteAction(a.nodeId); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        }
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay adjustScale={false}>
                    {activeId && activeType === "action" ? (
                      <div className="scale-105 shadow-2xl rounded-xl cursor-grabbing">
                        <Block
                          label={actions.find(a => a.nodeId === activeId)?.label}
                          icon={actions.find(a => a.nodeId === activeId)?.icon}
                          isDragging
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
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
                updateTriggerConfig={updateTriggerConfig}
                updateActionConfig={updateActionConfig}
                onGenEmailAI={handleGenEmailAI}
                actionTypes={actionCatalog}
              />
            </div>
          </div>
        )}
      </div>

      {/* Trigger Picker Dialog */}
      <AppDialog
        open={showTriggerPicker}
        onClose={() => setShowTriggerPicker(false)}
        title="Chọn Trigger"
        mode="view"
        FormComponent={() => TriggerPickerContent}
        maxWidth="sm:max-w-md"
      />

      {/* Action Picker Dialog */}
      <AppDialog
        open={showActionPicker}
        onClose={() => setShowActionPicker(false)}
        title="Chọn hành động"
        mode="view"
        FormComponent={() => ActionPickerContent}
        maxWidth="sm:max-w-md"
      />
    </div>
  );
}

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
