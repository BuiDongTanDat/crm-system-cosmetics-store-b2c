import React, { useEffect, useState } from 'react';
import { Package, Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '../components/ProductCard'; // mới: component hiển thị chi tiết sản phẩm
import AppDialog from '@/components/dialogs/AppDialog';
import ProductForm from '@/components/forms/ProductForm';
import AppPagination from '@/components/pagination/AppPagination';
import ImportExportDropdown from '@/components/common/ImportExportDropdown';
import { sampleProducts, Category } from '@/lib/data';

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'view', product: null });
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
		async function loadCsvAndMap() {
			try {
				// Thay đường dẫn nếu cần (đảm bảo file được serve bởi frontend / public)
				const resp = await fetch('/data/hasaki_products_merged.csv');
				const text = await resp.text();

				// Nếu muốn parsing chính xác cho CSV phức tạp, cài papaparse và dùng Papa.parse(text, {header:true})
				const { headers, rows } = simpleCsvToTable(text);
				const mapped = importProducts(headers, rows);
				setProducts(mapped);
			} catch (err) {
				console.error('Failed to load CSV', err);
			} finally {
				setLoading(false);
			}
		}
		loadCsvAndMap();
	}, []);

	// Parser CSV đơn giản: tách dòng, lấy header; KHÔNG an toàn cho CSV có dấu phẩy trong ô.
	// Dùng Papaparse cho production để parse chính xác.
	function simpleCsvToTable(text) {
		const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
		if (lines.length === 0) return { headers: [], rows: [] };

		// Lấy header (giữ nguyên chuỗi header tiếng Việt)
		const headerLine = lines[0];
		const headers = splitCsvLine(headerLine);

		const rows = lines.slice(1).map(line => splitCsvLine(line));
		return { headers, rows };
	}

	// splitCsvLine: chia 1 dòng CSV thành mảng ô - simple: hỗ trợ trường được quote "..."
	function splitCsvLine(line) {
		const result = [];
		let cur = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (ch === '"' ) {
				// handle double-quote escape ""
				if (inQuotes && line[i+1] === '"') {
					cur += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
				continue;
			}
			if (ch === ',' && !inQuotes) {
				result.push(cur.trim());
				cur = '';
				continue;
			}
			cur += ch;
		}
		result.push(cur.trim());
		return result;
	}

	// Ánh xạ header tiếng Việt => object product với keys thân thiện
	function importProducts(headers, rows) {
		// build index map
		const idx = {};
		headers.forEach((h, i) => { idx[h] = i; });

		return rows.map(r => {
			// helper để safe access (trả '' nếu không có)
			const g = key => (idx[key] != null && r[idx[key]] != null) ? r[idx[key]] : '';

			return {
				name: g('Tên sản phẩm'),
				brand: g('Thương hiệu'),
				currentPrice: g('Giá hiện tại'),
				originalPrice: g('Giá gốc'),
				discount: g('Giảm giá'),
				image: g('Ảnh'),
				productLink: g('Link sản phẩm'),
				shortDescription: g('Mô tả ngắn'),
				rating: g('Rating'),
				reviewsCount: g('Số lượt đánh giá'),
				monthlySales: g('Mua/tháng'),
				saleProgress: g('Tiến độ bán'),
				offers: g('Ưu đãi/Quà tặng'),
				source: g('Nguồn'),
				currentPrice_extra: g('Giá hiện tại_extra'),
				description: g('Mô tả'),
				specs: g('Thông số'),
				howToUse: g('HDSD'),
				ingredients: g('Thành phần'),
				reviews: g('Đánh giá'),
				// thêm các trường raw khác nếu cần
				raw: r
			};
		});
	}

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

      {/* Loading state */}
      {loading && <p>Loading products...</p>}
      {!loading && products.length === 0 && <p>No products found.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {products.map((p, i) => (
          <ProductCard key={i} product={p} />
        ))}
      </div>
    </div>
  );
}