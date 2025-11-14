import React, { useRef, useState, useEffect } from 'react';
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
import { Trash2 } from 'lucide-react';

/**
 ConfirmDialog props:
 - dùng trigger — children
 - controlled — open + onOpenChange
 */
export default function ConfirmDialog({
  children,
  open: externalOpen,          // nếu parent truyền open,
  onOpenChange: externalSetOpen, // thì dùng controlled mode
  title = 'Xác nhận',
  description = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
  onConfirm = () => { },
  onCancel = () => { },
  loading = false,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmIcon: ConfirmIcon = Trash2, // default icon
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const justConfirmedRef = useRef(false);

  // Chế độ determine: ưu tiên controlled nếu props `externalOpen` tồn tại
  const isControlled = externalOpen !== undefined;

  const realOpen = isControlled ? externalOpen : internalOpen;
  const setRealOpen = isControlled ? externalSetOpen : setInternalOpen;

  // đảm bảo khi externalOpen thay đổi thì logic cũ vẫn ok
  useEffect(() => {
    if (isControlled) {
      if (!externalOpen) justConfirmedRef.current = false;
    }
  }, [externalOpen]);

  const handleOpenChange = (val) => {
    // nếu đóng và không phải do confirm → chạy onCancel()
    if (!val && !justConfirmedRef.current) {
      onCancel?.();
    }

    if (!val) justConfirmedRef.current = false;
    setRealOpen(val);
  };

  const handleConfirm = async () => {
    justConfirmedRef.current = true;

    try {
      await onConfirm?.();
    } catch (err) {
      console.error('Confirm action failed:', err);
    } finally {
      justConfirmedRef.current = false;
      setRealOpen(false);
    }
  };

  return (
    <Dialog open={realOpen} onOpenChange={handleOpenChange}>
      {/* MODE A: nếu có children -> dùng như trigger */}
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
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              {cancelText}
            </Button>
          </DialogClose>

          <Button
            onClick={handleConfirm}
            variant="actionDelete"
            disabled={loading}
          >
            {ConfirmIcon && <ConfirmIcon className="w-4 h-4 mr-1" />}
            {loading ? `${confirmText}...` : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
