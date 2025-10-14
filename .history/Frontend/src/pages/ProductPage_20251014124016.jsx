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
    name: 'Tên sản phẩm',
    price: 'Giá',
    stock: 'Tồn kho',
    category: 'Danh mục',
    status: 'Trạng thái',
    description: 'Mô tả',
    image: 'Hình ảnh'
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
      const processedProducts = importedData.map((item, index) => ({
        id: Math.max(...products.map(p => p.id), 0) + index + 1,
        name: item['Tên sản phẩm'] || item.name || 'Untitled',
        price: parseFloat(item['Giá'] || item.price || 0),
        stock: parseInt(item['Tồn kho'] || item.stock || 0),
        category: item['Danh mục'] || item.category || Category.cosmetics,
        status: item['Trạng thái'] || item.status || 'available',
        description: item['Mô tả'] || item.description || '',
        image: item['Hình ảnh'] || item.image || ''
      }));

      setProducts(prev => [...prev, ...processedProducts]);
      alert(`Đã nhập thành công ${processedProducts.length} sản phẩm!`);
    } catch (error) {
      console.error('Lỗi xử lý dữ liệu nhập:', error);
      alert('Có lỗi xảy ra khi xử lý dữ liệu nhập');
    }
  };

  const handleImportError = (errorMessage) => {
    alert(`Lỗi nhập file: ${errorMessage}`);
  };

  // Pagination handlers
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handlePageChange = (page) => setCurrentPage(page);

  const headerRef = useRef(null);
  const paginationRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(null);
  const [cardHeight, setCardHeight] = useState(240);

  // Compute responsive columns based on window width
  const getColumnsForWidth = (width) => {
    if (width >= 1024) return 4; // lg
    if (width >= 768) return 2;  // md
    return 1;                    // sm
  };

  // Recompute grid and card heights so everything fits in viewport
  const computeHeights = () => {
    const headerH = headerRef.current?.offsetHeight || 0;
    const paginationH = paginationRef.current?.offsetHeight || 0;
    const gapTotal = 24; // total vertical gaps/padding margin you want to reserve
    const available = Math.max(200, window.innerHeight - headerH - paginationH - gapTotal);

    const cols = getColumnsForWidth(window.innerWidth);
    const itemsCount = Math.min(filtered.length, productsPerPage); // items we show on current page
    const rows = Math.max(1, Math.ceil(itemsCount / cols));
    // subtract intra-row gaps (assume gap-6 -> 1.5rem ~ 24px per row gap)
    const rowGaps = (rows - 1) * 24;
    const perCardHeight = Math.floor((available - rowGaps) / rows);

    setGridHeight(available);
    setCardHeight(Math.max(120, perCardHeight)); // prevent too small
  };

  useEffect(() => {
    computeHeights();
    const onResize = () => computeHeights();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  // recompute when pagination / filters change so rows/count can change
  }, [filtered.length, currentPage, productsPerPage]);

  return (
    <div className="p-0 min-h-screen flex flex-col">
      {/* Header theo hình */}
      <div ref={headerRef} className="flex items-center justify-between mb-6">
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
        style={{
          height: gridHeight ? `${gridHeight}px` : undefined,
          // ensure grid itself does not create page scroll; allow internal clipping
          overflow: 'hidden'
        }}
      >
        {currentProducts.map(p => (
          // fix each card to computed height so total fits viewport
          <div key={p.id} style={{ height: cardHeight, overflow: 'hidden' }}>
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
      <div ref={paginationRef}>
        <AppPagination
          totalPages={totalPages}
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          handleNext={handleNext}
          handlePrev={handlePrev}
        />
      </div>

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