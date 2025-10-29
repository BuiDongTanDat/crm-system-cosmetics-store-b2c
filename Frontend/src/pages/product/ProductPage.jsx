import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Filter, List, Square, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/pages/product/components/ProductCard';
import AppDialog from '@/components/dialogs/AppDialog';
import ProductForm from '@/pages/product/components/ProductForm';
import AppPagination from '@/components/pagination/AppPagination';
import DropdownOptions from '@/components/common/DropdownOptions';
import ImportExportDropdown from '@/components/common/ImportExportDropdown';
import { getCategories } from '@/services/categories';
import { deleteProduct, getProduct, getProducts, createProduct, updateProduct, importProductsCSV, exportProductsCSV } from '@/services/products';
import ConfirmDialog from '@/components/dialogs/ConfirmDialog';
import { toast } from 'sonner';
import SuccessDialog from '@/components/dialogs/SuccessDialog';

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: 'view', product: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('card');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [successDialog, setSuccessDialog] = useState({ open: false, title: '', message: null });
  const productsPerPage = 8;
  const fileInputRef = useRef(null);


  const STATUS_FILTER_OPTIONS = [
    { value: 'all', label: 'Trạng thái' },
    { value: 'AVAILABLE', label: 'Còn hàng' },
    { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
    { value: 'DISCONTINUED', label: 'Đã ngừng' },
  ];

  //Lấy danh sách sản phẩm (simplified: use API response directly, no mapping)
  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      // Accept either plain array or { ok, data } shape
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res && res.ok) data = res.data || [];
      else if (res && res.data) data = res.data;
      if (!Array.isArray(data)) data = [];

      // keep the raw items as returned by API (no mapping)
      setProducts(data);
      return data;
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Lỗi kết nối server.');
      return [];
    }
  };

  // fetch categories cho dropdown lọc
  const fetchCategoriesForFilter = async () => {
    try {
      let res = await getCategories();
      if (Array.isArray(res)) {
        res = { ok: true, data: res };
      }
      if (!res || typeof res.ok === 'undefined') return;
      const { ok, data } = res;
      if (!ok || !Array.isArray(data)) return;

      const active = data.filter((c) => c && String(c.status) === 'ACTIVE');
      const opts = [
        { value: 'all', label: 'Danh mục' },
        ...active.map((c) => ({
          value: c.name ?? String(c.category_id ?? c.id),
          label: c.name ?? String(c.category_id ?? c.id),
        })),
      ];
      setCategoryOptions(opts);
    } catch (err) {
      console.error('Failed to load category filter options:', err);
    }
  };


  useEffect(() => {
    fetchProducts();
    fetchCategoriesForFilter();
  }, []);


  // CRUD handlers
  const openAdd = () => setModal({ open: true, mode: 'add', product: null });
  const openEdit = (p) => setModal({ open: true, mode: 'edit', product: p });
  const openView = (p) => setModal({ open: true, mode: 'view', product: p });
  const closeModal = () => setModal({ open: false, mode: 'view', product: null });

  const handleSave = async (prod) => {
    try {
      let savedItem;
      if (modal.mode === 'add') {
        // Tạo mới
        const res = await createProduct(prod);
        if (res && (res.ok || res.product_id || res.data)) {
          // Lấy lại sản phẩm vừa tạo (nếu API trả về)
          savedItem = res.data || res;
          // Nếu không có product_id thì lấy lại từ API (nếu cần)
          if (!savedItem.product_id && savedItem.id) savedItem.product_id = savedItem.id;
          setProducts((prev) => [savedItem, ...prev]);
          closeModal();
          toast.success('Thêm sản phẩm thành công!');
        }
      } else if (modal.mode === 'edit' && modal.product) {
        // Cập nhật
        const id = modal.product.product_id || prod.product_id;
        await updateProduct(id, prod);
        // Lấy lại sản phẩm vừa cập nhật (nếu API trả về)
        savedItem = { ...modal.product, ...prod, product_id: id };
        setProducts((prev) => {
          const idx = prev.findIndex((p) => (p.product_id || p.id) == id);
          if (idx !== -1) {
            const newArr = [...prev];
            newArr[idx] = savedItem;
            return newArr;
          }
          return prev;
        });
        setModal({ open: true, mode: 'view', product: savedItem });
        toast.success('Cập nhật sản phẩm thành công!');
      }
    } catch (err) {
      console.error('Save error:', err);
      // show detailed backend error if available
      const msg = err?.message || 'Lỗi khi lưu sản phẩm!';
      toast.error(String(msg));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => {
        const updatedProducts = prev.filter((p) => (p.product_id || p.id) !== id);
        // Sau khi xóa, kiểm tra nếu trang hiện tại không còn sản phẩm nào thì chuyển về trang trước đó
        const startIdx = (currentPage - 1) * productsPerPage;
        const endIdx = startIdx + productsPerPage;
        if (updatedProducts.slice(startIdx, endIdx).length === 0 && currentPage > 1) {
          setCurrentPage((p) => p - 1); // trở về trang trước
        }
        return updatedProducts;
      });
      closeModal();
      toast.success('Xóa sản phẩm thành công!');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Lỗi khi xóa sản phẩm!');
    }
  };

  // Lọc 
  const filtered = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || p.name.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / productsPerPage));
  const currentProducts = filtered.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );
  const handlePageChange = (p) => setCurrentPage(p);
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));

  //Lấy màu badge trạng thái
  const getStatusBadge = (status) =>
    status === 'AVAILABLE'
      ? 'px-2 py-1 text-xs font-medium text-success   rounded-full w-[100px] text-center inline-block bg-green-100'
      : 'px-2 py-1 text-xs font-medium text-destructive rounded-full w-[100px] text-center inline-block bg-red-100';

  // file input change -> call importProductsCSV directly (service expects field name "file")
  const handleImportFile = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) {
      toast.error('Vui lòng chọn file CSV.');
      return;
    }
    try {
      const res = await importProductsCSV(file);
      const message = res?.message || 'Import hoàn tất';
      const result = res?.result || res?.data || null;

      if (result && (result.imported > 0 || result.updated > 0)) {
        await fetchProducts();
      }

      setSuccessDialog({ open: true, title: message, message: { message, result } });
      //toast.success(message);
    } catch (err) {
      console.error('Import error:', err);
      const em = err?.message || String(err);
      toast.error(`Lỗi khi nhập CSV: ${em}`);
      setSuccessDialog({ open: true, title: 'Lỗi khi nhập CSV', message: { message: em, result: null } });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className=" flex flex-col">
      {/* Sticky header */}
      <div
        className="sticky top-[70px] z-20 flex flex-col gap-3 px-6 py-3 bg-brand/10 backdrop-blur-lg rounded-md"
        style={{ backdropFilter: 'blur' }}
      >
        {/* Cụm tiêu đề  */}
        <div className="flex items-center justify-between">
          {/* Tiêu đề bên trái */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              Quản lý Sản phẩm ({filtered.length})
            </h1>

          </div>

          {/* Các nút bên phải */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 transition-all border-gray-200 bg-white/90"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button onClick={openAdd} variant="actionCreate" className="gap-2">
              <Plus className="w-4 h-4" /> Thêm SP
            </Button>

            {/* DropdownOptions for Import/Export */}
            <ImportExportDropdown
              menuItems={[
                {
                  label: 'Nhập CSV',
                  icon: Upload,
                  action: () => fileInputRef.current?.click(),
                },
                {
                  label: 'Xuất CSV',
                  icon: Download,
                  action: async () => {
                    try {
                      const csvBlob = await exportProductsCSV();
                      if (!csvBlob) {
                        toast.error('Không có dữ liệu để xuất CSV.');
                        return;
                      }
                      const url = window.URL.createObjectURL(csvBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'products.csv';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                      //toast.success('Xuất CSV thành công! File đang được tải xuống.');
                    } catch (err) {
                      console.error('Export error:', err);
                      toast.error('Lỗi khi xuất CSV.');
                    }
                  },
                },
              ]}
              trigger="icon"
              className="px-2 py-1"
            />
            {/* hidden file input for import; name is not required here because importProductsCSV constructs FormData with 'file' */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFile}
              name="file"
            />
          </div>
        </div>

        {/* Cụm nằm dưới */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-0">
            <Button
              variant={viewMode === 'card' ? 'actionCreate' : 'actionNormal'}
              onClick={() => setViewMode('card')}
              size="icon"
              className = "rounded-none rounded-tl-md rounded-bl-md"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'actionCreate' : 'actionNormal'}
              onClick={() => setViewMode('list')}
              size="icon"
              className = "rounded-none rounded-tr-md rounded-br-md"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {/* Category filter */}
            <DropdownOptions
              options={categoryOptions}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              width="w-40"
              placeholder="Danh mục"
            />

            {/* Status filter */}
            <DropdownOptions
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              width="w-40"
              placeholder="Trạng thái"
            />
          </div>
        </div>

      </div>


      {/* Scrollable content: product cards / list, pagination, dialog */}
      <div className="flex-1 overflow-auto pt-4">
        {/* View Mode */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3 px-2">
            {currentProducts.map((p) => (
              <ProductCard
                key={p.product_id}
                product={p}
                onView={openView}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Sản phẩm',
                      'Thương hiệu',
                      'Giá hiện tại',
                      'Giá gốc',
                      'Giảm (%)',
                      'Tồn kho',
                      'Đánh giá',
                      'Trạng thái',
                      ''
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProducts.map((p) => (
                    <tr
                      key={p.product_id}
                      onMouseEnter={() => setHoveredRow(p.product_id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-2 whitespace-nowrap text-left">
                        <div className="flex items-center">
                          <img
                            src={p.image || '/images/products/product_temp.png'}
                            alt={p.name}
                            className="w-10 h-10 rounded mr-3"
                          />
                          <div>
                            <div className="font-small text-gray-900 truncate max-w-[180px]">
                              {p.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[180px]">
                              {p.short_description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center text-sm text-gray-800">{p.brand}</td>
                      <td className="text-center font-semibold">
                        {p.price_current.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="text-center text-gray-500 line-through">
                        {p.price_original ? p.price_original.toLocaleString('vi-VN') + '₫' : '-'}
                      </td>
                      <td className="text-center text-sm text-gray-800">{p.discount_percent}%</td>
                      <td className="text-center text-sm">{p.inventory_qty}</td>
                      <td className="text-center text-yellow-500">{p.rating}</td>
                      <td className="text-center">
                        <span className={getStatusBadge(p.status)}>
                          {p.status === 'AVAILABLE'
                            ? 'Còn hàng'
                            : p.status === 'OUT_OF_STOCK'
                              ? 'Hết hàng'
                              : 'Đã ngừng'}

                        </span>
                      </td>
                      <td className="text-center w-36">
                        <div
                          className={`flex justify-center gap-1  ${hoveredRow === p.product_id
                            ? 'opacity-100 animate-fade-in duration-200'
                            : 'opacity-0 pointer-events-none '
                            }`}
                        >
                          <Button variant="actionRead" size="icon" onClick={() => openView(p)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="actionUpdate" size="icon" onClick={() => openEdit(p)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <ConfirmDialog
                            title="Xác nhận xóa"
                            description={<>
                              Bạn có chắc chắn muốn xóa sản phẩm <span className="font-semibold text-black">{p?.name}</span>?
                            </>}
                            confirmText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => handleDelete(p.product_id)}
                          >
                            <Button variant="actionDelete" size="icon">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </ConfirmDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AppPagination
          totalPages={totalPages}
          currentPage={currentPage}
          handleNext={handleNext}
          handlePrev={handlePrev}
          handlePageChange={handlePageChange}
        />

        <AppDialog
          open={modal.open}
          onClose={closeModal}
          title={{
            view: `Chi tiết sản phẩm - ${modal.product?.name || ''}`,
            edit: modal.product
              ? `Chỉnh sửa sản phẩm - ${modal.product.name}`
              : 'Thêm sản phẩm mới',
            add: 'Thêm sản phẩm mới'
          }}
          mode={modal.mode}
          /* Inject setMode into ProductForm so the form can toggle modes (edit/view/close) reliably */
          FormComponent={(props) => (
            <ProductForm
              {...props}
              setMode={(m) => {
                if (m === 'close') {
                  setModal({ open: false, mode: 'view', product: null });
                } else {
                  setModal((prev) => ({ ...prev, mode: m }));
                }
              }}
              onDelete={(id) => handleDelete(id)}
            />
          )}
          data={modal.product}
          onSave={handleSave}
          onDelete={handleDelete}
          maxWidth="sm:max-w-2xl"
        />

        {/* Success dialog to show import result / errors */}
        <SuccessDialog
          open={successDialog.open}
          title={successDialog.title || 'Kết quả import'}
          message={successDialog.message}
          onClose={() => setSuccessDialog({ open: false, title: '', message: null })}
        />
      </div>
    </div>
  );
}
