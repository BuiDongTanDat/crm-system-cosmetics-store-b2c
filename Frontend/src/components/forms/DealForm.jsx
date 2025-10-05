import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2 } from "lucide-react";
import { mockEmployees, sampleProducts } from "@/lib/data";

const priorityOptions = [
  { value: 'high', label: 'Cao' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'low', label: 'Thấp' }
];

const sourceOptions = [
  'Website', 'Facebook', 'Instagram', 'Google Ads', 'Zalo', 'Giới thiệu', 'Email', 'Điện thoại'
];

export function DealForm({
  mode = "view",
  deal = null,
  onClose,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState({
    title: "",
    customer: "",
    email: "",
    phone: "",
    value: "",
    source: "Website",
    assigneeId: "",
    assignee: "",
    priority: "medium",
    products: [],
    notes: "",
    stage: "leads"
  });

  const [editMode, setEditMode] = useState(mode === "edit");

  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title || "",
        customer: deal.customer || "",
        email: deal.email || "",
        phone: deal.phone || "",
        value: deal.value || "",
        source: deal.source || "Website",
        assigneeId: deal.assigneeId || "",
        assignee: deal.assignee || "",
        priority: deal.priority || "medium",
        products: deal.products || [],
        notes: deal.notes || "",
        stage: deal.stage || "leads"
      });
    }
    setEditMode(mode === "edit");
  }, [deal, mode]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCancel = () => {
    if (deal) {
      setForm({
        title: deal.title || "",
        customer: deal.customer || "",
        email: deal.email || "",
        phone: deal.phone || "",
        value: deal.value || "",
        source: deal.source || "Website",
        assigneeId: deal.assigneeId || "",
        assignee: deal.assignee || "",
        priority: deal.priority || "medium",
        products: deal.products || [],
        notes: deal.notes || "",
        stage: deal.stage || "leads"
      });
    }
    setEditMode(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.customer) {
      alert("Vui lòng nhập tiêu đề và tên khách hàng");
      return;
    }

    const updated = {
      ...form,
      value: Number(form.value) || 0,
      id: deal?.id,
      createdDate: deal?.createdDate || new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0]
    };

    onSave(updated);
    setEditMode(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Tiêu đề deal</label>
            <input
              disabled={!editMode}
              value={form.title}
              onChange={handleChange("title")}
              className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
              placeholder="Nhập tiêu đề deal"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Tên khách hàng</label>
              <input
                disabled={!editMode}
                value={form.customer}
                onChange={handleChange("customer")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập tên khách hàng"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">Giá trị (VNĐ)</label>
              <input
                disabled={!editMode}
                type="number"
                value={form.value}
                onChange={handleChange("value")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                disabled={!editMode}
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="email@example.com"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Số điện thoại</label>
              <input
                disabled={!editMode}
                type="tel"
                value={form.phone}
                onChange={handleChange("phone")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="0901234567"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Nguồn</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editMode}>
                  <div
                    className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                      !editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                    }`}
                  >
                    <span className="text-sm">{form.source}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {sourceOptions.map((source) => (
                    <DropdownMenuItem
                      key={source}
                      onSelect={() => setForm((f) => ({ ...f, source }))}
                    >
                      {source}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Độ ưu tiên</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editMode}>
                  <div
                    className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                      !editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                    }`}
                  >
                    <span className="text-sm">
                      {priorityOptions.find(p => p.value === form.priority)?.label}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {priorityOptions.map((priority) => (
                    <DropdownMenuItem
                      key={priority.value}
                      onSelect={() => setForm((f) => ({ ...f, priority: priority.value }))}
                    >
                      {priority.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Người phụ trách</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editMode}>
                  <div
                    className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                      !editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                    }`}
                  >
                    <span className="text-sm">{form.assignee || "Chọn người phụ trách"}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {mockEmployees.map((employee) => (
                    <DropdownMenuItem
                      key={employee.id}
                      onSelect={() => setForm((f) => ({ 
                        ...f, 
                        assigneeId: employee.id,
                        assignee: employee.name 
                      }))}
                    >
                      {employee.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sản phẩm quan tâm</label>
            <textarea
              disabled={!editMode}
              value={form.products.join(', ')}
              onChange={(e) => setForm(prev => ({ 
                ...prev, 
                products: e.target.value.split(',').map(p => p.trim()).filter(p => p) 
              }))}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
              placeholder="Nhập các sản phẩm, cách nhau bằng dấu phẩy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <textarea
              disabled={!editMode}
              value={form.notes}
              onChange={handleChange("notes")}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
              placeholder="Ghi chú về deal..."
            />
          </div>

          {!editMode && form.value > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Giá trị deal:</span>
                <span className="text-lg font-semibold text-green-700">
                  {formatCurrency(form.value)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 mt-6">
          {!editMode ? (
            <>
              <Button variant="actionUpdate" onClick={() => setEditMode(true)}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <Button variant="actionDelete" onClick={() => onDelete(deal.id)}>
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
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
    </div>
  );
}

export default DealForm;
