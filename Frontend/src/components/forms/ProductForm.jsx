import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2 } from "lucide-react";
import { Category, ProductStatus } from "@/lib/data";

export function ProductForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
}) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: Category.cosmetics,
    status: ProductStatus.available,
    description: "",
    image: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        price: data.price || "",
        stock: data.stock || "",
        category: data.category || Category.cosmetics,
        status: data.status || ProductStatus.available,
        description: data.description || "",
        image: data.image || "",
      });
    } else {
      // Reset form khi không có data (mode add)
      setForm({
        name: "",
        price: "",
        stock: "",
        category: Category.cosmetics,
        status: ProductStatus.available,
        description: "",
        image: "",
      });
    }
  }, [data, mode]); // Thêm mode vào dependency

  const handleSubmit = () => {
    if (!form.name || !form.price) {
      alert("Vui lòng nhập tên và giá sản phẩm");
      return;
    }

    const updated = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock || 0),
      id: data?.id,
    };

    onSave(updated);

    // Không cần chuyển mode ở đây nữa vì ProductPage sẽ xử lý
  };

  const handleCancel = () => {
    if (data) {
      // Reset về dữ liệu gốc
      setForm({
        name: data.name || "",
        price: data.price || "",
        stock: data.stock || "",
        category: data.category || Category.cosmetics,
        status: data.status || ProductStatus.available,
        description: data.description || "",
        image: data.image || "",
      });
    }
    setMode?.("view");
  };

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
              <input
                disabled={mode === "view"}
                value={form.name}
                onChange={handleChange("name")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Giá (VNĐ)</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  value={form.price}
                  onChange={handleChange("price")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">Số lượng</label>
                <input
                  disabled={mode === "view"}
                  type="number"
                  value={form.stock}
                  onChange={handleChange("stock")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Thể loại</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view"
                        ? "bg-gray-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-blue-500"
                        }`}
                    >
                      <span className="text-sm">{form.category}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {Object.entries(Category).map(([key, value]) => (
                      <DropdownMenuItem
                        key={key}
                        onSelect={() => setForm((f) => ({ ...f, category: value }))}
                      >
                        {value}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="w-40">
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${mode === "view"
                        ? "bg-gray-50 cursor-not-allowed"
                        : "cursor-pointer hover:border-blue-500"
                        }`}
                    >
                      <span className="text-sm">{form.status}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {Object.entries(ProductStatus).map(([key, value]) => (
                      <DropdownMenuItem
                        key={key}
                        onSelect={() => setForm((f) => ({ ...f, status: value }))}
                      >
                        {value}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea
                disabled={mode === "view"}
                value={form.description}
                onChange={handleChange("description")}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Mô tả sản phẩm..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="border-t bg-white p-6 flex-shrink-0">
        <div className="flex justify-end gap-3">
          {mode === "view" ? (
            <>
              <Button variant="actionUpdate" onClick={() => setMode?.("edit")}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <Button variant="actionDelete" onClick={() => onDelete(data?.id)}>
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Hủy
              </Button>
              <Button onClick={handleSubmit} variant="actionUpdate">
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductForm;