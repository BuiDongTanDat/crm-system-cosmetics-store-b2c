import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Trash, Trash2 } from 'lucide-react';

// ConfirmDialog props:
// children - trigger element (asChild)
// title, description, onConfirm, onCancel, loading, confirmText, cancelText
export default function ConfirmDialog({
  children,
  title = 'Xác nhận',
  description = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
  onConfirm = () => { },
  onCancel = () => { },
  loading = false,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
}) {
  const [open, setOpen] = useState(false);
  const justConfirmedRef = useRef(false);

  const handleOpenChange = (val) => {
    // nếu đóng và không do confirm thì gọi onCancel
    if (!val && !justConfirmedRef.current) {
      onCancel?.();
    }
    // reset flag khi đóng
    if (!val) justConfirmedRef.current = false;
    setOpen(val);
  };

  const handleConfirm = async () => {
    justConfirmedRef.current = true;
    try {
      // đảm bảo không dùng giá trị trả về từ onConfirm làm children
      await onConfirm?.();
    } catch (e) {
      // cho parent xử lý lỗi
      console.error('Confirm action failed', e);
    } finally {
      // đóng dialog PROGRAMMATICALLY sau khi onConfirm resolve/reject
      justConfirmedRef.current = false;
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex items-start text-destructive justify-between">
          <div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-2">
          <DialogDescription>

            {description}

          </DialogDescription>
        </div>

        <DialogFooter className="mt-4 space-x-2">
          {/* Hủy: đóng dialog ngay lập tức */}
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              {cancelText}
            </Button>
          </DialogClose>

          {/* Xác nhận: gọi handler, await và sau đó đóng dialog programmatic */}
          <Button onClick={handleConfirm} variant="actionDelete" disabled={loading}>
            <Trash2 className="w-4 h-4 " />
            {loading ? `${confirmText}...` : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
