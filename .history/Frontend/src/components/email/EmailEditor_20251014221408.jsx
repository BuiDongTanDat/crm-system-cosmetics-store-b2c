import React, { useState, useCallback } from 'react';
import { Eye, Download, Upload, Smartphone, Monitor, Type, Bold, Italic, Link, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailEditor({ content, onChange }) {
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'html'

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

  const loadTemplate = (templateId) => {
    const templates = {
      welcome: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">Chào mừng {{customer_name}}!</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">Cảm ơn bạn đã đăng ký với chúng tôi. Chúng tôi rất vui được chào đón bạn!</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Bắt đầu khám phá</a>
          </div>
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px;">{{company_name}} - {{current_date}}</p>
          </div>
        </div>
      `,
      newsletter: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Bản tin tháng này</h1>
          <p style="color: #666; font-size: 16px; margin-bottom: 15px;">Xin chào {{customer_name}},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Đây là những cập nhật mới nhất từ chúng tôi trong tháng này. Chúng tôi có nhiều tin tức thú vị để chia sẻ với bạn.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; font-size: 20px; margin-bottom: 15px;">📢 Tin tức nổi bật</h2>
            <p style="color: #666; font-size: 14px; line-height: 1.5;">Nội dung tin tức và cập nhật sản phẩm sẽ được đặt ở đây...</p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px;">{{company_name}} - {{current_date}}</p>
          </div>
        </div>
      `,
      promotion: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #e74c3c; font-size: 32px; margin-bottom: 15px;">🔥 Ưu đãi đặc biệt!</h1>
              <p style="color: #666; font-size: 18px;">Xin chào {{customer_name}},</p>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 15px;">Đừng bỏ lỡ cơ hội giảm giá lên đến <strong style="color: #e74c3c;">50%</strong> cho tất cả sản phẩm!</p>
            </div>
            
            <div style="background: #fff3cd; border: 2px dashed #ffc107; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="color: #856404; font-size: 14px; margin: 0;">Mã giảm giá: <strong style="font-size: 18px;">SALE50</strong></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(231,76,60,0.3);">Mua ngay</a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px;">{{company_name}} - {{current_date}}</p>
            </div>
          </div>
        </div>
      `,
      cart_recovery: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 15px;">🛒 Bạn quên gì đó rồi!</h1>
            <p style="color: #666; font-size: 16px;">Xin chào {{customer_name}},</p>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-top: 15px;">Có vẻ như bạn đã để lại một số sản phẩm trong giỏ hàng. Đừng để chúng chờ đợi thêm nữa!</p>
          </div>
          
          <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Sản phẩm trong giỏ hàng của bạn:</h3>
            <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
              <p style="color: #666; margin: 5px 0;">• Sản phẩm 1 - 299,000đ</p>
              <p style="color: #666; margin: 5px 0;">• Sản phẩm 2 - 199,000đ</p>
            </div>
            <p style="color: #333; font-weight: bold; margin: 0;">Tổng cộng: 498,000đ</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Hoàn tất đơn hàng</a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px;">{{company_name}} - {{current_date}}</p>
          </div>
        </div>
      `,
    };

    const templateContent = templates[templateId] || '';
    handleContentChange('html', templateContent);
    handleContentChange('template', templateId);
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('html-editor');
    if (textarea && editorMode === 'html') {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = localContent.html;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      handleContentChange('html', newText);
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    } else {
      // Fallback: append to end
      handleContentChange('html', localContent.html + ` {{${variable}}}`);
    }
  };

  const insertHtmlElement = (element) => {
    const templates = {
      heading: '<h2 style="color: #333; font-size: 20px; margin: 20px 0 10px 0;">Tiêu đề của bạn</h2>',
      paragraph: '<p style="color: #666; font-size: 16px; line-height: 1.6; margin: 10px 0;">Nội dung đoạn văn của bạn...</p>',
      button: '<div style="text-align: center; margin: 20px 0;"><a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Nút bấm</a></div>',
      image: '<div style="text-align: center; margin: 20px 0;"><img src="https://via.placeholder.com/400x200" alt="Hình ảnh" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>',
      divider: '<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />',
      spacer: '<div style="height: 30px;"></div>',
    };

    const elementHtml = templates[element] || '';
    handleContentChange('html', localContent.html + elementHtml);
  };

  const templates = [
    { id: 'blank', name: 'Trống', preview: 'Bắt đầu từ đầu' },
    { id: 'welcome', name: 'Chào mừng', preview: 'Email chào mừng khách hàng mới' },
    { id: 'newsletter', name: 'Bản tin', preview: 'Template bản tin định kỳ' },
    { id: 'promotion', name: 'Khuyến mãi', preview: 'Email quảng cáo sản phẩm' },
    { id: 'cart_recovery', name: 'Giỏ hàng', preview: 'Nhắc nhở giỏ hàng bỏ quên' },
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                  handleContentChange('html', '');
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
            variant={editorMode === 'visual' ? 'default' : 'outline'}
            onClick={() => setEditorMode('visual')}
            className="gap-1"
          >
            <Eye className="w-4 h-4" />
            Visual
          </Button>
          <Button
            size="sm"
            variant={editorMode === 'html' ? 'default' : 'outline'}
            onClick={() => setEditorMode('html')}
            className="gap-1"
          >
            <Type className="w-4 h-4" />
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Editor */}
        <div className="lg:col-span-3">
          {editorMode === 'visual' ? (
            <div className="space-y-4">
              {/* Visual Editor Tools */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => insertHtmlElement('heading')}
                  className="gap-1"
                >
                  <Type className="w-4 h-4" />
                  Tiêu đề
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => insertHtmlElement('paragraph')}
                  className="gap-1"
                >
                  <Type className="w-4 h-4" />
                  Đoạn văn
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => insertHtmlElement('button')}
                  className="gap-1"
                >
                  <Type className="w-4 h-4" />
                  Nút bấm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => insertHtmlElement('image')}
                  className="gap-1"
                >
                  <Image className="w-4 h-4" />
                  Hình ảnh
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => insertHtmlElement('divider')}
                  className="gap-1"
                >
                  -
                  Đường kẻ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => insertHtmlElement('spacer')}
                  className="gap-1"
                >
                  ⎵
                  Khoảng cách
                </Button>
              </div>

              {/* Visual Preview */}
              <div className="border border-gray-300 rounded-lg p-4 min-h-[400px] bg-white">
                <div
                  dangerouslySetInnerHTML={{
                    __html: localContent.html || '<p style="color: #ccc; text-align: center; padding: 40px;">Chọn template hoặc nhập HTML để bắt đầu thiết kế...</p>',
                  }}
                  className="prose max-w-none"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                />
              </div>
            </div>
          ) : (
            <div>
              <textarea
                id="html-editor"
                value={localContent.html}
                onChange={(e) => handleContentChange('html', e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500"
                placeholder="Nhập HTML của email..."
              />
            </div>
          )}

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
                <button
                  key={variable.key}
                  onClick={() => insertVariable(variable.key)}
                  className="w-full text-left p-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{variable.label}</div>
                  <div className="text-xs text-gray-500">{`{{${variable.key}}}`}</div>
                </button>
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
              
              <div className={`border border-gray-300 rounded overflow-hidden ${previewMode === 'mobile' ? 'max-w-sm' : ''}`}>
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
