import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { triggerOptions, actionOptions } from '@/lib/data';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

export default function AutomationForm({
  mode = 'view',
  data,
  onSave,
  onDelete,
  setMode,
  onClose
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    flow_id: '',
    name: '',
    description: '',
    status: 'DRAFT',
    tags: [],
    enabled: true,
    triggers: [],
    actions: [],
    created_by: '',
    created_at: '',
    updated_at: ''
  });

  useEffect(() => {
    if (data) {
      setForm({
        flow_id: data.flow_id ?? '',
        name: data.name ?? '',
        description: data.description ?? '',
        status: data.status ?? 'DRAFT',
        tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
        enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
        triggers: Array.isArray(data.triggers) ? data.triggers : [],
        actions: Array.isArray(data.actions) ? data.actions : [],
        created_by: data.created_by ?? '',
        created_at: data.created_at ?? '',
        updated_at: data.updated_at ?? ''
      });
    }
  }, [data]);

  const handleChange = (field) => (e) => {
    setForm(prev => ({
      ...prev,
      [field]: e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value
    }));
  };

  const handleTagsChange = (e) => {
    setForm(prev => ({
      ...prev,
      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
    }));
  };

  const handleSaveClick = () => {
    onSave?.({
      ...form,
      updated_at: new Date().toISOString(),
      flow_id: form.flow_id || Math.random().toString(36).slice(2)
    });
    setMode?.('view');
  };

  const handleCancel = () => {
    if (data) {
      setForm({
        flow_id: data.flow_id ?? '',
        name: data.name ?? '',
        description: data.description ?? '',
        status: data.status ?? 'DRAFT',
        tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
        enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
        triggers: Array.isArray(data.triggers) ? data.triggers : [],
        actions: Array.isArray(data.actions) ? data.actions : [],
        created_by: data.created_by ?? '',
        created_at: data.created_at ?? '',
        updated_at: data.updated_at ?? ''
      });
    }
    setMode?.('view');
  };

  // Điều hướng sang FlowEditorPage khi bấm "Chỉnh sửa"
  const handleEdit = () => {
    if (form.flow_id) {
      navigate(`/automation/flow/${form.flow_id}`);
    }
  };

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên Automation</label>
              <input
                disabled={mode === "view"}
                value={form.name}
                onChange={handleChange("name")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-violet-500 disabled:bg-gray-50"
                placeholder="Nhập tên automation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                disabled={mode === "view"}
                value={form.status}
                onChange={handleChange("status")}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500 disabled:bg-gray-50"
              >
                <option value="DRAFT">Bản nháp</option>
                <option value="ACTIVE">Đang chạy</option>
                <option value="PAUSED">Tạm dừng</option>
                <option value="COMPLETED">Hoàn thành</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              disabled={mode === "view"}
              value={form.description}
              onChange={handleChange("description")}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500 disabled:bg-gray-50"
              placeholder="Mô tả ngắn về automation"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (phân cách bởi dấu phẩy)</label>
            <input
              disabled={mode === "view"}
              value={form.tags.join(', ')}
              onChange={handleTagsChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500 disabled:bg-gray-50"
              placeholder="Ví dụ: sinh nhật, khách hàng mới"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kích hoạt</label>
            <select
              disabled={mode === "view"}
              value={form.enabled ? 'true' : 'false'}
              onChange={e => setForm(prev => ({ ...prev, enabled: e.target.value === 'true' }))}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500 disabled:bg-gray-50"
            >
              <option value="true">Đang bật</option>
              <option value="false">Tạm tắt</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Flow (flow_id)</label>
              <input className="w-full h-9 px-3 rounded bg-gray-100 border border-gray-200 text-gray-600" value={form.flow_id} readOnly />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người tạo</label>
              <input className="w-full h-9 px-3 rounded bg-gray-100 border border-gray-200 text-gray-600" value={form.created_by} readOnly />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tạo lúc</label>
              <input className="w-full h-9 px-3 rounded bg-gray-100 border border-gray-200 text-gray-600" value={form.created_at ? new Date(form.created_at).toLocaleString() : ''} readOnly />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cập nhật lúc</label>
              <input className="w-full h-9 px-3 rounded bg-gray-100 border border-gray-200 text-gray-600" value={form.updated_at ? new Date(form.updated_at).toLocaleString() : ''} readOnly />
            </div>
          </div>
          {/* Triggers summary */}
          <div>
            <label className="block text-sm font-medium mb-1">Triggers</label>
            {form.triggers.length === 0 ? (
              <div className="text-gray-500 text-sm">Chưa có trigger nào.</div>
            ) : (
              <div className="space-y-2">
                {form.triggers.map((t, idx) => (
                  <div key={t.trigger_id || idx} className="p-3 rounded border bg-gray-50">
                    <div><strong>ID:</strong> {t.trigger_id}</div>
                    <div><strong>Loại sự kiện:</strong> {triggerOptions.find(opt => opt.value === t.event_type)?.label || t.event_type}</div>
                    <div><strong>Kích hoạt:</strong> {t.is_active ? 'Đang bật' : 'Tắt'}</div>
                    <div><strong>Điều kiện:</strong> {Array.isArray(t.conditions) ? t.conditions.map((c, i) => (
                      <span key={i}>{c.field} {c.operator} {c.value || ''}</span>
                    )) : '-'}</div>
                    <div><strong>Tạo lúc:</strong> {t.created_at ? new Date(t.created_at).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Actions summary */}
          <div>
            <label className="block text-sm font-medium mb-1">Actions</label>
            {form.actions.length === 0 ? (
              <div className="text-gray-500 text-sm">Chưa có action nào.</div>
            ) : (
              <div className="space-y-2">
                {form.actions.map((a, idx) => (
                  <div key={a.action_id || idx} className="p-3 rounded border bg-gray-50">
                    <div><strong>ID:</strong> {a.action_id}</div>
                    <div><strong>Loại hành động:</strong> {actionOptions.find(opt => opt.value === a.action_type)?.label || a.action_type}</div>
                    <div><strong>Kênh:</strong> {a.channel}</div>
                    <div><strong>Nội dung:</strong> {typeof a.content === 'object' ? JSON.stringify(a.content) : a.content}</div>
                    <div><strong>Thứ tự:</strong> {a.order_index}</div>
                    <div><strong>Delay (phút):</strong> {a.delay_minutes}</div>
                    <div><strong>Trạng thái:</strong> {a.status}</div>
                    <div><strong>Thời gian thực thi:</strong> {a.executed_at ? new Date(a.executed_at).toLocaleString() : '-'}</div>
                    <div><strong>Số lần thử lại:</strong> {a.retry_count}</div>
                    <div><strong>Lần thử lại cuối:</strong> {a.last_retry_at ? new Date(a.last_retry_at).toLocaleString() : '-'}</div>
                    <div><strong>Tạo lúc:</strong> {a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Fixed Action Buttons */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex justify-end gap-3">
          {mode === "view" ? (
            <>
              <Button variant="actionUpdate" onClick={handleEdit}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <ConfirmDialog
                title="Xác nhận xóa"
                description={<>Bạn có chắc chắn muốn xóa automation <span className="font-semibold">{data?.name}</span>?</>}
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={() => onDelete?.(data?.id)}
              >
                <Button variant="actionDelete">
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </ConfirmDialog>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Hủy
              </Button>
              <Button onClick={handleSaveClick} variant="actionUpdate">
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
