import React, { useState, useEffect, useRef } from 'react';
import { Package, Search, Plus, Edit, Trash2, Eye, Filter, MoreVertical, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/cards/ProductCard';
import ProductDialog from '@/components/dialogs/ProductDialog';
import AppPagination from '@/components/pagination/AppPagination';

import { sampleProducts, Category } from '@/lib/data'; // Sample data


export default function ProductPage() {
  const [products, setProducts] = useState(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', product: null });
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleDelete = (id) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSave = (prod) => {
    if (modal.mode === 'add') {
      const newProd = { ...prod, id: Date.now() };
      setProducts(prev => [newProd, ...prev]);
    } else if (modal.mode === 'edit') {
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, ...prod } : p));
    }
    //closeModal(); Lưu xong vẫn giữ modal mở để xem tiếp
  };

  // Import/Export
  const exportProducts = () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.json';
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const importProducts = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (Array.isArray(json)) {
          // basic validation: ensure required fields exist
          setProducts(json.map((item, i) => ({ 
            id: item.id || Date.now() + i, 
            name: item.name || 'Untitled', 
            price: item.price || 0, 
            stock: item.stock || 0, 
            category: item.category || Category.cosmetics, 
            status: item.status || ProductStatus.available, 
            description: item.description || '', 
            image: item.image || '' 
          })));
          setMenuOpen(false);
        } else {
          alert('File import không hợp lệ (cần mảng JSON)');
        }
      } catch (err) {
        alert('Không thể đọc file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Pagination handlers
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handlePageChange = (page) => setCurrentPage(page);

  return (
    <div className="p-6" >
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
          <Button
            variant="actionNormal"
            className="gap-2"
          >
            <Filter className="w-5 h-5" />
            Lọc
          </Button>

          {/* Add Product */}
          <Button

            onClick={openAdd}
            variant="actionCreate"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm SP
          </Button>

          {/* Menu */}
          <div className="relative">
            <Button
              variant="actionNormal"

              onClick={() => setMenuOpen(prev => !prev)}
            >
              <MoreVertical className="w-5 h-5" />
            </Button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Nhập file JSON
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 rounded-b-lg"
                  onClick={exportProducts}
                >
                  Xuất file JSON
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => importProducts(e.target.files?.[0])}
            />
          </div>
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
      <ProductDialog
        modal={modal}
        closeModal={closeModal}
        handleSave={handleSave}
        handleDelete={handleDelete}
      />

    </div>
  );
}