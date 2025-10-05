import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown, Edit, Save, Trash2, Plus, X } from "lucide-react";
import { PaymentMethod, OrderStatus, mockEmployees, sampleProducts } from "@/lib/data";

export function OrderForm({
  mode = "view",
  order = null,
  onClose,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    orderDate: "",
    totalAmount: "",
    paymentMethod: PaymentMethod.cash,
    status: OrderStatus.new,
  });

  const [orderDetails, setOrderDetails] = useState([
    {
      id: Date.now(),
      productId: "",
      productName: "",
      quantity: 1,
      price: 0
    }
  ]);

  const [editMode, setEditMode] = useState(mode === "edit");

  useEffect(() => {
    if (order) {
      setForm({
        customerId: order.customerId || "",
        customerName: order.customerName || "",
        orderDate: order.orderDate || "",
        totalAmount: order.totalAmount || "",
        paymentMethod: order.paymentMethod || PaymentMethod.cash,
        status: order.status || OrderStatus.new,
      });

      if (order.orderDetails && order.orderDetails.length > 0) {
        setOrderDetails(order.orderDetails);
      }
    }
    setEditMode(mode === "edit");
  }, [order, mode]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCancel = () => {
    if (order) {
      setForm({
        customerId: order.customerId || "",
        customerName: order.customerName || "",
        orderDate: order.orderDate || "",
        totalAmount: order.totalAmount || "",
        paymentMethod: order.paymentMethod || PaymentMethod.cash,
        status: order.status || OrderStatus.new,
      });
      if (order.orderDetails) {
        setOrderDetails(order.orderDetails);
      }
    }
    setEditMode(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customerName || orderDetails.length === 0) {
      alert("Vui lòng nhập tên khách hàng và ít nhất một sản phẩm");
      return;
    }

    const totalAmount = orderDetails.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);

    const updated = {
      ...form,
      totalAmount,
      id: order?.id,
      orderDetails: orderDetails.map(detail => ({
        ...detail,
        orderId: order?.id
      }))
    };

    onSave(updated);
    setEditMode(false);
  };

  const addOrderDetail = () => {
    setOrderDetails(prev => [...prev, {
      id: Date.now(),
      productId: "",
      productName: "",
      quantity: 1,
      price: 0
    }]);
  };

  const removeOrderDetail = (index) => {
    setOrderDetails(prev => prev.filter((_, i) => i !== index));
  };

  const updateOrderDetail = (index, field, value) => {
    setOrderDetails(prev => prev.map((detail, i) => {
      if (i === index) {
        const updated = { ...detail, [field]: value };
        
        // Auto-fill product name and price when product is selected
        if (field === 'productId') {
          const product = sampleProducts.find(p => p.id === parseInt(value));
          if (product) {
            updated.productName = product.name;
            updated.price = product.price;
          }
        }
        
        return updated;
      }
      return detail;
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalAmount = orderDetails.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Info */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Tên khách hàng</label>
              <input
                disabled={!editMode}
                value={form.customerName}
                onChange={handleChange("customerName")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                placeholder="Nhập tên khách hàng"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium mb-1">Ngày đặt hàng</label>
              <input
                disabled={!editMode}
                type="date"
                value={form.orderDate}
                onChange={handleChange("orderDate")}
                className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Phương thức thanh toán</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!editMode}>
                  <div
                    className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                      !editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                    }`}
                  >
                    <span className="text-sm">{form.paymentMethod}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                >
                  {Object.entries(PaymentMethod).map(([key, value]) => (
                    <DropdownMenuItem
                      key={key}
                      onSelect={() => setForm((f) => ({ ...f, paymentMethod: value }))}
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
                    className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                      !editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                    }`}
                  >
                    <span className="text-sm">{form.status}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {Object.entries(OrderStatus).map(([key, value]) => (
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
            <label className="block text-sm font-medium mb-1">Tổng giá trị</label>
            <input
              disabled
              value={formatCurrency(totalAmount)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Order Details */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Chi tiết đơn hàng</h3>
            {editMode && (
              <Button type="button" onClick={addOrderDetail} variant="actionCreate" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Thêm sản phẩm
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {orderDetails.map((detail, index) => (
              <div key={detail.id} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                <div className="col-span-4">
                  <label className="block text-sm font-medium mb-1">Sản phẩm</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={!editMode}>
                      <div
                        className={`flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg ${
                          !editMode ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"
                        }`}
                      >
                        <span className="text-sm truncate">{detail.productName || "Chọn sản phẩm"}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                      {sampleProducts.map((product) => (
                        <DropdownMenuItem
                          key={product.id}
                          onSelect={() => updateOrderDetail(index, 'productId', product.id)}
                        >
                          {product.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Số lượng</label>
                  <input
                    disabled={!editMode}
                    type="number"
                    min="1"
                    value={detail.quantity}
                    onChange={(e) => updateOrderDetail(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Giá</label>
                  <input
                    disabled={!editMode}
                    type="number"
                    value={detail.price}
                    onChange={(e) => updateOrderDetail(index, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Thành tiền</label>
                  <input
                    disabled
                    value={formatCurrency(detail.quantity * detail.price)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div className="col-span-1">
                  {editMode && (
                    <Button
                      type="button"
                      variant="actionDelete"
                      size="sm"
                      onClick={() => removeOrderDetail(index)}
                      className="w-full h-10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 mt-6">
          {!editMode ? (
            <>
              <Button variant="actionUpdate" onClick={() => setEditMode(true)}>
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
              <Button variant="actionDelete" onClick={() => onDelete(order.id)}>
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

export default OrderForm;
