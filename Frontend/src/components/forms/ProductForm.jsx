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
  product = null,
  onClose,
  onSave,
  onDelete,
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

  const [editMode, setEditMode] = useState(mode === "edit");

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        price: product.price || "",
        stock: product.stock || "",
        category: product.category || Category.cosmetics,
        status: product.status || ProductStatus.available,
        description: product.description || "",
        image: product.image || "",
      });
    }
  }, [product]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert("Vui lòng nhập tên và giá sản phẩm");
      return;
    }

    const updated = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock || 0),
      id: product?.id,
    };

    onSave(updated);
    setEditMode(false); //Quay về view mode sau khi lưu
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* --------- Form content --------- */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
          <input
            disabled={!editMode}
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
              disabled={!editMode}
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
              disabled={!editMode}
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
              <DropdownMenuTrigger asChild disabled={!editMode}>
                <div
                  className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${!editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                    }`}
                >
                  <span className="text-sm">{form.category}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
              >
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
              <DropdownMenuTrigger asChild disabled={!editMode}>
                <div
                  className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${!editMode
                      ? "bg-gray-50 cursor-not-allowed"
                      : "cursor-pointer hover:border-blue-500"
                    }`}
                >
                  <span className="text-sm">{form.status}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[var(--radix-dropdown-menu-trigger-width)]"
              >
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
            disabled={!editMode}
            value={form.description}
            onChange={handleChange("description")}
            rows={4}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
            placeholder="Mô tả sản phẩm..."
          />
        </div>
      </div>

      {/* --------- Action --------- */}
      <div className="flex justify-end gap-3 mt-4">
        {!editMode ? (
          <>
            <Button variant="actionUpdate" onClick={() => setEditMode(true)}>
              <Edit className="w-4 h-4" />
              Chỉnh sửa
            </Button>
            <Button
              variant="actionDelete"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditMode(false)}
            >

              Hủy
            </Button>
            <Button type="submit" variant="actionUpdate">
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
export default ProductForm;