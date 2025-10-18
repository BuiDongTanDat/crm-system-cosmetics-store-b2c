import React, { useState, useEffect } from 'react';
import {
  Save, Send, Calendar, Users, Mail, Settings,
  Eye, Edit, Trash2, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DropdownOptions from '@/components/ui/DropdownOptions';
import EmailEditor from '@/pages/autimation/components/EmailEditor';
import AudienceSelector from '@/pages/autimation/components/AudienceSelector';
import ScheduleSelector from '@/pages/autimation/components/ScheduleSelector';
import { createFlow /*, updateFlow, publishFlow */ } from '@/services/flows';

export default function AutomationForm({
  mode = 'view',
  data,
  onSave,        // callback optional: (savedData) => void
  onDelete,      // callback optional: (id) => void
  setMode        // callback optional: (mode) => void
}) {
  const [activeStep, setActiveStep] = useState(1);
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

  const steps = [
    { id: 1, title: 'Thông tin cơ bản', icon: Settings }
    // thêm bước khác nếu cần
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const handleNext = () => {
    if (activeStep < steps.length) setActiveStep(s => s + 1);
  };
  const handlePrev = () => {
    if (activeStep > 1) setActiveStep(s => s - 1);
  };

  const renderStepContent = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Tên automation flow *
          </label>
          <input
            disabled={mode === 'view'}
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
            placeholder="Nhập tên automation..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <input
            disabled={mode === 'view'}
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
            placeholder="Nhập mô tả ngắn..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags *</label>
          <input
            disabled={mode === 'view'}
            type="text"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
            placeholder="Ví dụ: VIP, Khách mới"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Ngăn cách bằng dấu phẩy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email người gửi *
            </label>
            <input
              disabled={mode === 'view'}
              type="email"
              value={formData.senderEmail}
              onChange={(e) => handleInputChange('senderEmail', e.target.value)}
              className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
              placeholder="support@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tên người gửi</label>
            <input
              disabled={mode === 'view'}
              type="text"
              value={formData.senderName}
              onChange={(e) => handleInputChange('senderName', e.target.value)}
              className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
              placeholder="Tên công ty"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Steps Navigation */}
      <div className="flex-shrink-0 px-6 pt-0 pb-0 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full cursor-pointer ${
                  activeStep === step.id
                    ? 'bg-blue-600 text-white'
                    : activeStep > step.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                onClick={() => setActiveStep(step.id)}
              >
                <step.icon className="w-4 h-4" />
              </div>
              <span
                className={`ml-2 text-sm cursor-pointer ${
                  activeStep === step.id ? 'font-semibold' : ''
                }`}
                onClick={() => setActiveStep(step.id)}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="font-semibold text-lg mb-4">
          {steps[activeStep - 1]?.title}
        </h3>
        {renderStepContent()}
      </div>

      {/* Actions */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(mode === 'edit' || mode === 'view') && activeStep > 1 && (
              <Button onClick={handlePrev} variant="outline" className="gap-2 flex">
                <ChevronLeft /> Quay lại
              </Button>
            )}
            {(mode === 'edit' || mode === 'view') && activeStep < steps.length && (
              <Button onClick={handleNext} variant="outline" className="gap-2 flex">
                Tiếp theo <ChevronRight />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {mode === 'view' ? (
              <>
                <Button variant="actionUpdate" onClick={() => setMode?.('edit')}>
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
                <Button variant="actionDelete" onClick={() => onDelete?.(data?.id)}>
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveClick}
                  variant="actionCreate"
                  className="gap-2"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu…' : 'Lưu Flow'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
