// --- Giữ nguyên toàn bộ import như bạn có ---
import React, { useState, useEffect, useRef } from 'react';
import { Package, Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/cards/ProductCard';
import AppDialog from '@/components/dialogs/AppDialog';
import ProductForm from '@/components/forms/ProductForm';
import AppPagination from '@/components/pagination/AppPagination';
import ImportExportDropdown from '@/components/common/ImportExportDropdown';
import { sampleProducts, Category } from '@/lib/data';
import { cleanValue } from '@/utils/helper';

export default function ProductPage() {
  const [products, setProducts] = useState(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', product: null });
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // Field mapping cho export
  const productFieldMapping = {
    name: 'Tên sản phẩm',
    brand: 'Thương hiệu',
    currentPrice: 'Giá hiện tại',
    originalPrice: 'Giá gốc',
    discount: 'Giảm giá',
    image: 'Ảnh',
    productLink: 'Link sản phẩm',
    shortDesc: 'Mô tả ngắn',
    rating: 'Đánh giá sao',
    reviews: 'Số lượt đánh giá',
    monthlySales: 'Mua/tháng',
    progress: 'Tiến độ bán',
    giftOffer: 'Ưu đãi/Quà tặng',
    source: 'Nguồn',
    extraPrice: 'Giá hiện tại_extra',
    description: 'Mô tả',
    specs: 'Thông số',
    usage: 'HDSD',
    ingredients: 'Thành phần',
    fullReview: 'Đánh giá',
  };

  // --- Filter logic giữ nguyên ---
  const filtered = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / productsPerPage));
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filtered.slice(indexOfFirst, indexOfLast);

  // --- Modal handlers ---
  const openView = (p) => setModal({ open: true, mode: 'view', product: p });
  const openEdit = (p) => setModal({ open: true, mode: 'edit', product: p });
  const openAdd = () => setModal({ open: true, mode: 'add', product: null });
  const closeModal = () => setModal({ open: false, mode: 'view', product: null });

  const handleSave = (prod) => {
    if (modal.mode === 'add') {
      const newProd = { ...prod, id: Date.now() };
      setProducts((prev) => [newProd, ...prev]);
      closeModal();
    } else if (modal.mode === 'edit') {
      const updatedProd = { ...modal.product, ...prod };
      setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
      setModal((prev) => ({ ...prev, mode: 'view', product: updatedProd }));
    }
  };

  const handleDelete = (id) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      closeModal();
    }
  };

  // ✅ Xử lý IMPORT CSV theo định dạng Hasaki
  const handleImportSuccess = (importedData) => {
  try {
    // ✅ Nếu importedData có dạng { data: [...] } thì lấy ra mảng đó
    const rawArray = Array.isArray(importedData)
      ? importedData
      : Array.isArray(importedData?.data)
      ? importedData.data
      : [];

    if (!Array.isArray(rawArray) || rawArray.length === 0) {
      throw new Error('File CSV không có dữ liệu hợp lệ.');
    }

    const processedProducts = rawArray.map((item, index) => {
      const parseNumber = (v) => parseFloat(cleanValue(v || '0')) || 0;

      return {
        id: Math.max(...products.map((p) => p.id), 0) + index + 1,
        name: item['Tên sản phẩm']?.trim() || 'Sản phẩm chưa đặt tên',
        brand: item['Thương hiệu']?.trim() || '',
        currentPrice: parseNumber(item['Giá hiện tại']),
        originalPrice: parseNumber(item['Giá gốc']),
        discount: parseNumber(item['Giảm giá']),
        image: item['Ảnh'] || '',
        productLink: item['Link sản phẩm'] || '',
        shortDesc: item['Mô tả ngắn'] || '',
        rating: parseFloat(item['Đánh giá sao']) || 0,
        reviews: parseInt(cleanValue(item['Số lượt đánh giá'] || '0')) || 0,
        monthlySales: item['Mua/tháng'] || '',
        progress: item['Tiến độ bán'] || '',
        giftOffer: item['Ưu đãi/Quà tặng'] || '',
        source: item['Nguồn'] || '',
        extraPrice: parseNumber(item['Giá hiện tại_extra']),
        description: item['Mô tả'] || '',
        specs: item['Thông số'] || '',
        usage: item['HDSD'] || '',
        ingredients: item['Thành phần'] || '',
        fullReview: item['Đánh giá'] || '',
        category: Category.cosmetics,
        status: 'available',
        stock: 0,
      };
    });

    setProducts((prev) => [...prev, ...processedProducts]);
    alert(`✅ Đã nhập thành công ${processedProducts.length} sản phẩm!`);
  } catch (error) {
    console.error('❌ Lỗi xử lý dữ liệu nhập:', error);
    alert('Có lỗi xảy ra khi xử lý dữ liệu CSV. Vui lòng kiểm tra lại định dạng file.');
  }
};


  const handleImportError = (errorMessage) => {
    alert(`Lỗi nhập file: ${errorMessage}`);
  };

  // Pagination handlers
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handlePageChange = (page) => setCurrentPage(page);

  // --- UI giữ nguyên ---
  return (
    <div className="p-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Danh sách sản phẩm ({filtered.length})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 transition-all border-gray-200 bg-white/90"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button variant="actionNormal" className="gap-2">
            <Filter className="w-5 h-5" />
            Lọc
          </Button>

          <Button onClick={openAdd} variant="actionCreate" className="gap-2">
            <Plus className="w-4 h-4" />
            Thêm SP
          </Button>

          <ImportExportDropdown
            data={products}
            filename="products"
            fieldMapping={productFieldMapping}
            onImportSuccess={handleImportSuccess}
            onImportError={handleImportError}
            trigger="icon"
            variant="actionNormal"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {currentProducts.map((p) => (
          <ProductCard key={p.id} product={p} onView={openView} onEdit={openEdit} onDelete={handleDelete} />
        ))}
      </div>

      <AppPagination
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        handleNext={handleNext}
        handlePrev={handlePrev}
      />

      <AppDialog
        open={modal.open}
        onClose={closeModal}
        title={{
          view: `Chi tiết sản phẩm - ${modal.product?.name || ''}`,
          edit: modal.product ? `Chỉnh sửa sản phẩm - ${modal.product.name}` : 'Thêm sản phẩm mới',
          add: 'Thêm sản phẩm mới',
        }}
        mode={modal.mode}
        FormComponent={ProductForm}
        data={modal.product}
        onSave={handleSave}
        onDelete={handleDelete}
        maxWidth="sm:max-w-2xl"
      />
    </div>
  );
}
