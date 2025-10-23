import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Bug, Download, SquarePen } from 'lucide-react';

export default function SuccessDialog({
  open = false,
  message = 'Thao tác thành công.',
  onClose = () => { },
  title = 'Thành công',
}) {
  const renderContent = () => {
    if (!message) return <p>Không có thông tin.</p>;

    if (typeof message === 'string') {
      return <p style={{ margin: 0 }}>{message}</p>;
    }

    if (Array.isArray(message)) {
      return (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {message.map((m, i) => <li key={i}>{String(m)}</li>)}
        </ul>
      );
    }

    // Nếu message có cấu trúc { message: '...', result: { imported, updated, failed, errors: [...] } }
    if (message && typeof message === 'object') {
      const msgText = message.message || '';
      const result = message.result || {};
      const { imported = 0, updated = 0, failed = 0, errors = [] } = result;

      return (
        <div className="text-sm leading-relaxed">
          {/* {msgText && (
            <p className="font-semibold text-foreground mb-2">{msgText}</p>
          )} */}

          <div className="bg-muted/40 rounded-xl p-3 border border-border mb-3">
            <p className="m-0">
              <Download className="inline w-4 h-4 mr-1 text-green-600" />
              Số sản phẩm đã thêm: <strong>{imported}</strong> <br />
              <SquarePen className="inline w-4 h-4 mr-1 text-blue-600" />
              Số sản phẩm đã cập nhật: <strong>{updated}</strong> <br />
              <Bug className="inline w-4 h-4 mr-1 text-red-600" />
              Thất bại: <strong>{failed}</strong>
            </p>
          </div>

          {errors.length > 0 && (
            <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/30">
              <p className="font-semibold text-destructive mb-2">
                Chi tiết lỗi ({errors.length}):
              </p>
              <ul className="list-disc pl-5 space-y-2">
                {errors.map((err, idx) => (
                  <li key={idx} className="text-destructive">
                    <div><strong>Dòng:</strong> {err.row ?? 'N/A'}</div>
                    {err.field && <div><strong>Trường:</strong> {err.field}</div>}
                    <div><strong>Lỗi:</strong> {err.message ?? JSON.stringify(err)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }


    try {
      if (message.response && (message.response.data || message.message)) {
        const resp = message.response.data || message.message;
        if (typeof resp === 'string') return <p style={{ margin: 0 }}>{resp}</p>;
        return <pre style={preStyle}>{JSON.stringify(resp, null, 2)}</pre>;
      }
    } catch (e) {
      // ignore
    }

    return <pre style={preStyle}>{JSON.stringify(message, null, 2)}</pre>;
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="flex items-start justify-between text-green-700">
          <div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-2">
          <DialogDescription asChild>
            <div className="text-[16px]">{renderContent()}</div>
          </DialogDescription>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={onClose} variant="outline">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const preStyle = {
  background: '#f0fdf4',
  padding: 10,
  borderRadius: 4,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
};
