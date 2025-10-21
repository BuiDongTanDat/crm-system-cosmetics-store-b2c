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

export default function SuccessDialog({
  open = false,
  message = 'Thao tác thành công.',
  onClose = () => {},
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
          <Button onClick={onClose} variant="actionCreate">
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
