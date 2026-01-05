import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DropdownOptions from "@/components/common/DropdownOptions";
import DropdownWithSearch from "@/components/common/DropdownWithSearch";
import { suggest_marketing_campaign, created, updated } from '@/services/campaign';
import { getProducts } from '@/services/products';
import { Edit, Save, Trash2, TrendingUp, Sparkles, Loader2, Plus } from "lucide-react";
import { CampaignTypeList, CampaignStatusList, mockEmployees } from "@/lib/data";
import { Input } from "@/components/ui/input";
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listCampaignChannels } from '@/services/campaign';
import AddChannelDialog from "./AddChannelDialog";
import MapFlowDialog from "./MapFlowDialog";
import { Settings } from "lucide-react";
import PermissionGuard from "@/components/auth/PermissionGuard";

/**
 * UPDATED: MarketingForm
 * - Thêm UI cho target_filter (age, gender[], locations[], interests[], note)
 * - Nhận target_filter + data_source từ AI và render vào form
 * - Map target_filter -> payload backend
 */
export function MarketingForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  onClose,
  setMode,
}) {
  const [form, setForm] = useState({
    name: "",
    type: "Email", // UI "type" maps to backend "channel"
    budget: "",
    startDate: "",
    endDate: "",
    targetAudience: "", // giữ để làm note cho target_filter
    dataSource: "Customers",
    status: "Draft",
    assigneeId: "",
    assignee: "",
    expectedKPI: "", // string or JSON
    note: "",
    summaryReport: "",

    // NEW: targetFilter UI state (chuẩn hóa về dạng UI)
    targetFilter: {
      ageMin: "",
      ageMax: "",
      genders: [],     // ["female","male"]
      locations: [],   // ["HCMC","HN"]
      interests: [],   // ["skincare","makeup"]
      note: "",        // ghi chú thêm
    },
  });

  const [products, setProducts] = useState([]); // [{product_id,name,category,price_current,reason}]
  const [availableProducts, setAvailableProducts] = useState([]); // Danh sách sản phẩm từ API

  const [performance, setPerformance] = useState({
    reach: "",
    openRate: "",
    clickRate: "",
    newLeads: "",
    actualCost: "",
    revenue: "",
    roi: "",
  });

  const [kpi, setKpi] = useState({
    leads: "",
    cpl: "",
    revenue: "",
    roi: "",
    reach: "",
    click_rate: "",
    open_rate: "",
    note: ""
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Channels logic
  const [channels, setChannels] = useState([]);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [mapFlowOpen, setMapFlowOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const fetchChannels = () => {
    const cid = data?.id || data?.campaign_id;
    if (cid) {
      listCampaignChannels(cid).then(res => setChannels(res.items || [])).catch(console.error);
    }
  };
  useEffect(() => { fetchChannels(); }, [data?.id, data?.campaign_id]);

  // Helpers
  const csvToArray = (s) =>
    (s || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const clampInt = (v) => {
    if (v === "" || v === null || v === undefined) return "";
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? "" : String(Math.max(0, n));
  };

  const normalizeTargetFilterFromData = (tf) => {
    // chuyển dữ liệu DB/AI -> state UI
    if (!tf || typeof tf !== "object") {
      return { ageMin: "", ageMax: "", genders: [], locations: [], interests: [], note: "" };
    }
    let ageMin = "", ageMax = "";
    if (tf.age && typeof tf.age === "object") {
      ageMin = tf.age.min != null ? String(tf.age.min) : "";
      ageMax = tf.age.max != null ? String(tf.age.max) : "";
    } else if (typeof tf.age_range === "string" && tf.age_range.includes("-")) {
      const [a, b] = tf.age_range.split("-").map((x) => x.trim());
      ageMin = clampInt(a);
      ageMax = clampInt(b);
    }
    return {
      ageMin,
      ageMax,
      genders: Array.isArray(tf.gender) ? tf.gender : tf.gender ? [String(tf.gender)] : [],
      locations: Array.isArray(tf.locations) ? tf.locations : tf.locations ? [String(tf.locations)] : [],
      interests: Array.isArray(tf.interests) ? tf.interests : tf.interests ? [String(tf.interests)] : [],
      note: tf.note || "",
    };
  };

  const buildTargetFilterForPayload = () => {
    const tf = {};
    const { ageMin, ageMax, genders, locations, interests, note } = form.targetFilter;

    if (ageMin || ageMax) {
      const min = ageMin ? parseInt(ageMin, 10) : undefined;
      const max = ageMax ? parseInt(ageMax, 10) : undefined;
      if (!Number.isNaN(min) || !Number.isNaN(max)) {
        tf.age = {};
        if (!Number.isNaN(min)) tf.age.min = min;
        if (!Number.isNaN(max)) tf.age.max = max;
      }
    }
    if (Array.isArray(genders) && genders.length) tf.gender = genders;
    if (Array.isArray(locations) && locations.length) tf.locations = locations;
    if (Array.isArray(interests) && interests.length) tf.interests = interests;

    // note ưu tiên từ targetFilter.note; fallback form.targetAudience
    const noteFinal = (note || form.targetAudience || "").trim();
    if (noteFinal) tf.note = noteFinal;

    return tf;
  };

  // Hydrate when editing
  useEffect(() => {
    if (data) {
      const tfUI = normalizeTargetFilterFromData(data.target_filter);

      setForm({
        name: data.name || "",
        type: data.type || data.channel || "Email",
        budget: data.budget ?? "",
        startDate: data.startDate || data.start_date || "",
        endDate: data.endDate || data.end_date || "",
        targetAudience: data.targetAudience || (data.target_filter?.note || ""),
        dataSource: data.dataSource || data.data_source || "Customers",
        status: data.status ? capitalize(data.status) : "Draft",
        assigneeId: data.assigneeId || "",
        assignee: data.assignee || "",
        // expectedKPI removed from form state
        note: data.note || "",
        summaryReport: data.summaryReport || data.summary_report || "",
        targetFilter: tfUI,
      });

      // Hydrate KPI
      if (data.expected_kpi || data.expectedKPI) {
        const kSource = data.expected_kpi || (typeof data.expectedKPI === 'object' ? data.expectedKPI : null);
        if (kSource) {
          setKpi({
            leads: kSource.leads || "",
            cpl: kSource.cpl || "",
            revenue: kSource.revenue || "",
            roi: kSource.roi || "",
            reach: kSource.reach || "",
            click_rate: kSource.click_rate || "",
            open_rate: kSource.open_rate || "",
            note: kSource.note || ""
          });
        } else if (typeof data.expectedKPI === 'string') {
          // Try parse if string
          try {
            const parsed = JSON.parse(data.expectedKPI);
            setKpi(prev => ({ ...prev, ...parsed }));
          } catch (e) { }
        }
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
      setImagePreview(data.image || "");
      setImageFile(null);

      if (data.performance) {
        setPerformance({
          reach: data.performance.reach || "",
          openRate: data.performance.openRate || "",
          clickRate: data.performance.clickRate || "",
          newLeads: data.performance.newLeads || "",
          actualCost: data.performance.actualCost || "",
          revenue: data.performance.revenue || "",
          roi: data.performance.roi || "",
        });
      }
    }
  }, [data]);

  const handleCancel = () => {
    if (data) {
      const tfUI = normalizeTargetFilterFromData(data.target_filter);
      setForm({
        name: data.name || "",
        type: data.type || data.channel || "Email",
        budget: data.budget ?? "",
        startDate: data.startDate || data.start_date || "",
        endDate: data.endDate || data.end_date || "",
        targetAudience: data.targetAudience || (data.target_filter?.note || ""),
        dataSource: data.dataSource || data.data_source || "Customers",
        status: data.status ? capitalize(data.status) : "Draft",
        assigneeId: data.assigneeId || "",
        assignee: data.assignee || "",
        expectedKPI: data.expectedKPI || (data.expected_kpi ? JSON.stringify(data.expected_kpi) : ""),
        note: data.note || "",
        summaryReport: data.summaryReport || data.summary_report || "",
        targetFilter: tfUI,
      });
      setProducts(Array.isArray(data.products) ? data.products : []);
    }
    setImagePreview(data?.image || "");
    setImageFile(null);
    setMode?.("view");
    onClose?.(); // Close modal immediately
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log("[MarketingForm] Fetching products from API...");
        const productList = await getProducts();
        console.log("[MarketingForm] Products received:", productList);
        console.log("[MarketingForm] Is array?", Array.isArray(productList));
        console.log("[MarketingForm] Product count:", productList?.length);

        setAvailableProducts(Array.isArray(productList) ? productList : []);
        console.log("[MarketingForm] Available products set successfully");
      } catch (err) {
        console.error("[MarketingForm] Failed to load products:", err);
        toast.error("Không thể tải danh sách sản phẩm");
      }
    };
    loadProducts();
  }, []);

  const handleSubmit = async () => {
    if (!form.name || form.budget === "") {
      toast.error("Vui lòng nhập tên chiến dịch và ngân sách");
      return;
    }

    // Prepare performance data
    const performanceData = data?.performance || {};
    Object.entries(performance).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        performanceData[key] = key === "lastUpdated" ? value : Number(value) || value;
      }
    });



    // KPI Object from State
    const expected_kpi = {};
    Object.entries(kpi).forEach(([k, v]) => {
      if (v !== "" && v !== null) {
        expected_kpi[k] = (k === 'note') ? v : Number(v);
      }
    });

    //Build target_filter từ UI state
    const target_filter = buildTargetFilterForPayload();
    const payload = {
      campaign_id: data?.id || data?.campaign_id, // keep existing if editing
      name: form.name,
      channel: form.type, // map UI type -> backend channel
      budget: Number(form.budget),
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      target_filter,
      data_source: form.dataSource,
      status: (form.status || "draft").toLowerCase(),
      owner_employee_id: form.assigneeId || null,
      expected_kpi,
      products: products, // JSONB array
      note: form.note,
      summary_report: form.summaryReport,
      performance: Object.keys(performanceData).length > 0 ? performanceData : null,
    };

    // Construct FormData if image attached
    let finalPayload = payload;
    if (imageFile) {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          if (typeof v === 'object') fd.append(k, JSON.stringify(v));
          else fd.append(k, v);
        }
      });
      fd.append('image', imageFile);
      finalPayload = fd;
    }

    try {
      let campaign;
      const id = data?.id || data?.campaign_id;
      if (id) {
        campaign = await updated(id, finalPayload);
        console.log("Cập nhật campaign thành công:", campaign);
        toast.success("Cập nhật campaign thành công!");
      } else {
        campaign = await created(finalPayload);
        console.log("Tạo campaign thành công:", campaign);
        toast.success("Tạo campaign thành công!");
      }
      onSave?.(campaign);
      setMode?.("view");
    } catch (err) {
      console.error("Lưu campaign lỗi:", err);
      toast.error("Lỗi khi lưu campaign!");
    }

    // If updating, go back to view mode
    if (data?.id || data?.campaign_id) setMode?.("view");
  };

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const handlePerformanceChange = (field) => (e) => setPerformance((prev) => ({ ...prev, [field]: e.target.value }));

  // NEW: handlers cho targetFilter
  const handleTFChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, targetFilter: { ...prev.targetFilter, [field]: e.target.value } }));

  const handleTFArrayChange = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      targetFilter: { ...prev.targetFilter, [field]: csvToArray(e.target.value) },
    }));

  // --- AI Suggestion ---
  const fetchAISuggestion = async () => {
    const topic = aiPrompt?.trim() || `Tạo cho tôi một Chiến dịch makerting cho ngày 20/10 cho cửa hàng mỹ phẩm của tôi`;
    setAiError("");
    setAiLoading(true);
    try {
      const c = await suggest_marketing_campaign(topic);
      // Map AI response -> UI form state
      // Update KPI from AI
      if (c.expected_kpi) {
        setKpi(prev => ({
          ...prev,
          leads: c.expected_kpi.leads || prev.leads,
          cpl: c.expected_kpi.cpl || prev.cpl,
          revenue: c.expected_kpi.revenue || prev.revenue,
          roi: c.expected_kpi.roi || prev.roi,
          reach: c.expected_kpi.reach || prev.reach,
          click_rate: c.expected_kpi.click_rate || prev.click_rate,
          open_rate: c.expected_kpi.open_rate || prev.open_rate,
          note: c.expected_kpi.note || prev.note
        }));
      }

      setForm((prev) => {
        const next = {
          ...prev,
          name: c.name || prev.name,
          type: c.channel ? capitalize(c.channel) : prev.type,
          budget: c.budget ?? prev.budget,
          startDate: c.start_date || prev.startDate,
          endDate: c.end_date || prev.endDate,
          note: c.note || prev.note,
          summaryReport: c.summary_report || prev.summaryReport,
          dataSource: c.data_source || prev.dataSource,
        };



        // ✅ target_filter từ AI -> UI
        if (c.target_filter && typeof c.target_filter === "object") {
          const tfUI = normalizeTargetFilterFromData(c.target_filter);
          next.targetFilter = tfUI;
          // nếu AI có note cho target -> hiển thị ở ô Đối tượng mục tiêu
          next.targetAudience = c.target_filter.note || prev.targetAudience;
        }
        return next;
      });

      // Recommended products -> products array
      if (Array.isArray(c.recommended_products)) {
        setProducts(c.recommended_products.map((p, idx) => ({
          product_id: p.product_id || null,
          name: p.name || `Sản phẩm #${idx + 1}`,
          category: p.category || null,
          price_current: p.price_current ?? null,
          reason: p.reason || "",
        })));
      }
    } catch (e) {
      setAiError(`Không thể lấy gợi ý từ AI: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const addProduct = () => setProducts((prev) => [...prev, { product_id: null, name: "", category: "", price_current: null, reason: "" }]);
  const removeProduct = (idx) => setProducts((prev) => prev.filter((_, i) => i !== idx));
  const updateProduct = (idx, field, value) => setProducts((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Header AI bar */}
      <div className="border-b bg-white p-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <Input
            variant="normal"
            placeholder="Nhập mô tả cho AI (ví dụ: chiến dịch 20/10 cho cửa hàng mỹ phẩm, ngân sách 15tr, kênh IG)"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={aiLoading}
          />
          <Button variant="actionAI" onClick={fetchAISuggestion} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Gợi ý bằng AI
          </Button>
        </div>
        {aiError && <span className="text-sm text-red-600">{aiError}</span>}
      </div>

      {/* Scrollable Content */}
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="general" className="w-full space-y-6">
          <TabsList className={mode === "view" || !["approved", "configuring", "running"].includes(String(form.status || "").toLowerCase()) ? "hidden" : "grid w-full grid-cols-2 mb-4"}>
            <TabsTrigger value="general">Thông tin</TabsTrigger>
            <TabsTrigger value="channels">Kênh & Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Campaign Info */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tên chiến dịch</label>
                <Input
                  variant="normal"
                  disabled={mode === "view"}
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Nhập tên chiến dịch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Banner Chiến dịch</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Campaign Banner" className="w-24 h-16 object-cover rounded border border-gray-200" />
                  ) : (
                    <div className="w-24 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400 text-xs text-center p-1">
                      Chưa có ảnh
                    </div>
                  )}
                  {mode !== "view" && (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-auto"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Kênh / Loại chiến dịch</label>
                  <DropdownOptions
                    options={CampaignTypeList.map((t) => ({ value: t, label: t }))}
                    value={form.type}
                    onChange={(val) => setForm((f) => ({ ...f, type: val }))}
                    disabled={mode === "view"}
                    width="w-full"
                  />
                </div>

                <div className="w-40">
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <DropdownOptions
                    options={CampaignStatusList.map((s) => ({ value: s, label: s }))}
                    value={form.status}
                    onChange={(val) => setForm((f) => ({ ...f, status: val }))}
                    disabled={mode === "view"}
                    width="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Ngân sách (VNĐ)</label>
                  <Input
                    variant="normal"
                    disabled={mode === "view"}
                    type="number"
                    value={form.budget}
                    onChange={handleChange("budget")}
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Đối tượng mục tiêu (ghi chú)</label>
                  <Input
                    variant="normal"
                    disabled={mode === "view"}
                    value={form.targetAudience}
                    onChange={handleChange("targetAudience")}
                    placeholder="Mô tả đối tượng (ghi chú)"
                  />
                </div>
              </div>

              {/* NEW: Target Filter block */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Bộ lọc đối tượng (target_filter)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="flex gap-2 md:col-span-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Tuổi tối thiểu</label>
                      <Input
                        variant="normal"
                        disabled={mode === "view"}
                        type="number"
                        value={form.targetFilter.ageMin}
                        onChange={(e) => handleTFChange("ageMin")({ target: { value: clampInt(e.target.value) } })}
                        placeholder="18"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Tuổi tối đa</label>
                      <Input
                        variant="normal"
                        disabled={mode === "view"}
                        type="number"
                        value={form.targetFilter.ageMax}
                        onChange={(e) => handleTFChange("ageMax")({ target: { value: clampInt(e.target.value) } })}
                        placeholder="40"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Giới tính (comma)</label>
                    <Input
                      variant="normal"
                      disabled={mode === "view"}
                      value={form.targetFilter.genders.join(", ")}
                      onChange={handleTFArrayChange("genders")}
                      placeholder="female, male"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Khu vực (comma)</label>
                    <Input
                      variant="normal"
                      disabled={mode === "view"}
                      value={form.targetFilter.locations.join(", ")}
                      onChange={handleTFArrayChange("locations")}
                      placeholder="HCMC, HN"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Sở thích (comma)</label>
                    <textarea
                      disabled={mode === "view"}
                      value={form.targetFilter.interests.join(", ")}
                      onChange={handleTFArrayChange("interests")}
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="skincare, makeup"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Ghi chú target</label>
                    <textarea
                      disabled={mode === "view"}
                      value={form.targetFilter.note}
                      onChange={handleTFChange("note")}
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                      placeholder="Ghi chú thêm cho target"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <Input
                    variant="normal"
                    disabled={mode === "view"}
                    type="date"
                    value={form.startDate}
                    onChange={handleChange("startDate")}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <Input
                    variant="normal"
                    disabled={mode === "view"}
                    type="date"
                    value={form.endDate}
                    onChange={handleChange("endDate")}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Nguồn dữ liệu</label>
                  <DropdownOptions
                    options={["Leads", "Customers", "Products", "AI_GENERATED", "MANUAL"].map((s) => ({ value: s, label: s }))}
                    value={form.dataSource}
                    onChange={(val) => setForm((f) => ({ ...f, dataSource: val }))}
                    disabled={mode === "view"}
                    width="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Người phụ trách</label>
                  <DropdownOptions
                    options={mockEmployees.map((emp) => ({ value: emp.id, label: emp.name }))}
                    value={form.assigneeId}
                    onChange={(val) => {
                      const emp = mockEmployees.find((e) => e.id == val);
                      setForm((f) => ({ ...f, assigneeId: val, assignee: emp?.name || f.assignee }));
                    }}
                    disabled={mode === "view"}
                    width="w-full"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <h4 className="font-semibold mb-2">KPI kỳ vọng</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { k: 'leads', l: 'Leads' }, { k: 'cpl', l: 'CPL (VNĐ)' },
                    { k: 'revenue', l: 'Doanh thu' }, { k: 'roi', l: 'ROI (%)' },
                    { k: 'reach', l: 'Tiếp cận' }, { k: 'click_rate', l: 'CTR (%)' },
                    { k: 'open_rate', l: 'Open Rate (%)' }
                  ].map(({ k, l }) => (
                    <div key={k}>
                      <label className="block text-sm font-medium mb-1">{l}</label>
                      <Input
                        variant="normal"
                        disabled={mode === "view"}
                        type="number"
                        value={kpi[k]}
                        onChange={(e) => setKpi(prev => ({ ...prev, [k]: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Ghi chú KPI</label>
                    <Input
                      variant="normal"
                      disabled={mode === "view"}
                      value={kpi.note}
                      onChange={(e) => setKpi(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="Ghi chú thêm..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Ghi chú (note)</label>
                  <textarea
                    disabled={mode === "view"}
                    value={form.note}
                    onChange={handleChange("note")}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Ghi chú thêm cho chiến dịch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tóm tắt (summary)</label>
                  <textarea
                    disabled={mode === "view"}
                    value={form.summaryReport}
                    onChange={handleChange("summaryReport")}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Mô tả ngắn / định hướng nội dung"
                  />
                </div>
              </div>

              {/* PRODUCTS */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Sản phẩm liên quan</h4>
                  {mode !== "view" && (
                    <DropdownWithSearch
                      items={availableProducts}
                      itemKey={(p) => p.product_id ?? p.id}
                      filterFn={(p, s) => (p.name || "").toLowerCase().includes((s || "").toLowerCase())}
                      onSelect={(product) => {
                        const exists = products.find(p => p.product_id === product.product_id);
                        if (exists) {
                          toast.info(`${product.name} đã có trong danh sách`);
                          return;
                        }
                        setProducts(prev => [...prev, {
                          product_id: product.product_id,
                          name: product.name,
                          category: product.category || "",
                          price_current: product.price_current || "",
                          image: product.image || "",
                          reason: ""
                        }]);
                      }}
                      searchPlaceholder="Tìm kiếm sản phẩm..."
                      contentClassName="w-96 max-w-full max-h-72 overflow-y-auto p-2"
                      renderItem={(product) => (
                        <div className="w-full">
                          <div className="flex justify-between items-center">
                            <span className="truncate font-medium">{product.name}</span>
                            <span className="text-xs text-gray-700">
                              {product.price_current ? `${Number(product.price_current).toLocaleString()} VNĐ` : ""}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.category || "Chưa phân loại"}
                          </div>
                        </div>
                      )}
                    >
                      <Button type="button" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm sản phẩm
                      </Button>
                    </DropdownWithSearch>
                  )}
                </div>
                {products.length === 0 && <p className="text-sm text-gray-500">Chưa có sản phẩm.</p>}
                <div className="space-y-2">
                  {products.map((p, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
                      {/* Product Info Header */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name || "S?n ph?m"}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{p.name || "Sản phẩm chưa có tên"}</span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {p.category || "Chưa phân loại"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Mã: <span className="font-mono text-gray-900">{p.product_id || "N/A"}</span></span>
                            <span>Giá: <span className="font-semibold text-green-600">
                              {p.price_current ? `${Number(p.price_current).toLocaleString()} VNĐ` : "Chưa có"}
                            </span></span>
                          </div>
                        </div>
                        {mode !== "view" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(idx)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Reason Field */}
                      <div className="mt-3 pt-3 border-t">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Lý do đề xuất / Ghi chú
                        </label>
                        <textarea
                          disabled={mode === "view"}
                          value={p.reason || ""}
                          onChange={(e) => updateProduct(idx, "reason", e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50 text-sm"
                          placeholder="Nhập lý do đề xuất sản phẩm này cho chiến dịch..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Campaign Performance - Always show */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Hiệu suất chiến dịch</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ["reach", "Số lượng tiếp cận", "0", "number"],
                  ["openRate", "Tỷ lệ mở email (%)", "0.0", "number"],
                  ["clickRate", "Tỷ lệ click (%)", "0.0", "number"],
                  ["newLeads", "Số lead mới", "0", "number"],
                  ["actualCost", "Chi phí thực tế (VNĐ)", "0", "number"],
                  ["revenue", "Doanh thu (VNĐ)", "0", "number"],
                  ["roi", "ROI (%)", "0.0", "number"],
                ].map(([key, label, placeholder, type]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">{label}</label>
                    <Input
                      variant="normal"
                      disabled={mode === "view"}
                      type={type}
                      step={key === "openRate" || key === "clickRate" || key === "roi" ? "0.1" : undefined}
                      value={performance[key]}
                      onChange={handlePerformanceChange(key)}
                      className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày cập nhật cuối</label>
                  <Input
                    variant="normal"
                    disabled={mode === "view"}
                    type="date"
                    value={performance.lastUpdated || new Date().toISOString().split("T")[0]}
                    onChange={handlePerformanceChange("lastUpdated")}
                    className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="channels">
            <div className="p-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm uppercase text-gray-500">Danh sách kênh đã cấu hình</h3>
                <PermissionGuard module="campaign" action="update">
                  <Button onClick={() => setAddChannelOpen(true)} size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" /> Thêm kênh
                  </Button>
                </PermissionGuard>
              </div>
              <div className="space-y-3">
                {channels.map((ch, idx) => (
                  <div key={idx} className="border p-4 rounded-lg flex justify-between items-center bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">{ch.channel}</div>
                        <div className="text-xs text-gray-500">Account: {ch.account_name || "—"}</div>
                        {ch.flow_id ? (
                          <div className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1 inline-block rounded">Flow: {ch.flow_id.slice(0, 8)}...</div>
                        ) : (
                          <div className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1 inline-block rounded italic">Chưa map Flow</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {!ch.flow_id && (
                        <PermissionGuard module="campaign" action="update">
                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 text-xs gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={() => {
                              setSelectedChannelId(ch.channel_id || ch.id);
                              setMapFlowOpen(true);
                            }}
                          >
                            <Settings className="w-3 h-3" /> Cấu hình Flow
                          </Button>
                        </PermissionGuard>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${ch.status === 'active' || ch.status === 'configuring' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {ch.status}
                      </span>
                    </div>
                  </div>
                ))}
                {channels.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-sm text-gray-500">Chưa có kênh nào được cấu hình.</p>
                    <Button variant="link" onClick={() => setAddChannelOpen(true)}>Thêm ngay</Button>
                  </div>
                )}
              </div>
            </div>
            <AddChannelDialog
              open={addChannelOpen}
              onClose={() => setAddChannelOpen(false)}
              campaignId={data?.id || data?.campaign_id}
              onSuccess={fetchChannels}
            />
            <MapFlowDialog
              open={mapFlowOpen}
              onClose={() => setMapFlowOpen(false)}
              channelId={selectedChannelId}
              onSuccess={fetchChannels}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Action Buttons */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex justify-end gap-3">
          {mode === "view" ? (
            <>
              <PermissionGuard module="campaign" action="update">
                <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
              </PermissionGuard>
              <PermissionGuard module="campaign" action="delete">
                <ConfirmDialog
                  title="Xác nhận xóa"
                  description={<>
                    Bạn có chắc chắn muốn xóa chiến dịch <span className="font-semibold text-black">{data?.name}</span>?
                  </>}
                  confirmText="Xóa"
                  cancelText="Hủy"
                  onConfirm={() => onDelete?.(data?.id || data?.campaign_id)}
                >
                  <Button variant="actionDelete">
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </Button>
                </ConfirmDialog>
              </PermissionGuard>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Hủy
              </Button>
              <PermissionGuard module="campaign" action="update">
                <Button
                  onClick={() => {
                    if (typeof onSave === "function") handleSubmit();
                  }}
                  variant="actionUpdate"
                  disabled={typeof onSave !== "function"}
                >
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </Button>
              </PermissionGuard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default MarketingForm;
