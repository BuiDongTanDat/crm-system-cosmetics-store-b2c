import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createFlow /*, updateFlow, publishFlow */ } from '@/services/flows';

export default function AutomationForm({
  mode = 'view',
  data,
  onSave,        // callback optional: (savedData) => void
  onDelete,      // callback optional: (id) => void
  setMode,        // callback optional: (mode) => void
  onClose // <-- pass from AppDialog for close (X) button
}) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    type: 'email',
    campaignType: 'standard',
    subject: '',
    senderEmail: '',
    senderName: '',
    targetAudience: '',
    segment: '',
    emailContent: {
      html: '',
      text: '',
      template: 'blank',
      design: null
    },
    schedule: {
      type: 'immediate',
      date: '',
      time: '',
      trigger: ''
    },
    actions: [],
    status: 'draft'
  });

  useEffect(() => {
    if (data) {
      setFormData(prev => ({
        ...prev,
        name: data.name ?? '',
        description: data.description ?? '',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags ?? ''),
        type: data.type ?? 'email',
        campaignType: data.campaignType ?? 'standard',
        subject: data.subject ?? '',
        senderEmail: data.senderEmail ?? '',
        senderName: data.senderName ?? '',
        targetAudience: data.targetAudience ?? '',
        segment: data.segment ?? '',
        emailContent: data.emailContent ?? prev.emailContent,
        schedule: data.schedule ?? prev.schedule,
        actions: data.actions ?? [],
        status: data.status ?? 'draft'
      }));
    }
  }, [data]);

  const buildPayload = () => {
    return {
      name: formData.name || 'Flow không tên',
      description: formData.description || '',
      tags: formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [],
      meta: {
        type: formData.type,
        campaignType: formData.campaignType,
      },
      email: {
        subject: formData.subject,
        senderEmail: formData.senderEmail,
        senderName: formData.senderName,
        content: formData.emailContent
      },
      targeting: {
        audience: formData.targetAudience,
        segment: formData.segment
      },
      schedule: formData.schedule,
      actions: formData.actions,
      status: formData.status
    };
  };

  const handleSaveClick = async () => {
    try {
      setSaving(true);
      // Build payload từ form
      const payload = buildPayload();
      console.log('Saving flow with payload:', payload);
      // Lưu ra JSON file (theo service bạn đã yêu cầu)
      const res = await createFlow(payload); // { id: 'local-...', fileName: '...' }
      
      // cập nhật state + thông báo
      const saveData = {
        ...formData,
        status: 'draft',
        updatedAt: new Date().toISOString(),
        id: res?.id
      };

      // callback lên cha nếu cần
      onSave?.(saveData);

      alert('Lưu thành công!');
      // Có thể điều hướng tại đây nếu muốn:
      // router.push(`/flows/${res.id}`);
      setMode?.('view');
    } catch (err) {
      console.error(err);
      alert(`Lỗi lưu: ${err.message || 'Không xác định'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (data) {
      // reset về dữ liệu ban đầu
      setFormData(prev => ({
        ...prev,
        name: data.name ?? '',
        description: data.description ?? '',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags ?? ''),
        type: data.type ?? 'email',
        campaignType: data.campaignType ?? 'standard',
        subject: data.subject ?? '',
        senderEmail: data.senderEmail ?? '',
        senderName: data.senderName ?? '',
        targetAudience: data.targetAudience ?? '',
        segment: data.segment ?? '',
        emailContent: data.emailContent ?? prev.emailContent,
        schedule: data.schedule ?? prev.schedule,
        actions: data.actions ?? [],
        status: data.status ?? 'draft'
      }));
    }
    setMode?.('view');
  };

  // Steps for detail view
  const detailSteps = [
    { id: 1, label: 'Thông tin' },
    { id: 2, label: 'Trigger' },
    { id: 3, label: 'Action' },
    { id: 4, label: 'Lịch gửi' },
    { id: 5, label: 'Nội dung Email' }
  ];

  // Render detail sections
  const renderDetail = () => (
    <div className="space-y-6">
      {/* Thông tin */}
      <div className="bg-white rounded-lg border p-4">
        <div className="mb-2 text-lg font-semibold">Thông tin</div>
        <div className="mb-2"><strong>Tên:</strong> {data?.name}</div>
        <div className="mb-2"><strong>Mô tả:</strong> {data?.description}</div>
        <div className="mb-2"><strong>Trạng thái:</strong> {data?.status}</div>
        <div className="mb-2"><strong>Loại:</strong> {data?.type}</div>
        <div className="mb-2"><strong>Đối tượng:</strong> {data?.targetAudience}</div>
      </div>
      {/* Trigger */}
      <div className="bg-white rounded-lg border p-4">
        <div className="mb-2 text-lg font-semibold">Trigger</div>
        <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(data?.trigger, null, 2)}</pre>
      </div>
      {/* Action */}
      <div className="bg-white rounded-lg border p-4">
        <div className="mb-2 text-lg font-semibold">Action</div>
        <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(data?.action, null, 2)}</pre>
      </div>
      {/* Lịch gửi */}
      <div className="bg-white rounded-lg border p-4">
        <div className="mb-2 text-lg font-semibold">Lịch gửi</div>
        <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(data?.schedule, null, 2)}</pre>
      </div>
      {/* Nội dung Email */}
      <div className="bg-white rounded-lg border p-4">
        <div className="mb-2 text-lg font-semibold">Nội dung Email</div>
        <pre className="bg-gray-50 p-2 rounded">{JSON.stringify(data?.emailContent, null, 2)}</pre>
      </div>
    </div>
  );

  // Actions
  const handleEdit = () => {
    navigate('/automation/create');
  };

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Header with close (X) button */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <h3 className="font-semibold text-lg">
          {mode === 'view' ? 'Chi tiết Automation' : 'Chỉnh sửa Automation'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <span className="sr-only">Đóng</span>
          {/* X icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-500"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {mode === 'view' ? renderDetail() : null}
      </div>

      {/* Actions */}
      <div className="border-t bg-white p-6 flex-shrink-0 flex justify-end gap-3">
        {mode === 'view' ? (
          <>
            <Button variant="actionUpdate" onClick={handleEdit}>
              <Edit className="w-4 h-4" />
              Chỉnh sửa
            </Button>
            <Button variant="actionDelete" onClick={() => onDelete?.(data?.id)}>
              <Trash2 className="w-4 h-4" />
              Xóa
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
