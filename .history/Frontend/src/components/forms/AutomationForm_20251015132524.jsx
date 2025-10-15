import React, { useState, useEffect } from 'react';
import { Save, Send, Calendar, Users, Mail, Settings, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DropdownOptions from '@/components/ui/DropdownOptions';
import EmailEditor from '@/components/email/EmailEditor';
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
      setFormData({
        name: data.name || '',
        type: data.type || 'email',
        campaignType: data.campaignType || 'standard',
        subject: data.subject || '',
        senderEmail: data.senderEmail || '',
        senderName: data.senderName || '',
        targetAudience: data.targetAudience || '',
        segment: data.segment || '',
        emailContent: data.emailContent || {
          html: '',
          text: '',
          template: 'blank',
          design: null
        },
        schedule: data.schedule || {
          type: 'immediate',
          date: '',
          time: '',
          trigger: ''
        },
        actions: data.actions || [],
        status: data.status || 'draft'
      });
    }
  }, [data]);

  const steps = [
    { id: 1, title: 'Thông tin cơ bản', icon: Settings },
    { id: 2, title: 'Thiết kế Email', icon: Mail },
    { id: 3, title: 'Chọn đối tượng', icon: Users },
    { id: 4, title: 'Lên lịch', icon: Calendar },
    { id: 5, title: 'Xem trước & Gửi', icon: Eye }
  ];

  const campaignTypes = [
    { value: 'standard', label: 'Chuẩn' },
    { value: 'automated', label: 'Tự động' }
  ];

  const channelTypes = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push Notification' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = (status = 'draft') => {
    const saveData = {
      ...formData,
      status,
      updatedAt: new Date().toISOString()
    };
    onSave(saveData);
    
    if (mode === 'edit') {
      setMode?.('view');
    }
  };

  const handleCancel = () => {
    if (data) {
      setFormData({
        name: data.name || '',
        type: data.type || 'email',
        campaignType: data.campaignType || 'standard',
        subject: data.subject || '',
        senderEmail: data.senderEmail || '',
        senderName: data.senderName || '',
        targetAudience: data.targetAudience || '',
        segment: data.segment || '',
        emailContent: data.emailContent || {
          html: '',
          text: '',
          template: 'blank',
          design: null
        },
        schedule: data.schedule || {
          type: 'immediate',
          date: '',
          time: '',
          trigger: ''
        },
        actions: data.actions || [],
        status: data.status || 'draft'
      });
    }
    setMode?.('view');
  };

  const handleNext = () => {
    if (activeStep < steps.length) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  //Render step với mỗi case là một bước
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
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập tên automation..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Loại chiến dịch</label>
                <DropdownOptions
                  options={campaignTypes}
                  value={formData.campaignType}
                  onChange={(value) => handleInputChange('campaignType', value)}
                  placeholder="Chọn loại"
                  disabled={mode === 'view'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Kênh gửi</label>
                <DropdownOptions
                  options={channelTypes}
                  value={formData.type}
                  onChange={(value) => handleInputChange('type', value)}
                  placeholder="Chọn kênh"
                  disabled={mode === 'view'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email người gửi *</label>
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
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập tiêu đề email..."
                required
              />
            </div>

            {mode !== 'view' ? (
              <EmailEditor
                content={formData.emailContent}
                onChange={(content) => handleInputChange('emailContent', content)}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung email</label>
                <div className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg min-h-[200px]">
                  <div dangerouslySetInnerHTML={{ __html: formData.emailContent?.html || 'Chưa có nội dung' }} />
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {mode !== 'view' ? (
              <AudienceSelector
                selectedAudience={formData.targetAudience}
                selectedSegment={formData.segment}
                onAudienceChange={(audience) => handleInputChange('targetAudience', audience)}
                onSegmentChange={(segment) => handleInputChange('segment', segment)}
              />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Đối tượng mục tiêu</label>
                  <input
                    disabled
                    value={formData.targetAudience || 'Chưa chọn'}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phân khúc</label>
                  <input
                    disabled
                    value={formData.segment || 'Chưa chọn'}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            {mode !== 'view' ? (
              <ScheduleSelector
                schedule={formData.schedule}
                onChange={(schedule) => handleInputChange('schedule', schedule)}
              />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại lịch gửi</label>
                  <input
                    disabled
                    value={
                      formData.schedule?.type === 'immediate' ? 'Gửi ngay lập tức' :
                      formData.schedule?.type === 'scheduled' ? 'Lên lịch gửi' :
                      formData.schedule?.type === 'trigger' ? 'Dựa trên hành động' : 'Chưa thiết lập'
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                  />
                </div>
                {formData.schedule?.type === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày gửi</label>
                      <input
                        disabled
                        value={formData.schedule.date || ''}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Giờ gửi</label>
                      <input
                        disabled
                        value={formData.schedule.time || ''}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
                {formData.schedule?.type === 'trigger' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Trigger</label>
                    <input
                      disabled
                      value={formData.schedule.trigger || 'Chưa chọn'}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Tóm tắt automation</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tên:</span> <span className="font-medium">{formData.name || 'Chưa đặt tên'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Loại:</span> <span className="font-medium">{formData.campaignType === 'standard' ? 'Chuẩn' : 'Tự động'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tiêu đề:</span> <span className="font-medium">{formData.subject || 'Chưa có tiêu đề'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Người gửi:</span> <span className="font-medium">{formData.senderEmail || 'Chưa thiết lập'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Đối tượng:</span> <span className="font-medium">{formData.targetAudience || 'Chưa chọn'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Lịch gửi:</span> <span className="font-medium">{
                    formData.schedule?.type === 'immediate' ? 'Gửi ngay' :
                    formData.schedule?.type === 'scheduled' ? `${formData.schedule.date} ${formData.schedule.time}` :
                    `Tự động - ${formData.schedule?.trigger || 'Chưa thiết lập'}`
                  }</span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium mb-2">Xem trước email</h4>
              <div className="border rounded p-4 bg-gray-50">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>From:</strong> {formData.senderName} &lt;{formData.senderEmail}&gt;
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Subject:</strong> {formData.subject}
                </div>
                <div className="border-t pt-4 mt-4">
                  <div dangerouslySetInnerHTML={{ __html: formData.emailContent?.html || 'Chưa có nội dung' }} />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Steps Navigation */}
      <div className="flex-shrink-0 px-6 pt-0 pb-0 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full cursor-pointer ${
                  activeStep === step.id ? 'bg-blue-600 text-white' :
                  activeStep > step.id ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
                onClick={() => setActiveStep(step.id)}
              >
                <step.icon className="w-4 h-4" />
              </div>
              <span 
                className={`ml-2 text-sm cursor-pointer ${activeStep === step.id ? 'font-semibold' : ''}`}
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
        <h3 className="font-semibold text-lg mb-4">{steps[activeStep - 1]?.title}</h3>
        {renderStepContent()}
      </div>

      {/* Actions */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Navigation buttons - bên trái */}
            {mode === 'edit' && activeStep > 1 && (
              <Button onClick={handlePrev} variant="outline">
                Quay lại
              </Button>
            )}
            {mode === 'view' && activeStep > 1 && (
              <Button onClick={handlePrev} variant="outline">
                Quay lại
              </Button>
            )}
            
            {mode === 'view' && activeStep < steps.length && (
              <Button onClick={handleNext} variant="outline">
                Tiếp theo <ChevronRight />
              </Button>
            )}
            
            {mode === 'edit' && activeStep < steps.length && (
              <Button onClick={handleNext} variant="outline">
                Tiếp theo
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Action buttons - bên phải */}
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
                
                <Button onClick={() => handleSave('draft')} variant="outline" className="gap-2">
                  <Save className="w-4 h-4" />
                  Lưu nháp
                </Button>
                
                {activeStep === steps.length && (
                  <Button onClick={() => handleSave('active')} variant="actionCreate" className="gap-2">
                    <Send className="w-4 h-4" />
                    Gửi ngay
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
