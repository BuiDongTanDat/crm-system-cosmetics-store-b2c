import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function AppDialog({
  open,
  onClose,
  title,
  mode: initialMode = "view",
  FormComponent,
  data = null,
  maxWidth = "sm:max-w-3xl",
  onSave,
  onDelete,
  ...additionalProps
}) {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  if (!FormComponent) {
    console.error("AppDialog cần prop FormComponent để hiển thị nội dung form.");
    return null;
  }

  const getTitle = () => {
    if (typeof title === "string") return title;
    return (
      title?.[mode] ||
      title?.view ||
      (mode === "edit" ? "Chỉnh sửa" : mode === "create" ? "Thêm mới" : "Chi tiết")
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`${maxWidth} w-full max-h-[90vh] p-0 overflow-hidden 
        animate-in fade-in-80 zoom-in-95 duration-300`}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="sticky top-0 z-10 bg-white border-b p-6 pb-4">
          <DialogTitle>{getTitle()}</DialogTitle>

          <DialogClose asChild onClick={onClose}>
            <button
              className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-gray-800 
              hover:bg-gray-100 transition-colors duration-150"
              aria-label="Đóng"
            >
              <X className="h-5 w-5 text-destructive" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/*Form tự kiểm soát bố cục và scroll */}
        <FormComponent
          mode={mode}
          setMode={setMode}
          data={data}
          onSave={onSave}
          onDelete={onDelete}
          onClose={onClose}
          {...additionalProps}
        />
      </DialogContent>
    </Dialog>
  );
}