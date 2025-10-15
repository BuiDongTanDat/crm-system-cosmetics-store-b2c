import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2 } from "lucide-react";
import { Category, ProductStatus } from "@/lib/data";

const DEFAULT_FIELDS = [
  "Tên sản phẩm",
  "Thương hiệu",
  "Giá hiện tại",
  "Giá gốc",
  "Giảm giá",
  "Ảnh",
  "Link sản phẩm",
  "Mô tả ngắn",
  "Rating",
  "Số lượt đánh giá",
  "Mua/tháng",
  "Tiến độ bán",
  "Ưu đãi/Quà tặng",
  "Nguồn",
  "Giá hiện tại_extra",
  "Mô tả",
  "Thông số",
  "HDSD",
  "Thành phần",
  "Đánh giá",
];

export function ProductForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
  columns = null,
}) {
  const fields =
    columns && Array.isArray(columns) && columns.length
      ? columns
      : DEFAULT_FIELDS;
  const [form, setForm] = useState({});

  useEffect(() => {
    // initialize with provided data or empty keys
    const base = {};
    fields.forEach((f) => {
      base[f] = data?.[f] ?? "";
    });
    setForm(base);
  }, [data, columns, mode]); // Thêm mode vào dependency

  const handleSubmit = () => {
    if (!form["Tên sản phẩm"] || !form["Giá hiện tại"]) {
      alert("Vui lòng nhập tên và giá sản phẩm");
      return;
    }

    const updated = {
      ...form,
      "Giá hiện tại": Number(form["Giá hiện tại"]),
      "Số lượng": Number(form["Số lượng"] || 0),
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

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="flex flex-col h-[60vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {fields.map((f) => (
              <div key={f} style={{ display: "flex", flexDirection: "column" }}>
                <label className="block text-sm font-medium mb-1">{f}</label>
                {f === "Mô tả" ||
                f === "Đánh giá" ||
                f === "Thông số" ||
                f === "HDSD" ? (
                  <textarea
                    disabled={mode === "view"}
                    value={form[f] ?? ""}
                    onChange={(e) => handleChange(f, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Mô tả sản phẩm..."
                  />
                ) : (
                  <input
                    disabled={mode === "view"}
                    value={form[f] ?? ""}
                    onChange={(e) => handleChange(f, e.target.value)}
                    className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                    placeholder={`Nhập ${f.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
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