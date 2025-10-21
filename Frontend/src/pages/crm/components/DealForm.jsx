import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2 } from "lucide-react";
import { mockEmployees } from "@/lib/data";
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';

const priorityOptions = [
  { value: 'high', label: 'Cao' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'low', label: 'Thấp' }
];

const sourceOptions = [
  'Website', 'Facebook', 'Instagram', 'Google Ads', 'Zalo', 'Giới thiệu', 'Email', 'Điện thoại'
];

const statusOptions = [
  { value: 'leads', label: 'Leads', stage: 'leads' },
  { value: 'contacted', label: 'Contacted', stage: 'contacted' },
  { value: 'qualified', label: 'Qualified', stage: 'qualified' },
  { value: 'nurturing ', label: 'Nurturing', stage: 'nurturing ' },
  { value: 'converted', label: 'Converted', stage: 'converted' },
  { value: 'closed-lost', label: 'Closed-Lost', stage: 'closed-lost' }
];

export function DealForm({
  mode = "view",
  data = null,
  onSave,
  onDelete,
  setMode,
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
    stage: "leads",
    status: "leads"
  });

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || "",
        customer: data.customer || "",
        email: data.email || "",
        phone: data.phone || "",
        value: data.value || "",
        source: data.source || "Website",
        assigneeId: data.assigneeId || "",
        assignee: data.assignee || "",
        priority: data.priority || "medium",
        products: data.products || [],
        notes: data.notes || "",
        stage: data.stage || "leads",
        status: data.status || data.stage || "leads"
      });
    }
  }, [data]);

  const handleCancel = () => {
    if (data) {
      setForm({
        title: data.title || "",
        customer: data.customer || "",
        email: data.email || "",
        phone: data.phone || "",
        value: data.value || "",
        source: data.source || "Website",
        assigneeId: data.assigneeId || "",
        assignee: data.assignee || "",
        priority: data.priority || "medium",
        products: data.products || [],
        notes: data.notes || "",
        stage: data.stage || "leads",
        status: data.status || data.stage || "leads"
      });
    }
    setMode?.("view");
  };

  const handleStatusChange = (newStatus) => {
    const statusOption = statusOptions.find(s => s.value === newStatus);
    setForm(prev => ({
      ...prev,
      status: newStatus,
      stage: statusOption?.stage || newStatus
    }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.customer) {
      toast.error("Vui lòng nhập tiêu đề và tên khách hàng");
      return;
    }

    const updated = {
      ...form,
      value: Number(form.value) || 0,
      id: data?.id,
      createdDate: data?.createdDate || new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0]
    };

    const isCreating = !data?.id;
    
    onSave(updated);
    
    // Nếu là update, chuyển về view mode
    if (!isCreating) {
      setMode?.("view");
    }
  };

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề deal</label>
              <input
                disabled={mode === "view"}
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
                  disabled={mode === "view"}
                  value={form.customer}
                  onChange={handleChange("customer")}
                  className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">Giá trị (VNĐ)</label>
                <input
                  disabled={mode === "view"}
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
                  disabled={mode === "view"}
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
                  disabled={mode === "view"}
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
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                        mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                      }`}
                    >
                      <span className="text-sm">{form.source}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
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
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                        mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                      }`}
                    >
                      <span className="text-sm">
                        {statusOptions.find(s => s.value === form.status)?.label}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
                    {statusOptions.map((status) => (
                      <DropdownMenuItem
                        key={status.value}
                        onSelect={() => handleStatusChange(status.value)}
                      >
                        {status.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Độ ưu tiên</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                        mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                      }`}
                    >
                      <span className="text-sm">
                        {priorityOptions.find(p => p.value === form.priority)?.label}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
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
                  <DropdownMenuTrigger asChild disabled={mode === "view"}>
                    <div
                      className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                        mode === "view" ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                      }`}
                    >
                      <span className="text-sm">{form.assignee || "Chọn người phụ trách"}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
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
                disabled={mode === "view"}
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
                disabled={mode === "view"}
                value={form.notes}
                onChange={handleChange("notes")}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Ghi chú về deal..."
              />
            </div>

            {mode === "view" && form.value > 0 && (
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
              <ConfirmDialog
                title="Xác nhận xóa"
                description={<>Bạn có chắc chắn muốn xóa deal <span className="font-semibold">{data?.title}</span>?</>}
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={() => onDelete?.(data?.id)}
              >
                <Button variant="actionDelete">
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </ConfirmDialog>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCancel}>
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

export default DealForm;
