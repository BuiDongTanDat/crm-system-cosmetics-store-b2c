import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DropdownOptions from "@/components/common/DropdownOptions";
import { Input } from "@/components/ui/input";
import { Edit, Save, Trash2 } from "lucide-react";
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
              <Input
                disabled={mode === "view"}
                value={form.title}
                onChange={handleChange("title")}
                placeholder="Nhập tiêu đề deal"
                variant="normal"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Tên khách hàng</label>
                <Input
                  disabled={mode === "view"}
                  value={form.customer}
                  onChange={handleChange("customer")}
                  placeholder="Nhập tên khách hàng"
                  variant="normal"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">Giá trị (VNĐ)</label>
                <Input
                  disabled={mode === "view"}
                  type="number"
                  value={form.value}
                  onChange={handleChange("value")}
                  placeholder="0"
                  variant="normal"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  disabled={mode === "view"}
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="email@example.com"
                  variant="normal"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <Input
                  disabled={mode === "view"}
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="0901234567"
                  variant="normal"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Nguồn</label>
                <DropdownOptions
                  options={sourceOptions.map(s => ({ value: s, label: s }))}
                  value={form.source}
                  onChange={(val) => setForm(f => ({ ...f, source: val }))}
                  disabled={mode === "view"}
                  placeholder="Chọn nguồn"
                  width="w-full"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <DropdownOptions
                  options={statusOptions.map(s => ({ value: s.value, label: s.label }))}
                  value={form.status}
                  onChange={(val) => handleStatusChange(val)}
                  disabled={mode === "view"}
                  placeholder="Chọn trạng thái"
                  width="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Độ ưu tiên</label>
                <DropdownOptions
                  options={priorityOptions.map(p => ({ value: p.value, label: p.label }))}
                  value={form.priority}
                  onChange={(val) => setForm(f => ({ ...f, priority: val }))}
                  disabled={mode === "view"}
                  placeholder="Chọn độ ưu tiên"
                  width="w-full"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Người phụ trách</label>
                <DropdownOptions
                  options={mockEmployees.map(emp => ({ value: emp.id, label: emp.name }))}
                  value={form.assigneeId || ""}
                  onChange={(val) => {
                    const emp = mockEmployees.find(e => e.id === val);
                    setForm(f => ({ ...f, assigneeId: val, assignee: emp?.name || "" }));
                  }}
                  disabled={mode === "view"}
                  placeholder="Chọn người phụ trách"
                  width="w-full"
                />
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
