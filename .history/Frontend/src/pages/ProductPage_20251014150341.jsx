// --- import không đổi ---
import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/cards/ProductCard';
import AppDialog from '@/components/dialogs/AppDialog';
import ProductForm from '@/components/forms/ProductForm';
import AppPagination from '@/components/pagination/AppPagination';
import ImportExportDropdown from '@/components/common/ImportExportDropdown';
import { sampleProducts } from '@/lib/data';
import { exportToCSV, cleanValue } from '@/utils/helper';

export default function ProductPage() {
  const [products, setProducts] = useState(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'view', product: null });
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;


  // Filter search
  const filtered = products.filter(p => {
    const term = searchTerm.trim().toLowerCase();
    return (
      !term ||
      Object.values(p)
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  });

  // Pagination
  useEffect(() => setCurrentPage(1), [searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / productsPerPage));
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filtered.slice(indexOfFirst, indexOfLast);

  // Modal handlers
  const openView = (p) => setModal({ open: true, mode: 'view', product: p });
  const openEdit = (p) => setModal({ open: true, mode: 'edit', product: p });
  const openAdd = () => setModal({ open: true, mode: 'add', product: {} });
  const closeModal = () => setModal({ open: false, mode: 'view', product: null });

  // Save changes (add / edit)
  const handleSave = (prod) => {
    if (modal.mode === 'add') {
      const newProd = { ...prod, id: Date.now() };
      setProducts(prev => [newProd, ...prev]);
      closeModal();
    } else if (modal.mode === 'edit') {
      const updatedProd = { ...modal.product, ...prod };
      setProducts(prev => prev.map(p => (p.id === updatedProd.id ? updatedProd : p)));
      setModal({ open: true, mode: 'view', product: updatedProd });
    }
  };

  //  Delete product
  const handleDelete = (id) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
      closeModal();
    }
  };

  // Hàm Import CSV — đã fix đọc chuẩn định dạng CSV tiếng Việt có dấu phẩy và dấu ngoặc kép
  const handleImportSuccess = (importedData) => {
    try {
      console.group("📥 DEBUG IMPORT CSV");
      console.log("Raw importedData:", importedData);

      let rows = [];
      if (Array.isArray(importedData?.data)) {
        rows = importedData.data;
      } else if (Array.isArray(importedData)) {
        rows = importedData;
      }

      // ⚙️ Nếu header bị dính hoặc lỗi, xử lý lại
      if (
        rows.length &&
        Object.keys(rows[0]).length === 1 &&
        Object.keys(rows[0])[0].includes(",")
      ) {
        console.warn("⚠️ CSV bị dính header — tiến hành tách lại...");
        const headerLine = Object.keys(rows[0])[0];
        const headers = headerLine.split(",").map((h) => h.replace(/(^"|"$)/g, "").trim());
        const validRows = rows.map((r) =>
          Object.values(r)[0]
            .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/) // tách đúng theo dấu phẩy ngoài ngoặc kép
            .map((v) => v.replace(/(^"|"$)/g, "").trim())
        );
        rows = validRows.map((vals) => {
          const obj = {};
          headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
          return obj;
        });
        console.log("✅ Đã tách lại header:", headers);
      }

      console.log("Parsed rows (sau chuẩn hóa):", rows);

      // ✅ Ánh xạ key tiếng Việt sang tiếng Anh đúng thứ tự CSV
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
        reviews: "Đánh giá",
      };

      const numericPriceFields = new Set([
        "currentPrice",
        "originalPrice",
        "currentPriceExtra",
        "discount",
      ]);

      const processedProducts = rows.map((item, index) => {
        const obj = { id: Date.now() + index };
        for (const [key, viLabel] of Object.entries(productFieldMapping)) {
          let raw = item[viLabel] ?? item[key] ?? "";
          if (typeof raw === "string" && numericPriceFields.has(key)) {
            raw = cleanValue(raw);
          }
          obj[key] = raw ?? "";
        }
        return obj;
      });

      console.log("✅ Processed products:", processedProducts);
      console.groupEnd();

      if (!processedProducts.length) {
        alert("Không đọc được sản phẩm hợp lệ trong CSV.");
        return;
      }

      setProducts((prev) => [...prev, ...processedProducts]);
      alert(`✅ Đã nhập thành công ${processedProducts.length} sản phẩm!`);
    } catch (error) {
      console.error("❌ Lỗi xử lý dữ liệu nhập:", error);
      alert("Có lỗi khi xử lý dữ liệu CSV, vui lòng kiểm tra lại file.");
    }
  };

  const handleImportError = (errorMessage) => {
    alert(`Lỗi nhập file: ${errorMessage}`);
  };

  // 🔹 Export CSV
  const handleExport = () => {
    try {
      exportToCSV(products, productFieldMapping, "products");
    } catch (err) {
      console.error("Export CSV error:", err);
    }
  };

  // 🔹 Pagination handlers
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handlePageChange = (page) => setCurrentPage(page);

  // ---------------------------- JSX ----------------------------
  return (
    <div className="p-0">
      {/* Header */}
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
              className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 border-gray-200 bg-white/90"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <Button variant="actionNormal" className="gap-2">
            <Filter className="w-5 h-5" /> Lọc
          </Button>

          <Button onClick={openAdd} variant="actionCreate" className="gap-2">
            <Plus className="w-4 h-4" /> Thêm SP
          </Button>

          <ImportExportDropdown
            data={products}
            filename="products"
            fieldMapping={productFieldMapping}
            onImportSuccess={handleImportSuccess}
            onImportError={handleImportError}
            onExport={handleExport}
            trigger="icon"
            variant="actionNormal"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {currentProducts.map(p => (
          <div key={p.id}>
            <ProductCard product={p} onView={openView} onEdit={openEdit} onDelete={handleDelete} />
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

      {/* Modal */}
      <AppDialog
        open={modal.open}
        onClose={closeModal}
        title={{
          view: `Chi tiết sản phẩm - ${modal.product?.name || ''}`,
          edit: modal.product ? `Chỉnh sửa - ${modal.product.name}` : 'Thêm sản phẩm',
          add: 'Thêm sản phẩm mới'
        }}
        mode={modal.mode}
        // wrapper để inject setMode vào ProductForm
        FormComponent={(props) => (
          <ProductForm
            {...props}
            setMode={(m) => {
              if (m === "close") {
                closeModal();
              } else {
                setModal((prev) => ({ ...prev, mode: m }));
              }
            }}
          />
        )}
        data={modal.product}
        onSave={handleSave}
        onDelete={handleDelete}
        maxWidth="sm:max-w-2xl"
      />
    </div>
  );
}
