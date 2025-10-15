import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/cards/ProductCard';
import AppDialog from '@/components/dialogs/AppDialog';
import ProductForm from '@/components/forms/ProductForm';
import AppPagination from '@/components/pagination/AppPagination';
import ImportExportDropdown from '@/components/common/ImportExportDropdown';
import { sampleProducts, Category } from '@/lib/data';
import { importFromCSV } from '@/utils/helper';

export default function ProductPage() {
	// State
	const [products, setProducts] = useState(sampleProducts);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [modal, setModal] = useState({ open: false, mode: 'view', product: null });
	const [currentPage, setCurrentPage] = useState(1);
	const productsPerPage = 8;
	const [headersOrder, setHeadersOrder] = useState(null);
	const [selected, setSelected] = useState(null);

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

	// handle file input (sử dụng helper importFromCSV)
	async function handleFile(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const { headers, data } = await importFromCSV(file);
			setHeadersOrder(headers);
			setProducts(data);
			setSelected(null);
			alert(`Đã nhập ${data.length} sản phẩm từ CSV!`);
		} catch (err) {
			console.error('CSV import error:', err);
			alert('Không thể đọc file CSV. Kiểm tra định dạng.');
		}
	}

	// Save from form (create/update) — single definition (fix duplicate declaration)
	function handleSaveCSV(product, index) {
		setProducts(prev => {
			const copy = [...prev];
			if (typeof index === 'number' && index >= 0 && index < copy.length) {
				copy[index] = product;
			} else {
				copy.push(product);
			}
			return copy;
		});
		setSelected(null);
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

			{/* File upload for CSV */}
			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-4">Nhập khẩu sản phẩm từ CSV</h2>
				<input
					type="file"
					accept=".csv,text/csv"
					onChange={handleFile}
					className="mb-4"
				/>
				{headersOrder && (
					<div className="text-sm text-gray-500 mb-4">
						<strong>Các cột phát hiện:</strong> {headersOrder.join(', ')}
					</div>
				)}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<h3 className="font-semibold">Sản phẩm ({products.length})</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{products.map((p, idx) => (
								<ProductCard
									key={idx}
									product={p}
									onEdit={() => {
										setSelected({ ...p, _idx: idx });
									}}
								/>
							))}
						</div>
					</div>
					<div className="bg-white p-4 rounded-lg shadow-md">
						<h3 className="font-semibold mb-2">{selected ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm'}</h3>
						<ProductForm
							data={selected ?? {}}
							columns={headersOrder}
							onSave={(prod) => handleSaveCSV(prod, selected ? selected._idx : undefined)}
							setMode={() => setSelected(null)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}