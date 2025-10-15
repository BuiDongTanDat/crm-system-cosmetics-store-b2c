import React, { useState, useEffect } from 'react';
import { Save, Send, Calendar, Users, Mail, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmailEditor from '@/components/email/EmailEditor';
import AudienceSelector from '@/components/automation/AudienceSelector';
import ScheduleSelector from '@/components/automation/ScheduleSelector';

export default function AutomationForm({ mode, data, onSave, onDelete }) {
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
    status: 'draft',
    ...data
  });

  const steps = [
    { id: 1, title: 'Thông tin cơ bản', icon: Settings },
    { id: 2, title: 'Thiết kế Email', icon: Mail },
    { id: 3, title: 'Chọn đối tượng', icon: Users },
    { id: 4, title: 'Lên lịch', icon: Calendar },
    { id: 5, title: 'Xem trước & Gửi', icon: Eye }
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

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Thông tin cơ bản</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Tên chiến dịch *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
                placeholder="Nhập tên chiến dịch..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">Loại chiến dịch</label>
                <select
                  value={formData.campaignType}
                  onChange={(e) => handleInputChange('campaignType', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
                >
                  <option value="standard">Chuẩn</option>
                  <option value="automated">Tự động</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">Kênh gửi</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Email người gửi *</label>
              <input
                type="email"
                value={formData.senderEmail}
                onChange={(e) => handleInputChange('senderEmail', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
                placeholder="support@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Tên người gửi</label>
              <input
                type="text"
                value={formData.senderName}
                onChange={(e) => handleInputChange('senderName', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
                placeholder="Tên công ty"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Thiết kế nội dung Email</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Tiêu đề email *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
                placeholder="Nhập tiêu đề email..."
                required
              />
            </div>

            <EmailEditor
              content={formData.emailContent}
              onChange={(content) => handleInputChange('emailContent', content)}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Chọn đối tượng nhận</h3>
            <AudienceSelector
              selectedAudience={formData.targetAudience}
              selectedSegment={formData.segment}
              onAudienceChange={(audience) => handleInputChange('targetAudience', audience)}
              onSegmentChange={(segment) => handleInputChange('segment', segment)}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Lên lịch gửi</h3>
            <ScheduleSelector
              schedule={formData.schedule}
              onChange={(schedule) => handleInputChange('schedule', schedule)}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4 text-gray-900">Xem trước & Gửi</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium mb-2 text-gray-900">Thông tin chiến dịch</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tên:</span> <span className="text-gray-900">{formData.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Loại:</span> <span className="text-gray-900">{formData.campaignType === 'standard' ? 'Chuẩn' : 'Tự động'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tiêu đề:</span> <span className="text-gray-900">{formData.subject}</span>
                </div>
                <div>
                  <span className="text-gray-600">Người gửi:</span> <span className="text-gray-900">{formData.senderEmail}</span>
                </div>
                <div>
                  <span className="text-gray-600">Đối tượng:</span> <span className="text-gray-900">{formData.targetAudience}</span>
                </div>
                <div>
                  <span className="text-gray-600">Lịch gửi:</span> <span className="text-gray-900">{
                    formData.schedule.type === 'immediate' ? 'Gửi ngay' :
                    formData.schedule.type === 'scheduled' ? `${formData.schedule.date} ${formData.schedule.time}` :
                    `Tự động - ${formData.schedule.trigger}`
                  }</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="font-medium mb-2 text-gray-900">Xem trước email</h4>
              <div className="border border-gray-200 rounded p-4 bg-gray-50">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>From:</strong> {formData.senderName} &lt;{formData.senderEmail}&gt;
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Subject:</strong> {formData.subject}
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div dangerouslySetInnerHTML={{ __html: formData.emailContent.html || 'Chưa có nội dung' }} />
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
    <div className="max-h-[80vh] overflow-hidden flex flex-col">
      {/* Steps */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div 
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                activeStep === step.id ? 'bg-blue-600 text-white' :
                activeStep > step.id ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              <step.icon className="w-4 h-4" />
            </div>
            <span className={`ml-2 text-sm transition-all ${
              activeStep === step.id ? 'font-semibold text-gray-900' : 'text-gray-600'
            }`}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-px mx-4 transition-colors ${
                activeStep > step.id ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStepContent()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
        <div>
          {activeStep > 1 && (
            <Button onClick={handlePrev} variant="outline" className="text-sm">
              Quay lại
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {mode !== 'view' && (
            <>
              <Button onClick={() => handleSave('draft')} variant="outline" className="gap-2 text-sm">
                <Save className="w-4 h-4" />
                Lưu nháp
              </Button>
              
              {activeStep < steps.length ? (
                <Button onClick={handleNext} className="gap-2 text-sm">
                  Tiếp theo
                </Button>
              ) : (
                <Button onClick={() => handleSave('active')} className="gap-2 text-sm bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4" />
                  Gửi ngay
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
