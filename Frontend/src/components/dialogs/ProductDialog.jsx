import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ProductForm } from "@/components/forms/ProductForm";
import { X } from "lucide-react";

export default function ProductDialog({ modal, closeModal, handleSave, handleDelete }) {
  return (
    <Dialog open={modal.open} onOpenChange={closeModal}>
      <DialogContent
        className="sm:max-w-lg w-full max-h-[90vh] p-0 overflow-hidden
        animate-in fade-in-80 zoom-in-95 duration-300"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Fixed Header */}
        <DialogHeader className="sticky top-0 z-10 bg-white border-b p-6 pb-4">
          <DialogTitle>
            {modal.mode === "view"
              ? "Chi tiết sản phẩm"
              : modal.mode === "edit"
              ? "Sửa sản phẩm"
              : "Thêm sản phẩm mới"}
          </DialogTitle>

          <DialogClose
            asChild
            onClick={closeModal}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-gray-800 
              hover:bg-gray-100 transition-colors duration-150"
              aria-label="Đóng"
            >
              <X className="h-5 w-5 text-destructive" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 pt-0">
          <ProductForm
            mode={modal.mode}
            product={modal.product}
            onClose={closeModal}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
