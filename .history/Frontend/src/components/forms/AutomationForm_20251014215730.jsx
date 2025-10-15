import React, { useState, useEffect, useRef } from 'react';
import { Save, Send, Calendar, Users, Mail, Settings, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmailEditorLib from 'react-email-editor';
import AudienceSelector from '@/components/automation/AudienceSelector';
import ScheduleSelector from '@/components/automation/ScheduleSelector';

export default function AutomationForm({ mode = 'view', data, onSave, onDelete, setMode }) {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    campaignType: 'standard',
    subject: '',
    senderEmail: '',
    senderName: '',
    targetAudience: '',
    segment: '',
    emailContent: { html: '', design: null },
    schedule: { type: 'immediate', date: '', time: '', trigger: '' },
    actions: [],
    status: 'draft'
  });

  const emailEditorRef = useRef(null);

  useEffect(() => {
    if (data) setFormData(data);
  }, [data]);

  // Load email design into editor
  const loadEmailDesign = () => {
    if (emailEditorRef.current && formData.emailContent?.design) {
      emailEditorRef.current.editor.loadDesign(formData.emailContent.design);
    }
  };

  useEffect(() => {
    if (mode !== 'view') loadEmailDesign();
  }, [formData.emailContent?.design, mode]);

  const exportEmail = (callback) => {
    if (emailEditorRef.current) {
      emailEditorRef.current.editor.exportHtml(({ design, html }) => {
        const newContent = { design, html };
        setFormData(prev => ({ ...prev, emailContent: newContent }));
        callback?.(newContent);
      });
    }
  };

  const handleNext = () => {
    if (activeStep === 2) {
      exportEmail(); // lưu HTML/Design trước khi chuyển bước
    }
    setActiveStep(prev => Math.min(prev + 1, 5));
  };
  const handlePrev = () => setActiveStep(prev => Math.max(prev - 1, 1));

  const handleSave = (status = 'draft') => {
    exportEmail((content) => {
      onSave({ ...formData, emailContent: content, status, updatedAt: new Date().toISOString() });
      if (mode === 'edit') setMode?.('view');
    });
  };

  const handleCancel = () => {
    if (data) setFormData(data);
    setMode?.('view');
  };

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const steps = [
    { id: 1, title: 'Thông tin cơ bản', icon: Settings },
    { id: 2, title: 'Thiết kế Email', icon: Mail },
    { id: 3, title: 'Chọn đối tượng', icon: Users },
    { id: 4, title: 'Lên lịch', icon: Calendar },
    { id: 5, title: 'Xem trước & Gửi', icon: Eye }
  ];

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên automation *</label>
              <input
                disabled={mode === 'view'}
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Loại chiến dịch</label>
                <select
                  disabled={mode === 'view'}
                  value={formData.campaignType}
                  onChange={e => handleInputChange('campaignType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
                >
                  <option value="standard">Chuẩn</option>
                  <option value="automated">Tự động</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kênh gửi</label>
                <select
                  disabled={mode === 'view'}
                  value={formData.type}
                  onChange={e => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email người gửi *</label>
              <input
                disabled={mode === 'view'}
                type="email"
                value={formData.senderEmail}
                onChange={e => handleInputChange('senderEmail', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên người gửi</label>
              <input
                disabled={mode === 'view'}
                value={formData.senderName}
                onChange={e => handleInputChange('senderName', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề email *</label>
              <input
                disabled={mode === 'view'}
                type="text"
                value={formData.subject}
                onChange={e => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>

            {mode !== 'view' ? (
              <div style={{ height: '500px' }}>
                <EmailEditorLib ref={emailEditorRef} />
              </div>
            ) : (
              <div className="border p-4 bg-gray-50 rounded" dangerouslySetInnerHTML={{ __html: formData.emailContent?.html || 'Chưa có nội dung' }} />
            )}
          </div>
        );

      case 3:
        return mode !== 'view' ? (
          <AudienceSelector
            selectedAudience={formData.targetAudience}
            selectedSegment={formData.segment}
            onAudienceChange={aud => handleInputChange('targetAudience', aud)}
            onSegmentChange={seg => handleInputChange('segment', seg)}
          />
        ) : (
          <div className="space-y-2">
            <div>Đối tượng: {formData.targetAudience || 'Chưa chọn'}</div>
            <div>Phân khúc: {formData.segment || 'Chưa chọn'}</div>
          </div>
        );

      case 4:
        return mode !== 'view' ? (
          <ScheduleSelector schedule={formData.schedule} onChange={sched => handleInputChange('schedule', sched)} />
        ) : (
          <div>
            Lịch gửi: {formData.schedule?.type}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">Xem trước email</h4>
              <div dangerouslySetInnerHTML={{ __html: formData.emailContent?.html || 'Chưa có nội dung' }} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Steps */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full ${activeStep === step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                <step.icon className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm">{step.title}</span>
              {index < steps.length - 1 && <div className={`w-8 h-px mx-4 ${activeStep > step.id ? 'bg-green-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderStepContent()}
      </div>

      {/* Actions */}
      <div className="border-t bg-white p-6 flex-shrink-0 flex justify-between">
        <div>
          {mode === 'edit' && activeStep > 1 && <Button onClick={handlePrev} variant="outline">Quay lại</Button>}
        </div>
        <div className="flex gap-2">
          {mode === 'view' ? (
            <>
              <Button variant="actionUpdate" onClick={() => setMode?.('edit')}><Edit className="w-4 h-4" />Chỉnh sửa</Button>
              <Button variant="actionDelete" onClick={() => onDelete?.(data?.id)}><Trash2 className="w-4 h-4" />Xóa</Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancel} variant="outline">Hủy</Button>
              <Button onClick={() => handleSave('draft')} variant="outline"><Save className="w-4 h-4" />Lưu nháp</Button>
              {activeStep < steps.length ? (
                <Button onClick={handleNext} variant="actionUpdate">Tiếp theo</Button>
              ) : (
                <Button onClick={() => handleSave('active')} className="gap-2 bg-green-600 text-white hover:bg-green-700"><Send className="w-4 h-4" />Gửi ngay</Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
