import React, { useState } from 'react';
import { Eye, Code, Type, Image, Link, Palette, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailEditor({ content, onChange }) {
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'html'
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' or 'mobile'
  const [showPreview, setShowPreview] = useState(false);

  const [localContent, setLocalContent] = useState({
    html: content?.html || '',
    text: content?.text || '',
    template: content?.template || 'blank'
  });

  const handleContentChange = (field, value) => {
    const newContent = { ...localContent, [field]: value };
    setLocalContent(newContent);
    onChange(newContent);
  };

  const templates = [
    { id: 'blank', name: 'Trống', preview: 'Bắt đầu từ đầu' },
    { id: 'welcome', name: 'Chào mừng', preview: 'Email chào mừng khách hàng mới' },
    { id: 'newsletter', name: 'Bản tin', preview: 'Template bản tin định kỳ' },
    { id: 'promotion', name: 'Khuyến mãi', preview: 'Email quảng cáo sản phẩm' },
    { id: 'cart_recovery', name: 'Giỏ hàng', preview: 'Nhắc nhở giỏ hàng bỏ quên' }
  ];

  const insertVariable = (variable) => {
    const textarea = document.getElementById('html-editor');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = localContent.html;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      handleContentChange('html', newText);
    }
  };

  const variables = [
    { key: 'customer_name', label: 'Tên khách hàng' },
    { key: 'customer_email', label: 'Email khách hàng' },
    { key: 'company_name', label: 'Tên công ty' },
    { key: 'current_date', label: 'Ngày hiện tại' },
    { key: 'unsubscribe_link', label: 'Link hủy đăng ký' }
  ];

  const getTemplateContent = (templateId) => {
    const templates = {
      welcome: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Chào mừng {{customer_name}}!</h1>
          <p>Cảm ơn bạn đã đăng ký với chúng tôi. Chúng tôi rất vui được chào đón bạn!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Bắt đầu khám phá</a>
          </div>
          <p style="color: #666; font-size: 12px;">{{company_name}} - {{current_date}}</p>
        </div>
      `,
      newsletter: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Bản tin tháng này</h1>
          <p>Xin chào {{customer_name}},</p>
          <p>Đây là những cập nhật mới nhất từ chúng tôi...</p>
          <h2>Tin tức nổi bật</h2>
          <p>Nội dung tin tức...</p>
          <p style="color: #666; font-size: 12px;">{{company_name}} - {{current_date}}</p>
        </div>
      `,
      promotion: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e74c3c; text-align: center;">🔥 Ưu đãi đặc biệt!</h1>
          <p>Xin chào {{customer_name}},</p>
          <p>Đừng bỏ lỡ cơ hội giảm giá lên đến 50% cho tất cả sản phẩm!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px;">Mua ngay</a>
          </div>
          <p style="color: #666; font-size: 12px;">{{company_name}} - {{current_date}}</p>
        </div>
      `,
      cart_recovery: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Bạn quên gì đó rồi!</h1>
          <p>Xin chào {{customer_name}},</p>
          <p>Có vẻ như bạn đã để lại một số sản phẩm trong giỏ hàng. Đừng để chúng chờ đợi thêm nữa!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Hoàn tất đơn hàng</a>
          </div>
          <p style="color: #666; font-size: 12px;">{{company_name}} - {{current_date}}</p>
        </div>
      `
    };
    return templates[templateId] || '';
  };

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Chọn template</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {templates.map(template => (
            <div
              key={template.id}
              className={`p-3 border rounded-lg cursor-pointer hover:border-blue-500 ${
                localContent.template === template.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => {
                handleContentChange('template', template.id);
                if (template.id !== 'blank') {
                  handleContentChange('html', getTemplateContent(template.id));
                }
              }}
            >
              <h4 className="font-medium">{template.name}</h4>
              <p className="text-xs text-gray-600">{template.preview}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={editorMode === 'visual' ? 'default' : 'outline'}
            onClick={() => setEditorMode('visual')}
            className="gap-1"
          >
            <Type className="w-4 h-4" />
            Visual
          </Button>
          <Button
            size="sm"
            variant={editorMode === 'html' ? 'default' : 'outline'}
            onClick={() => setEditorMode('html')}
            className="gap-1"
          >
            <Code className="w-4 h-4" />
            HTML
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="lg:col-span-2">
          {editorMode === 'visual' ? (
            <div className="space-y-4">
              {/* Visual Editor Tools */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                <Button size="sm" variant="outline" className="gap-1">
                  <Type className="w-4 h-4" />
                  Text
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  <Image className="w-4 h-4" />
                  Hình ảnh
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  <Link className="w-4 h-4" />
                  Liên kết
                </Button>
                <Button size="sm" variant="outline" className="gap-1">
                  <Palette className="w-4 h-4" />
                  Màu sắc
                </Button>
              </div>

              {/* Visual Editor Area */}
              <div className="border rounded-lg p-4 min-h-[400px] bg-white">
                <div 
                  dangerouslySetInnerHTML={{ __html: localContent.html || 'Bắt đầu thiết kế email của bạn...' }}
                  className="prose max-w-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <textarea
                id="html-editor"
                value={localContent.html}
                onChange={(e) => handleContentChange('html', e.target.value)}
                className="w-full h-96 p-4 border rounded-lg font-mono text-sm"
                placeholder="Nhập HTML của email..."
              />
            </div>
          )}

          {/* Text Version */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Phiên bản text (cho email client không hỗ trợ HTML)</label>
            <textarea
              value={localContent.text}
              onChange={(e) => handleContentChange('text', e.target.value)}
              className="w-full h-24 p-3 border rounded-lg text-sm"
              placeholder="Phiên bản text của email..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Variables */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Biến cá nhân hóa</h3>
            <div className="space-y-2">
              {variables.map(variable => (
                <button
                  key={variable.key}
                  onClick={() => insertVariable(variable.key)}
                  className="w-full text-left p-2 text-sm border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">{variable.label}</div>
                  <div className="text-xs text-gray-500">{{'{' + variable.key + '}'}}}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="border rounded-lg p-4">
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
              
              <div className={`border rounded overflow-hidden ${previewMode === 'mobile' ? 'max-w-sm' : ''}`}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: localContent.html
                      .replace(/\{\{customer_name\}\}/g, 'Nguyễn Văn A')
                      .replace(/\{\{customer_email\}\}/g, 'example@email.com')
                      .replace(/\{\{company_name\}\}/g, 'Công ty ABC')
                      .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('vi-VN'))
                  }}
                  className="p-4 bg-white text-sm"
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
