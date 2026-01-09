import React, { useEffect, useState } from 'react';
import { Target, Eye, Edit, Trash2, DollarSign, TrendingUp, Users, Plus, RefreshCw } from 'lucide-react';
import CountUp from 'react-countup';
import { Button } from '@/components/ui/button';
import AppDialog from '@/components/dialogs/AppDialog';
import DealForm from '@/pages/deal/components/DealForm';
import { formatCurrency, getPriorityColor, getPriorityLabel, formatDate } from '@/utils/helper';
import DropdownOptions from '@/components/common/DropdownOptions';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';
import AppPagination from '@/components/pagination/AppPagination';
import { getAllleads, getPipelineMetrics, getLeadDetailsById, getPipelineColumns, rescoreLead } from '@/services/leads';

// Replace STATUS_META with localized labels and include "new"
const STATUS_META = {
  new: { label: "NEW", bg: "bg-blue-100", text: "text-blue-700" },
  contacted: { label: "CONTACTED", bg: "bg-yellow-100", text: "text-yellow-700" },
  qualified: { label: "QUALIFIED", bg: "bg-purple-100", text: "text-purple-700" },
  nurturing: { label: "NURTURING", bg: "bg-orange-100", text: "text-orange-700" },
  converted: { label: "CONVERTED", bg: "bg-green-100", text: "text-green-700" },
  closed_lost: { label: "CLOSED_LOST", bg: "bg-red-100", text: "text-red-700" },
};

const FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...Object.entries(STATUS_META).map(([value, v]) => ({ value, label: v.label })),
];

export default function LeadsPage({ showHeader = true, externalFilterStatus, onFilterChange }) {

  const [leads, setLeads] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState({ open: false, mode: 'view', deal: null, loading: false });
  const [hoveredRow, setHoveredRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    conversionRate: 0,
    activeDeals: 0,
  });
  const [prevStats, setPrevStats] = useState(stats);
  const [shouldAnimateStats, setShouldAnimateStats] = useState(true);

  const dealsPerPage = 8;

  // controlled vs uncontrolled filter
  const isControlledFilter = externalFilterStatus !== undefined;
  const effectiveFilterStatus = isControlledFilter ? externalFilterStatus : filterStatus;
  const handleFilterChange = (v) => {
    if (onFilterChange) onFilterChange(v);
    if (!isControlledFilter) setFilterStatus(v);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getPipelineMetrics();
        const d = res?.data || res;
        if (!mounted || !d) return;

        const newStats = {
          totalDeals: d.totalDeals ?? 0,
          totalValue: d.totalValue ?? 0,
          conversionRate: d.conversionRate ?? 0,
          activeDeals: d.processingLeads ?? 0,
        };

        setStats(newStats);
        setShouldAnimateStats(true);

        setTimeout(() => {
          setPrevStats(newStats);
          setShouldAnimateStats(false);
        }, 600);
      } catch (e) {
        console.error('Load metrics failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load leads from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAllleads();
        if (!mounted) return;
        setLeads(Array.isArray(data) ? data : []);
        setError(null);
      } catch (e) {
        if (Array.isArray(e?.data)) setLeads(e.data);
        else setError(e?.message || 'Không thể tải danh sách leads');
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Reset page khi đổi filter (use effectiveFilterStatus)
  useEffect(() => setCurrentPage(1), [effectiveFilterStatus, leads.length]);

  // normalize status key to lowercase when resolving meta
  const getStatusBadge = (status) => {
    const key = (status || "").toString().toLowerCase();
    const meta = STATUS_META[key];
    if (!meta)
      return <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs">-</span>;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full w-[90px] text-center inline-block ${meta.bg} ${meta.text}`}
      >
        {meta.label}
      </span>
    );
  };

  const handleView = async (lead) => {
    setModal({ open: true, mode: 'view', deal: lead, loading: true });

    try {
      const res = await getLeadDetailsById(lead.lead_id);
      const detailData = res?.data?.data ?? res?.data ?? res;

      if (detailData) {
        const normalizeStatus = (s) => {
          const v = (s || '').toLowerCase();
          return ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed_lost'].includes(v)
            ? v
            : 'new';
        };

        const asNumber = (x, fb = 0) => {
          if (x === null || x === undefined) return fb;
          const n = typeof x === 'string' ? parseFloat(x) : x;
          return Number.isFinite(n) ? n : fb;
        };

        const enrichedDeal = {
          id: detailData.lead_id,
          title: detailData.deal_name || detailData.name || lead.deal_name,
          name: detailData.name || lead.name,
          email: detailData.email || lead.email,
          phone: detailData.phone || lead.phone,
          source: detailData.source || lead.source,
          stage: normalizeStatus(detailData.status),
          status: normalizeStatus(detailData.status),
          createdDate: (detailData.created_at || lead.created_at || '').slice(0, 10),
          lastActivity: (detailData.updated_at || detailData.created_at || lead.updated_at || '').slice(0, 10),
          value: asNumber(detailData.predicted_value, lead.predicted_value || 0),
          currency: detailData.predicted_value_currency || 'VND',
          priority: detailData.priority || lead.priority || 'medium',
          leadScore: asNumber(detailData.lead_score, 0),
          conversionProb: detailData.conversion_prob ?? 0,
          tags: Array.isArray(detailData.tags) ? detailData.tags : [],
          productInterest: detailData.product_interest || '',
          assignee: detailData.assignee_name || 'Chưa phân công',
          assigneeId: detailData.assigned_to || null,
          notes: detailData.notes || '',
          aiReason: detailData.ai_reason || '',
          predictedProb: detailData.predicted_prob ?? 0,
          mlConversionProb: detailData.ml_conversion_prob ?? 0,
          mlPredictedValue: asNumber(detailData.ml_predicted_value, 0),
          mlLastScoredAt: detailData.ml_last_scored_at || null,
          mlModelVersion: detailData.ml_model_version || null,
          productInterests: detailData.product_interests || [],
          interactions: detailData.interactions || [],
          anonId: detailData.anon_id || null,
          campaignId: detailData.campaign_id || null,
        };

        setModal({ open: true, mode: 'view', deal: enrichedDeal, loading: false });
      } else {
        setModal({ open: true, mode: 'view', deal: lead, loading: false });
      }
    } catch (err) {
      console.error('Failed to load lead details:', err);
      setModal({ open: true, mode: 'view', deal: lead, loading: false });
    }
  };

  const handleEdit = async (lead) => {
    setModal({ open: true, mode: 'edit', deal: lead, loading: true });

    try {
      const res = await getLeadDetailsById(lead.lead_id);
      const detailData = res?.data?.data ?? res?.data ?? res;

      if (detailData) {
        const normalizeStatus = (s) => {
          const v = (s || '').toLowerCase();
          return ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed_lost'].includes(v)
            ? v
            : 'new';
        };

        const asNumber = (x, fb = 0) => {
          if (x === null || x === undefined) return fb;
          const n = typeof x === 'string' ? parseFloat(x) : x;
          return Number.isFinite(n) ? n : fb;
        };

        const enrichedDeal = {
          id: detailData.lead_id,
          title: detailData.deal_name || detailData.name || lead.deal_name,
          name: detailData.name || lead.name,
          email: detailData.email || lead.email,
          phone: detailData.phone || lead.phone,
          source: detailData.source || lead.source,
          stage: normalizeStatus(detailData.status),
          status: normalizeStatus(detailData.status),
          createdDate: (detailData.created_at || lead.created_at || '').slice(0, 10),
          lastActivity: (detailData.updated_at || detailData.created_at || lead.updated_at || '').slice(0, 10),
          value: asNumber(detailData.predicted_value, lead.predicted_value || 0),
          currency: detailData.predicted_value_currency || 'VND',
          priority: detailData.priority || lead.priority || 'medium',
          leadScore: asNumber(detailData.lead_score, 0),
          conversionProb: detailData.conversion_prob ?? 0,
          tags: Array.isArray(detailData.tags) ? detailData.tags : [],
          productInterest: detailData.product_interest || '',
          assignee: detailData.assignee_name || 'Chưa phân công',
          assigneeId: detailData.assigned_to || null,
          notes: detailData.notes || '',
          aiReason: detailData.ai_reason || '',
          predictedProb: detailData.predicted_prob ?? 0,
          mlConversionProb: detailData.ml_conversion_prob ?? 0,
          mlPredictedValue: asNumber(detailData.ml_predicted_value, 0),
          mlLastScoredAt: detailData.ml_last_scored_at || null,
          mlModelVersion: detailData.ml_model_version || null,
          productInterests: detailData.product_interests || [],
          interactions: detailData.interactions || [],
          anonId: detailData.anon_id || null,
          campaignId: detailData.campaign_id || null,
        };

        setModal({ open: true, mode: 'edit', deal: enrichedDeal, loading: false });
      } else {
        setModal({ open: true, mode: 'edit', deal: lead, loading: false });
      }
    } catch (err) {
      console.error('Failed to load lead details:', err);
      setModal({ open: true, mode: 'edit', deal: lead, loading: false });
    }
  };

  const handleCreate = () => setModal({ open: true, mode: 'edit', deal: null, loading: false });
  const closeModal = () => setModal({ open: false, mode: 'view', deal: null, loading: false });

  const handleSave = async (dealData) => {
    if (dealData.id && !dealData.shouldRefresh) {
      // Updated existing lead - refresh data and switch to view mode
      try {
        const res = await getLeadDetailsById(dealData.id);
        const detailData = res?.data?.data ?? res?.data ?? res;

        if (detailData) {
          const normalizeStatus = (s) => {
            const v = (s || '').toLowerCase();
            return ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed_lost'].includes(v)
              ? v
              : 'new';
          };

          const asNumber = (x, fb = 0) => {
            if (x === null || x === undefined) return fb;
            const n = typeof x === 'string' ? parseFloat(x) : x;
            return Number.isFinite(n) ? n : fb;
          };

          const enrichedDeal = {
            lead_id: detailData.lead_id,
            id: detailData.lead_id,
            title: detailData.deal_name || detailData.name || dealData.title,
            deal_name: detailData.deal_name || detailData.name,
            name: detailData.name || dealData.name,
            email: detailData.email || dealData.email,
            phone: detailData.phone || dealData.phone,
            source: detailData.source || dealData.source,
            stage: normalizeStatus(detailData.status),
            status: normalizeStatus(detailData.status),
            created_at: detailData.created_at || dealData.createdDate,
            createdDate: (detailData.created_at || dealData.createdDate || '').slice(0, 10),
            updated_at: detailData.updated_at || detailData.created_at,
            lastActivity: (detailData.updated_at || detailData.created_at || dealData.lastActivity || '').slice(0, 10),
            predicted_value: asNumber(detailData.predicted_value, dealData.value || 0),
            value: asNumber(detailData.predicted_value, dealData.value || 0),
            currency: detailData.predicted_value_currency || 'VND',
            priority: detailData.priority || dealData.priority || 'medium',
            leadScore: asNumber(detailData.lead_score, dealData.leadScore || 0),
            lead_score: asNumber(detailData.lead_score, 0),
            conversionProb: detailData.conversion_prob ?? dealData.conversionProb ?? 0,
            conversion_prob: detailData.conversion_prob ?? 0,
            tags: Array.isArray(detailData.tags) ? detailData.tags : (dealData.tags || []),
            productInterest: detailData.product_interest || dealData.productInterest,
            product_interest: detailData.product_interest,
            assignee: detailData.assignee_name || dealData.assignee || 'Chưa phân công',
            assignee_name: detailData.assignee_name,
            assigneeId: detailData.assigned_to || dealData.assigneeId || null,
            assigned_to: detailData.assigned_to,
            notes: detailData.notes || dealData.notes || '',
            aiReason: detailData.ai_reason || dealData.aiReason || '',
            ai_reason: detailData.ai_reason,
            predictedProb: detailData.predicted_prob ?? dealData.predictedProb ?? 0,
            mlConversionProb: detailData.ml_conversion_prob ?? dealData.mlConversionProb ?? 0,
            ml_conversion_prob: detailData.ml_conversion_prob,
            mlPredictedValue: asNumber(detailData.ml_predicted_value, dealData.mlPredictedValue || 0),
            ml_predicted_value: asNumber(detailData.ml_predicted_value, 0),
            mlLastScoredAt: detailData.ml_last_scored_at || dealData.mlLastScoredAt || null,
            ml_last_scored_at: detailData.ml_last_scored_at,
            mlModelVersion: detailData.ml_model_version || dealData.mlModelVersion || null,
            ml_model_version: detailData.ml_model_version,
            productInterests: detailData.product_interests || [],
            product_interests: detailData.product_interests || [],
            interactions: detailData.interactions || [],
            anonId: detailData.anon_id || null,
            anon_id: detailData.anon_id,
            campaignId: detailData.campaign_id || null,
            campaign_id: detailData.campaign_id,
          };

          // Update leads list in background
          setLeads((prev) =>
            prev.map((l) => (l.lead_id === dealData.id ? enrichedDeal : l))
          );

          // Switch to view mode with updated data
          setModal({ open: true, mode: 'view', deal: enrichedDeal, loading: false });
        } else {
          // Fallback
          setLeads((prev) =>
            prev.map((l) => (l.lead_id === dealData.id ? { ...l, ...dealData } : l))
          );
          setModal({ open: true, mode: 'view', deal: dealData, loading: false });
        }
      } catch (err) {
        console.error('Failed to refresh lead details:', err);
        setLeads((prev) =>
          prev.map((l) => (l.lead_id === dealData.id ? { ...l, ...dealData } : l))
        );
        setModal({ open: true, mode: 'view', deal: dealData, loading: false });
      }
    } else if (dealData.shouldRefresh) {
      // New lead created, refresh the list and close modal
      closeModal();
      try {
        const data = await getAllleads();
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to refresh leads after creating:', err);
      }
    } else {
      // Fallback
      const newLead = {
        ...dealData,
        lead_id: crypto.randomUUID?.() || Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      setLeads((prev) => [newLead, ...prev]);
      toast.success('Thêm lead thành công!');
      closeModal();
    }
  };

  const handleDelete = (lead_id) => {
    setLeads((prev) => prev.filter((d) => d.lead_id !== lead_id));
    closeModal();
    toast.success('Xóa lead thành công!');
  };

  const handleRescore = async (lead) => {
    try {
      toast.info("Đang tính điểm lại...");
      const res = await rescoreLead(lead.lead_id, { trigger: 'manual' });
      if (res?.ok) {
        toast.success("Rescore thành công! (Điểm mới: " + (res.data?.score || 'N/A') + ")");
        // Refresh list or update specific item
        // Just reloading all for simplicity or updating local state if complex
        const updated = await getAllleads(); // Reload entire list to be safe
        if (Array.isArray(updated)) setLeads(updated);
      } else {
        toast.error("Rescore thất bại: " + (res?.error?.message || "Lỗi không xác định"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Lỗi khi rescore: " + e.message);
    }
  };

  const filtered = effectiveFilterStatus ? leads.filter((l) => l.status === effectiveFilterStatus) : leads;
  const totalPages = Math.max(1, Math.ceil(filtered.length / dealsPerPage));
  const current = filtered.slice((currentPage - 1) * dealsPerPage, currentPage * dealsPerPage);
  const handlePageChange = (p) => setCurrentPage(p);
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return (
    <div className="flex flex-col">
      {/* Header + Stats: render only when showHeader is true */}
      {showHeader && (
        <div className=" z-20 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md mb-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900">Khách hàng tiềm năng</h1>
            <div className="flex gap-3">
              <DropdownOptions
                options={FILTER_OPTIONS}
                value={effectiveFilterStatus}
                onChange={handleFilterChange}
                width="w-44"
                placeholder="Lọc trạng thái"
              />
              <Button onClick={handleCreate} variant="actionCreate" className="gap-2">
                <Plus className="w-4 h-4" /> Thêm Deal
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            {/* Tổng Lead */}
            <StatCard
              icon={<Target className="w-4 h-4 text-blue-600" />}
              bg="bg-blue-100"
              label="Tổng Lead"
              value={stats.totalDeals}
              prev={prevStats.totalDeals}
              animate={shouldAnimateStats}
              formatter={(v) => v}
            />

            {/* Tổng giá trị */}
            <StatCard
              icon={<DollarSign className="w-4 h-4 text-green-600" />}
              bg="bg-green-100"
              label="Tổng giá trị"
              value={stats.totalValue}
              prev={prevStats.totalValue}
              animate={shouldAnimateStats}
              formatter={(v) => formatCurrency(Math.floor(v))}
            />

            {/* Tỷ lệ chuyển đổi */}
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
              bg="bg-purple-100"
              label="Tỷ lệ chuyển đổi"
              value={stats.conversionRate}
              prev={prevStats.conversionRate}
              animate={shouldAnimateStats}
              formatter={(v) => `${v.toFixed(1)}%`}
            />

            {/* Leads đang xử lý */}
            <StatCard
              icon={<Users className="w-4 h-4 text-orange-600" />}
              bg="bg-orange-100"
              label="Leads đang xử lý"
              value={stats.activeDeals}
              prev={prevStats.activeDeals}
              animate={shouldAnimateStats}
              formatter={(v) => v}
            />
          </div>
        </div>
      )}

      {/* Table + Pagination (always render) */}
      <div className="flex-1 pt-4">
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Deal',
                    'Khách hàng',
                    'Email',
                    'SĐT',
                    'Giá trị',
                    'Nguồn',
                    'Ngày tạo',
                    'Trạng thái',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-400 py-8">
                      Đang tải…
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={9} className="text-center text-red-500 py-8">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  current.map((lead) => (
                    <tr
                      key={lead.lead_id}
                      className="group hover:bg-gray-50 transition-colors"
                      onMouseEnter={() => setHoveredRow(lead.lead_id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td className="px-6 py-2 text-sm font-medium text-gray-900 truncate">
                        <div className="flex flex-col items-start gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full w-[80px] text-center inline-block ${getPriorityColor(lead.priority)}`}>
                            {getPriorityLabel(lead.priority)}
                          </span>
                          {lead.deal_name || '(Chưa đặt tên deal)'}
                        </div>
                      </td>

                      <td className="px-6 py-2 text-sm text-gray-700 truncate">{lead.name}</td>
                      <td className="px-6 py-2 text-sm text-gray-700 truncate">{lead.email}</td>
                      <td className="px-6 py-2 text-sm text-gray-700 truncate">{lead.phone}</td>
                      <td className="px-6 py-2 text-sm text-emerald-600 font-semibold">
                        {formatCurrency(Math.round(Number(lead.predicted_value || 0)))}
                      </td>
                      <td className="px-6 py-2 text-sm text-gray-700 truncate">
                        {lead.source || '-'}
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-500">
                        {formatDate(lead.created_at) || '-'}
                      </td>
                      <td className="px-6 py-2">{getStatusBadge(lead.status)}</td>
                      <td className="px-6 py-2 text-center w-36">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transform group-hover:-translate-y-1 transition-all duration-200">
                          <Button
                            variant="actionRead"
                            size="icon"
                            onClick={() => handleView(lead)}
                            className="h-8 w-8"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="actionUpdate"
                            size="icon"
                            onClick={() => handleEdit(lead)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="actionRead"
                            size="icon"
                            title="Tính lại điểm (Rescore)"
                            onClick={() => handleRescore(lead)}
                            className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <ConfirmDialog
                            title="Xác nhận xóa"
                            description={
                              <>
                                Bạn có chắc chắn muốn xóa lead{' '}
                                <span className="font-semibold">
                                  {lead.deal_name || lead.name}
                                </span>
                                ?
                              </>
                            }
                            confirmText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => handleDelete(lead.lead_id)}
                          >
                            <Button variant="actionDelete" size="icon" className="h-8 w-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </ConfirmDialog>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-400 py-8">
                      Không có lead nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4">
          <AppPagination
            totalPages={totalPages}
            currentPage={currentPage}
            handleNext={handleNext}
            handlePrev={handlePrev}
            handlePageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Dialog */}
      <AppDialog
        open={modal.open}
        onClose={closeModal}
        title={{
          view: `Chi tiết lead - ${modal.deal?.title || modal.deal?.deal_name || modal.deal?.name || ''}`,
          edit: modal.deal
            ? `Chỉnh sửa lead - ${modal.deal.title || modal.deal.deal_name || modal.deal.name}`
            : 'Thêm lead mới',
        }}
        mode={modal.mode}
        FormComponent={DealForm}
        data={modal.deal}
        loading={modal.loading}
        onSave={handleSave}
        onDelete={(id) => handleDelete(id)}
        setMode={(newMode) => {
          setModal(prev => ({ ...prev, mode: newMode }));
        }}
        maxWidth="sm:max-w-3xl"
      />
    </div>
  );
}

function StatCard({ icon, bg, label, value, prev, animate, formatter }) {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3">
      <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        {animate ? (
          <CountUp
            end={value}
            start={prev}
            duration={0.6}
            decimals={label.includes('Tỷ lệ') ? 1 : 0}
            suffix={label.includes('Tỷ lệ') ? '%' : ''}
            formattingFn={formatter}
            className="text-lg font-bold text-gray-900"
          />
        ) : (
          <p className="text-lg font-bold text-gray-900">{formatter(value)}</p>
        )}
      </div>
    </div>
  );
}
