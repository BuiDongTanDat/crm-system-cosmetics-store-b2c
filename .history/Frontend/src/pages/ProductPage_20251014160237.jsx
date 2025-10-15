import React, { useState, useEffect, useRef } from 'react';
import { Package, Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/cards/ProductCard';
import AppDialog from '@/components/dialogs/AppDialog';
import ProductForm from '@/components/forms/ProductForm';
import AppPagination from '@/components/pagination/AppPagination';
import ImportExportDropdown from '@/components/common/ImportExportDropdown';
import { sampleProducts, Category } from '@/lib/data';

export default function ProductPage() {
  const [products, setProducts] = useState(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', product: null });
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  // Field mapping for CSV export/import
  const productFieldMapping = {
    name: "Tên sản phẩm",
    brand: "Thương hiệu",
    currentPrice: "Giá hiện tại",
    originalPrice: "Giá gốc",
    discount: "Giảm giá",
    image: "Ảnh",
    productLink: "Link sản phẩm",
    shortDescription: "Mô tả ngắn",
    rating: "Đánh giá sao",
    reviewCount: "Số lượt đánh giá",
    monthlySales: "Mua/tháng",
    salesProgress: "Tiến độ bán",
    giftOffer: "Ưu đãi/Quà tặng",
    source: "Nguồn",
    currentPriceExtra: "Giá hiện tại_extra",
    description: "Mô tả",
    specifications: "Thông số",
    usage: "HDSD",
    ingredients: "Thành phần",
    reviews: "Đánh giá"
  };



  // Filtered products
  const filtered = products.filter(p => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / productsPerPage));
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filtered.slice(indexOfFirst, indexOfLast);

  // Handlers
  const openView = (p) => setModal({ open: true, mode: 'view', product: p });
  const openEdit = (p) => setModal({ open: true, mode: 'edit', product: p });
  const openAdd = () => setModal({ open: true, mode: 'add', product: null });
  const closeModal = () => setModal({ open: false, mode: 'view', product: null });

  const handleSave = (prod) => {
    if (modal.mode === 'add') {
      const newProd = { ...prod, id: Date.now() };
      setProducts(prev => [newProd, ...prev]);
      closeModal();
    } else if (modal.mode === 'edit') {
      const updatedProd = { ...modal.product, ...prod };
      setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));

      setModal(prev => ({
        ...prev,
        mode: 'view',
        product: updatedProd
      }));
    }
  };

  const handleDelete = (id) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      closeModal();
    }
  };

  // Import/Export handlers
  const handleImportSuccess = (importedData) => {
    try {
      console.log('Raw importedData:', importedData);

      // Lấy dữ liệu từ importedData
      const rows = Array.isArray(importedData) ? importedData :
        importedData?.data ? importedData.data :
          [importedData];

      console.log(' Processed rows:', rows);

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("Dữ liệu nhập không hợp lệ hoặc rỗng");
      }

      // Log header của file CSV để debug
      if (rows.length > 0) {
        console.log('CSV Headers:', Object.keys(rows[0]));
        console.log('Expected mapping:', productFieldMapping);
      }

      const processedProducts = rows.map((item, index) => {
        console.log(`Processing item ${index + 1}:`, item);

        const cleanNumber = (val) => {
          if (!val) return 0;
          const cleaned = val.toString().replace(/[^\d.-]/g, '');
          return parseFloat(cleaned) || 0;
        };

        const getFieldValue = (csvField, englishField, defaultValue = '') => {
          // Thử cả Vietnamese và English field names
          return item[csvField] ?? item[englishField] ?? defaultValue;
        };

        // Chuyển đổi dữ liệu CSV tiếng Việt sang key tiếng Anh
        const newProduct = {
          id: Math.max(...products.map(p => p.id), 0) + index + 1,
          name: getFieldValue("Tên sản phẩm", "name"),
          brand: getFieldValue("Thương hiệu", "brand"),
          currentPrice: cleanNumber(getFieldValue("Giá hiện tại", "currentPrice")),
          originalPrice: cleanNumber(getFieldValue("Giá gốc", "originalPrice")),
          discount: getFieldValue("Giảm giá", "discount"),
          image: getFieldValue("Ảnh", "image"),
          productLink: getFieldValue("Link sản phẩm", "productLink"),
          shortDescription: getFieldValue("Mô tả ngắn", "shortDescription"),
          rating: parseFloat(getFieldValue("Đánh giá sao", "rating")) || 0,
          reviewCount: parseInt(getFieldValue("Số lượt đánh giá", "reviewCount")) || 0,
          monthlySales: getFieldValue("Mua/tháng", "monthlySales"),
          salesProgress: getFieldValue("Tiến độ bán", "salesProgress"),
          giftOffer: getFieldValue("Ưu đãi/Quà tặng", "giftOffer"),
          source: getFieldValue("Nguồn", "source"),
          currentPriceExtra: getFieldValue("Giá hiện tại_extra", "currentPriceExtra"),
          description: getFieldValue("Mô tả", "description"),
          specifications: getFieldValue("Thông số", "specifications"),
          usage: getFieldValue("HDSD", "usage"),
          ingredients: getFieldValue("Thành phần", "ingredients"),
          reviews: getFieldValue("Đánh giá", "reviews"),
          category: getFieldValue("Danh mục", "category", "Son môi"),
          status: getFieldValue("Trạng thái", "status", "available"),
          stock: parseInt(getFieldValue("Tồn kho", "stock")) || 0
        };


        console.log(`✅ Processed product ${index + 1}:`, newProduct);
        return newProduct;
      });

      console.log('🎉 All processed products:', processedProducts);

      // Kiểm tra xem có sản phẩm nào được xử lý thành công không
      const validProducts = processedProducts.filter(p => p.name && p.name !== `Sản phẩm ${processedProducts.indexOf(p) + 1}`);

      if (validProducts.length === 0) {
        throw new Error("Không tìm thấy dữ liệu sản phẩm hợp lệ. Vui lòng kiểm tra format file CSV.");
      }

      setProducts(prev => [...prev, ...processedProducts]);
      alert(`Đã nhập thành công ${processedProducts.length} sản phẩm!\nSố sản phẩm có tên hợp lệ: ${validProducts.length}`);

    } catch (error) {
      console.error('Lỗi xử lý dữ liệu nhập:', error);
      console.error('Error stack:', error.stack);
      alert(`Có lỗi xảy ra khi xử lý dữ liệu nhập: ${error.message}\nVui lòng kiểm tra console để biết thêm chi tiết.`);
    }
  };



  const handleImportError = (errorMessage) => {
    alert(`Lỗi nhập file: ${errorMessage}`);
  };

  // Pagination handlers
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="p-0" >
      {/* Header theo hình */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Danh sách sản phẩm ({filtered.length})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className={`w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all
                 border-gray-200 bg-white/90 dark:bg-gray-800/90
              `}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter */}
          <Button variant="actionNormal" className="gap-2">
            <Filter className="w-5 h-5" />
            Lọc
          </Button>

          {/* Add Product */}
          <Button onClick={openAdd} variant="actionCreate" className="gap-2">
            <Plus className="w-4 h-4" />
            Thêm SP
          </Button>

          {/* Import/Export Dropdown */}
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

      {/* Products grid - 4 columns theo hình */}
      <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {currentProducts.map(p => (
          <div key={p.id}>
            <ProductCard
              product={p}
              onView={openView}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <AppPagination
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        handleNext={handleNext}
        handlePrev={handlePrev}
      />

      {/* Modal Popup */}
      <AppDialog
        open={modal.open}
        onClose={closeModal}
        title={{
          view: `Chi tiết sản phẩm - ${modal.product?.name || ''}`,
          edit: modal.product ? `Chỉnh sửa sản phẩm - ${modal.product.name}` : 'Thêm sản phẩm mới',
          add: 'Thêm sản phẩm mới'
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