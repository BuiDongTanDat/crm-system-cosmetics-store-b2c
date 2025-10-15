import React, { useState, useRef, useCallback } from 'react';
import ReactEmailEditor from 'react-email-editor';
import { Eye, Download, Upload, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailEditor({ content, onChange }) {
  const emailEditorRef = useRef(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showPreview, setShowPreview] = useState(false);

  const [localContent, setLocalContent] = useState({
    html: content?.html || '',
    text: content?.text || '',
    template: content?.template || 'blank',
    design: content?.design || null,
  });

  const handleContentChange = useCallback(
    (field, value) => {
      const newContent = { ...localContent, [field]: value };
      setLocalContent(newContent);
      onChange?.(newContent);
    },
    [localContent, onChange]
  );

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
        design: design,
      };
      setLocalContent(newContent);
      onChange?.(newContent);
    });
  };

  const saveDesign = () => {
    emailEditorRef.current?.editor?.saveDesign((design) => {
      const newContent = {
        ...localContent,
        design: design,
      };
      setLocalContent(newContent);
      onChange?.(newContent);
    });
  };

  const loadTemplate = (templateId) => {
    const templates = {
      welcome: {
        body: {
          rows: [
            {
              cells: [1],
              columns: [
                {
                  contents: [
                    {
                      type: 'text',
                      values: {
                        text: "<h1 style='text-align: center; color: #333; font-family: Arial, sans-serif;'>Chào mừng {{customer_name}}!</h1><p style='text-align: center; color: #666; font-family: Arial, sans-serif;'>Cảm ơn bạn đã đăng ký với chúng tôi. Chúng tôi rất vui được chào đón bạn!</p>",
                      },
                    },
                  ],
                },
              ],
            },
            {
              cells: [1],
              columns: [
                {
                  contents: [
                    {
                      type: 'button',
                      values: {
                        href: '#',
                        text: 'Bắt đầu khám phá',
                        backgroundColor: '#007bff',
                        color: '#ffffff',
                        borderRadius: '5px',
                        padding: '12px 24px',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      newsletter: {
        body: {
          rows: [
            {
              cells: [1],
              columns: [
                {
                  contents: [
                    {
                      type: 'text',
                      values: {
                        text: "<h1 style='color: #333; font-family: Arial, sans-serif;'>Bản tin tháng này</h1><p style='color: #666; font-family: Arial, sans-serif;'>Xin chào {{customer_name}},</p><p style='color: #666; font-family: Arial, sans-serif;'>Đây là những cập nhật mới nhất từ chúng tôi trong tháng này.</p>",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      promotion: {
        body: {
          rows: [
            {
              cells: [1],
              columns: [
                {
                  contents: [
                    {
                      type: 'text',
                      values: {
                        text: "<h1 style='text-align: center; color: #e74c3c; font-family: Arial, sans-serif;'>🔥 Ưu đãi đặc biệt!</h1><p style='text-align: center; color: #666; font-family: Arial, sans-serif;'>Đừng bỏ lỡ cơ hội giảm giá lên đến 50% cho tất cả sản phẩm!</p>",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    };

    const template = templates[templateId];
    if (template && emailEditorRef.current) {
      emailEditorRef.current.editor.loadDesign(template);
      handleContentChange('template', templateId);
    }
  };

  const templates = [
    { id: 'blank', name: 'Trống', preview: 'Bắt đầu từ đầu' },
    { id: 'welcome', name: 'Chào mừng', preview: 'Email chào mừng khách hàng mới' },
    { id: 'newsletter', name: 'Bản tin', preview: 'Template bản tin định kỳ' },
    { id: 'promotion', name: 'Khuyến mãi', preview: 'Email quảng cáo sản phẩm' },
  ];

  const variables = [
    { key: 'customer_name', label: 'Tên khách hàng' },
    { key: 'customer_email', label: 'Email khách hàng' },
    { key: 'company_name', label: 'Tên công ty' },
    { key: 'current_date', label: 'Ngày hiện tại' },
    { key: 'unsubscribe_link', label: 'Link hủy đăng ký' },
  ];

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">Chọn template</label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-3 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
                localContent.template === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              }`}
              onClick={() => {
                if (template.id === 'blank') {
                  emailEditorRef.current?.editor?.loadDesign({});
                  handleContentChange('template', 'blank');
                } else {
                  loadTemplate(template.id);
                }
              }}
            >
              <h4 className="font-medium text-sm">{template.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{template.preview}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={saveDesign}
            className="gap-1"
          >
            <Upload className="w-4 h-4" />
            Lưu thiết kế
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportHtml}
            className="gap-1"
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
            className="gap-1"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Ẩn' : 'Xem trước'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Email Editor */}
        <div className="lg:col-span-3">
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <ReactEmailEditor
              ref={emailEditorRef}
              onReady={onReady}
              minHeight={500}
              options={{
                displayMode: 'email',
                locale: 'en',
                appearance: {
                  theme: 'light',
                  panels: {
                    tools: {
                      dock: 'left',
                    },
                  },
                },
                mergeTags: [
                  {
                    name: 'Customer Name',
                    value: '{{customer_name}}',
                    sample: 'Nguyễn Văn A',
                  },
                  {
                    name: 'Customer Email',
                    value: '{{customer_email}}',
                    sample: 'example@email.com',
                  },
                  {
                    name: 'Company Name',
                    value: '{{company_name}}',
                    sample: 'Công ty ABC',
                  },
                  {
                    name: 'Current Date',
                    value: '{{current_date}}',
                    sample: new Date().toLocaleDateString('vi-VN'),
                  },
                  {
                    name: 'Unsubscribe Link',
                    value: '{{unsubscribe_link}}',
                    sample: 'https://example.com/unsubscribe',
                  },
                ],
              }}
            />
          </div>

          {/* Text Version */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Phiên bản text (cho email client không hỗ trợ HTML)
            </label>
            <textarea
              value={localContent.text}
              onChange={(e) => handleContentChange('text', e.target.value)}
              className="w-full h-24 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Phiên bản text của email..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Variables */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="font-medium mb-3">Biến cá nhân hóa</h3>
            <div className="space-y-2">
              {variables.map((variable) => (
                <div
                  key={variable.key}
                  className="p-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="font-medium">{variable.label}</div>
                  <div className="text-xs text-gray-500">{`{{${variable.key}}}`}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Xem trước</h3>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div
                className={`border border-gray-300 rounded overflow-hidden ${
                  previewMode === 'mobile' ? 'max-w-sm' : ''
                }`}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: localContent.html
                      .replace(/\{\{customer_name\}\}/g, 'Nguyễn Văn A')
                      .replace(/\{\{customer_email\}\}/g, 'example@email.com')
                      .replace(/\{\{company_name\}\}/g, 'Công ty ABC')
                      .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('vi-VN'))
                      .replace(/\{\{unsubscribe_link\}\}/g, '#'),
                  }}
                  className="p-4 bg-white text-sm"
                  style={{
                    fontSize: previewMode === 'mobile' ? '14px' : '16px',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
