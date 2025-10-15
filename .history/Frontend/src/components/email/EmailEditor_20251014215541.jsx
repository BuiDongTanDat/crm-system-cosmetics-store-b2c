import React, { useRef, useEffect } from 'react';
import EmailEditor from 'react-email-editor';
import { Button } from '@/components/ui/button';

export default function EmailEditorWrapper({ content, onChange }) {
  const emailEditorRef = useRef(null);

  const exportHtml = () => {
    emailEditorRef.current.editor.exportHtml((data) => {
      const { design, html } = data;
      onChange?.({ html, design });
    });
  };

  const loadTemplate = () => {
    if (content?.design) {
      emailEditorRef.current.editor.loadDesign(content.design);
    } else {
      emailEditorRef.current.editor.loadDesign({
        body: {
          rows: [
            {
              columns: [
                {
                  contents: [
                    {
                      type: 'text',
                      values: { text: 'Chào mừng {{customer_name}}!' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      });
    }
  };

  useEffect(() => {
    loadTemplate();
  }, []);

  return (
    <div>
      <div style={{ height: '600px' }}>
        <EmailEditor ref={emailEditorRef} />
      </div>
      <Button onClick={exportHtml}>Lưu / Xuất HTML</Button>
    </div>
  );
}
