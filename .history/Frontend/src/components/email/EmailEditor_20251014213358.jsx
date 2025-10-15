import React, { useState, useRef } from 'react';
import EmailEditor from 'react-email-editor';
import { Eye, Code, Download, Upload, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailEditorComponent({ content, onChange }) {
  const emailEditorRef = useRef(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [localContent, setLocalContent] = useState({
    html: content?.html || '',
    text: content?.text || '',
    template: content?.template || 'blank',
    design: content?.design || null
  });

  const onReady = () => {
    // Load existing design if available
    if (localContent.design) {
      emailEditorRef.current?.editor?.loadDesign(localContent.design);
    }
  };

  const exportHtml = () => {
    emailEditorRef.current?.editor?.exportHtml((data) => {
      const { design, html } = data;
      const newContent = {
        ...localContent,
        html: html,
        design: design
      };
      setLocalContent(newContent);
      onChange(newContent);
    });
  };

  const saveDesign = () => {
    emailEditorRef.current?.editor?.saveDesign((design) => {
      const newContent = {
        ...localContent,
        design: design
      };
      setLocalContent(newContent);
      onChange(newContent);
    });
  };

  const loadTemplate = async (templateId) => {
    setIsLoading(true);
    try {
      // Sample templates - you can replace with your own template data
      const templates = {
        welcome: {
          "body": {
            "rows": [
              {
                "cells": [1],
                "columns": [
                  {
                    "contents": [
                      {
                        "type": "text",
                        "values": {
                          "text": "<h1 style='text-align: center; color: #333;'>Chào mừng {{customer_name}}!</h1><p style='text-align: center;'>Cảm ơn bạn đã đăng ký với chúng tôi.</p>"
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        newsletter: {
          "body": {
            "rows": [
              {
                "cells": [1],
                "columns": [
                  {
                    "contents": [
                      {
                        "type": "text",
                        "values": {
                          "text": "<h1 style='color: #333;'>Bản tin tháng này</h1><p>Xin chào {{customer_name}},</p><p>Đây là những cập nhật mới nhất từ chúng tôi...</p>"
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        },
        promotion: {
          "body": {
            "rows": [
              {
                "cells": [1],
                "columns": [
                  {
                    "contents": [
                      {
                        "type": "text",
                        "values": {
                          "text": "<h1 style='text-align: center; color: #e74c3c;'>🔥 Ưu đãi đặc biệt!</h1><p style='text-align: center;'>Đừng bỏ lỡ cơ hội giảm giá lên đến 50%!</p>"
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      };

      const template = templates[templateId];
      if (template) {
        emailEditorRef.current?.editor?.loadDesign(template);
        setLocalContent(prev => ({ ...prev, template: templateId }));
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const templates = [
    { id: 'blank', name: 'Trống', preview: 'Bắt đầu từ đầu' },
    { id: 'welcome', name: 'Chào mừng', preview: 'Email chào mừng khách hàng mới' },
    { id: 'newsletter', name: 'Bản tin', preview: 'Template bản tin định kỳ' },
    { id: 'promotion', name: 'Khuyến mãi', preview: 'Email quảng cáo sản phẩm' }
  ];

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900">Chọn template</label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {templates.map(template => (
            <div
              key={template.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-sm ${
                localContent.template === template.id 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              onClick={() => {
                setLocalContent(prev => ({ ...prev, template: template.id }));
                if (template.id !== 'blank') {
                  loadTemplate(template.id);
                }
              }}
            >
              <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{template.preview}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={saveDesign}
            className="gap-1 text-sm"
          >
            <Upload className="w-4 h-4" />
            Lưu thiết kế
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportHtml}
            className="gap-1 text-sm"
          >
            <Download className="w-4 h-4" />
            Xuất HTML
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1 text-sm"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Ẩn' : 'Xem trước'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Email Editor */}
        <div className="lg:col-span-3">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <EmailEditor
              ref={emailEditorRef}
              onReady={onReady}
              minHeight={500}
              options={{
                displayMode: 'email',
                locale: 'vi-VN',
                appearance: {
                  theme: 'light',
                  panels: {
                    tools: {
                      dock: 'left'
                    }
                  }
                },
                mergeTags: [
                  {
                    name: 'customer_name',
                    value: '{{customer_name}}',
                    sample: 'Nguyễn Văn A'
                  },
                  {
                    name: 'customer_email', 
                    value: '{{customer_email}}',
                    sample: 'example@email.com'
                  },
                  {
                    name: 'company_name',
                    value: '{{company_name}}', 
                    sample: 'Công ty ABC'
                  },
                  {
                    name: 'current_date',
                    value: '{{current_date}}',
                    sample: new Date().toLocaleDateString('vi-VN')
                  }
                ]
              }}
            />
          </div>

          {/* Text Version */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Phiên bản text (cho email client không hỗ trợ HTML)
            </label>
            <textarea
              value={localContent.text}
              onChange={(e) => {
                const newContent = { ...localContent, text: e.target.value };
                setLocalContent(newContent);
                onChange(newContent);
              }}
              className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
              placeholder="Phiên bản text của email..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Variables */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <h3 className="font-medium mb-3 text-gray-900">Biến cá nhân hóa</h3>
            <div className="space-y-2">
              {[
                { key: 'customer_name', label: 'Tên khách hàng' },
                { key: 'customer_email', label: 'Email khách hàng' },
                { key: 'company_name', label: 'Tên công ty' },
                { key: 'current_date', label: 'Ngày hiện tại' }
              ].map(variable => (
                <div
                  key={variable.key}
                  className="p-2 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="font-medium text-gray-900">{variable.label}</div>
                  <div className="text-xs text-gray-500">{`{{${variable.key}}}`}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Xem trước</h3>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('desktop')}
                    className="h-8 px-2"
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('mobile')}
                    className="h-8 px-2"
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className={`border border-gray-200 rounded overflow-hidden bg-white ${
                previewMode === 'mobile' ? 'max-w-sm' : ''
              }`}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: localContent.html
                      .replace(/\{\{customer_name\}\}/g, 'Nguyễn Văn A')
                      .replace(/\{\{customer_email\}\}/g, 'example@email.com')
                      .replace(/\{\{company_name\}\}/g, 'Công ty ABC')
                      .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('vi-VN'))
                  }}
                  className="p-4 text-sm"
                  style={{ fontSize: previewMode === 'mobile' ? '14px' : '16px' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
