import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { suggest_marketing_campaign, created } from '@/services/campaign';
import { ChevronDown, Edit, Save, Trash2, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { CampaignTypeList, CampaignStatusList, mockEmployees } from "@/lib/data";

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

  const [performance, setPerformance] = useState({
    reach: "",
    openRate: "",
    clickRate: "",
    newLeads: "",
    actualCost: "",
    revenue: "",
    roi: "",
  });

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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
        expectedKPI: data.expectedKPI || (data.expected_kpi ? JSON.stringify(data.expected_kpi) : ""),
        note: data.note || "",
        summaryReport: data.summaryReport || data.summary_report || "",
        targetFilter: tfUI,
      });

      setProducts(Array.isArray(data.products) ? data.products : []);

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
    setMode?.("view");
  };

  const handleSubmit = () => {
    if (!form.name || form.budget === "") {
      alert("Vui lòng nhập tên chiến dịch và ngân sách");
      return;
    }

    // Prepare performance data
    const performanceData = data?.performance || {};
    Object.entries(performance).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        performanceData[key] = key === "lastUpdated" ? value : Number(value) || value;
      }
    });

    // Normalize expected KPI to object if string JSON
    let expected_kpi = {};
    if (typeof form.expectedKPI === "string" && form.expectedKPI.trim()) {
      try { expected_kpi = JSON.parse(form.expectedKPI); } catch (_) { expected_kpi = { note: form.expectedKPI }; }
    } else if (typeof form.expectedKPI === "object" && form.expectedKPI) {
      expected_kpi = form.expectedKPI;
    }

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

    try {
      const campaign = await created(payload); 
      console.log("Tạo campaign thành công:", campaign);
      alert("Tạo campaign thành công!");
      onSave?.(campaign);
      setMode?.("view");
    } catch (err) {
      console.error("Tạo campaign lỗi:", err);
      alert("Lỗi khi tạo campaign!");
    }

    // If updating, go back to view mode
    if (data?.id || data?.campaign_id) setMode?.("view");
  };

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const handlePerformanceChange = (field) => (e) => setPerformance((prev) => ({ ...prev, [field]: e.target.value }));

  // ✅ NEW: handlers cho targetFilter
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
      setForm((prev) => {
        const next = {
          ...prev,
          name: c.name || prev.name,
          type: c.channel ? capitalize(c.channel) : prev.type,
          budget: c.budget ?? prev.budget,
          startDate: c.start_date || prev.startDate,
          endDate: c.end_date || prev.endDate,
          expectedKPI: c.expected_kpi ? JSON.stringify(c.expected_kpi) : prev.expectedKPI,
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
          <input
            placeholder="Nhập mô tả cho AI (ví dụ: chiến dịch 20/10 cho cửa hàng mỹ phẩm, ngân sách 15tr, kênh IG)"
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={aiLoading}
          />
          <Button type="button" variant="secondary" onClick={fetchAISuggestion} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Gợi ý bằng AI
          </Button>
        </div>
        {aiError && <span className="text-sm text-red-600">{aiError}</span>}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Campaign Info */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tên chiến dịch</label>
              <input
                disabled={mode === "view"}
                value={form.name}
                onChange={handleChange("name")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập tên chiến dịch"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Kênh / Loại chiến dịch</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                        }`}
                    >
                      <span className="text-sm">{form.type}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {CampaignTypeList.map((type) => (
                      <DropdownMenuItem key={type} onSelect={() => setForm((f) => ({ ...f, type }))}>
                        {type}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="w-40">
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                        }`}
                    >
                      <span className="text-sm">{form.status}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {CampaignStatusList.map((status) => (
                      <DropdownMenuItem key={status} onSelect={() => setForm((f) => ({ ...f, status }))}>
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Ngân sách (VNĐ)</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  value={form.budget}
                  onChange={handleChange("budget")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Đối tượng mục tiêu (ghi chú)</label>
                <input
                  disabled={mode === "view"}
                  value={form.targetAudience}
                  onChange={handleChange("targetAudience")}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Mô tả đối tượng (ghi chú)"
                />
              </div>
            </div>

            {/* ✅ NEW: Target Filter block */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Bộ lọc đối tượng (target_filter)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Tuổi tối thiểu</label>
                    <input
                      disabled={mode === "view"}
                      type="number"
                      value={form.targetFilter.ageMin}
                      onChange={(e) => handleTFChange("ageMin")({ target: { value: clampInt(e.target.value) } })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                      placeholder="18"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Tuổi tối đa</label>
                    <input
                      disabled={mode === "view"}
                      type="number"
                      value={form.targetFilter.ageMax}
                      onChange={(e) => handleTFChange("ageMax")({ target: { value: clampInt(e.target.value) } })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                      placeholder="40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Giới tính (comma)</label>
                  <input
                    disabled={mode === "view"}
                    value={form.targetFilter.genders.join(", ")}
                    onChange={handleTFArrayChange("genders")}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                    placeholder="female, male"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Khu vực (comma)</label>
                  <input
                    disabled={mode === "view"}
                    value={form.targetFilter.locations.join(", ")}
                    onChange={handleTFArrayChange("locations")}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                    placeholder="HCMC, HN"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Sở thích (comma)</label>
                  <input
                    disabled={mode === "view"}
                    value={form.targetFilter.interests.join(", ")}
                    onChange={handleTFArrayChange("interests")}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                    placeholder="skincare, makeup"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Ghi chú target</label>
                  <input
                    disabled={mode === "view"}
                    value={form.targetFilter.note}
                    onChange={handleTFChange("note")}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                    placeholder="Ghi chú thêm cho target"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                <input
                  disabled={mode === "view"}
                  type="date"
                  value={form.startDate}
                  onChange={handleChange("startDate")}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                <input
                  disabled={mode === "view"}
                  type="date"
                  value={form.endDate}
                  onChange={handleChange("endDate")}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Nguồn dữ liệu</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                        }`}
                    >
                      <span className="text-sm">{form.dataSource}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {["Leads", "Customers", "Products", "AI_GENERATED", "MANUAL"].map((source) => (
                      <DropdownMenuItem key={source} onSelect={() => setForm((f) => ({ ...f, dataSource: source }))}>
                        {source}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Người phụ trách</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                        }`}
                    >
                      <span className="text-sm">{form.assignee || "Chọn người phụ trách"}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {mockEmployees.map((employee) => (
                      <DropdownMenuItem
                        key={employee.id}
                        onSelect={() => setForm((f) => ({
                          ...f,
                          assigneeId: employee.id,
                          assignee: employee.name,
                        }))}
                      >
                        {employee.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">KPI kỳ vọng (JSON hoặc mô tả)</label>
              <textarea
                disabled={mode === "view"}
                value={form.expectedKPI}
                onChange={handleChange("expectedKPI")}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                placeholder='Ví dụ: {"leads":1200, "cpl":12500}'
              />
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
                  <Button type="button" variant="outline" onClick={addProduct}>Thêm sản phẩm</Button>
                )}
              </div>
              {products.length === 0 && <p className="text-sm text-gray-500">Chưa có sản phẩm.</p>}
              <div className="space-y-2">
                {products.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      className="col-span-4 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                      placeholder="Tên sản phẩm"
                      value={p.name || ""}
                      disabled={mode === "view"}
                      onChange={(e) => updateProduct(idx, "name", e.target.value)}
                    />
                    <input
                      className="col-span-3 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                      placeholder="Danh mục"
                      value={p.category || ""}
                      disabled={mode === "view"}
                      onChange={(e) => updateProduct(idx, "category", e.target.value)}
                    />
                    <input
                      type="number"
                      className="col-span-2 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                      placeholder="Giá hiện tại"
                      value={p.price_current ?? ""}
                      disabled={mode === "view"}
                      onChange={(e) => updateProduct(idx, "price_current", e.target.value)}
                    />
                    <input
                      className="col-span-10 md:col-span-2 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                      placeholder="Mã/ID"
                      value={p.product_id || ""}
                      disabled={mode === "view"}
                      onChange={(e) => updateProduct(idx, "product_id", e.target.value)}
                    />
                    {mode !== "view" && (
                      <Button type="button" variant="ghost" onClick={() => removeProduct(idx)}>
                        Xóa
                      </Button>
                    )}
                    <div className="col-span-12">
                      <input
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                        placeholder="Lý do đề xuất / ghi chú"
                        value={p.reason || ""}
                        disabled={mode === "view"}
                        onChange={(e) => updateProduct(idx, "reason", e.target.value)}
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
                  <input
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
                <input
                  disabled={mode === "view"}
                  type="date"
                  value={performance.lastUpdated || new Date().toISOString().split("T")[0]}
                  onChange={handlePerformanceChange("lastUpdated")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex justify-end gap-3">
          {mode === "view" ? (
            <>
              <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <Button variant="actionDelete" onClick={() => onDelete?.(data?.id || data?.campaign_id)}>
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} variant="actionUpdate">
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </Button>
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
