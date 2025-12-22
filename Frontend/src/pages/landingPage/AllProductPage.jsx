import React, { useMemo, useState, useEffect } from "react";
import ProductCard from "./components/ProductCard";
import { Button } from "@/components/ui/button";
import { Box, ChevronRight, RefreshCw, Search, Sparkles } from "lucide-react";
import { getProducts } from "@/services/products";
import AppPagination from "@/components/pagination/AppPagination";
import { Input } from "@/components/ui/input";
import { getCategories } from "@/services/categories";
import DropdownOptions from "@/components/common/DropdownOptions";

const AllProductPage = ({ onContact, onOrder }) => {
    // State
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [showSuggestion, setShowSuggestion] = useState(false);

    const pageSize = 15; // 2 row x 8 sản phẩm

    // Fetch products
    const fetchProducts = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getProducts();
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setProducts(list);
        } catch (err) {
            console.error("getProducts error", err);
            setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoriesForFilter = async () => {
        try {
            let res = await getCategories();
            if (!res.ok) return;

            const active = res.data.filter((c) => c && String(c.status) === 'ACTIVE');
            const opts = [
                { value: 'all', label: 'Danh mục' },
                ...active.map((c) => ({
                    value: c.name ?? String(c.category_id),
                    label: c.name ?? String(c.category_id),
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

    // Suggest products (Áp dụng ML để gợi ý ...)
    const suggestProducts = useMemo(() => {
        // Giả sử hiện tại chỉ lấy 5 sản phẩm ngẫu nhiên từ danh sách
        if (products.length <= 5) return products;
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 5);
    }, [products]);



    // Filtered products by search
    const filteredProducts = useMemo(() => {
        const search = searchText.trim().toLowerCase();
        return products.filter((p) => {
            const matchesSearch = p.name?.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search);
            const matchesCategory = !selectedCategory || selectedCategory === 'all' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        });
    }, [products, selectedCategory, searchText]);

    const total = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const pageItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, page, pageSize]);

    const goTo = (p) => {
        const np = Math.max(1, Math.min(totalPages, p));
        setPage(np);
        window.requestAnimationFrame(() => {
            const el = document.getElementById("all-products-top");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const handleInterest = (p) => {
        onContact?.({
            defaultNotes: `Quan tâm sản phẩm: ${p.name}`,
            defaultProductInterest: p.name,
        });
    };

    if (loading) {
        return (
            <section id="products" className="space-y-4">

                <h2 id="all-products-top" className="text-2xl font-bold">SẢN PHẨM HOT</h2>

                {/* Skeleton grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-sm border bg-white shadow-sm overflow-hidden flex flex-col animate-pulse"
                        >
                            <div className="relative h-48 bg-gray-50">
                                <div className="h-full w-full bg-gray-200" />
                                {/* placeholder cho badge discount */}
                                <span className="absolute top-0 left-0 rounded-br-sm bg-rose-500 text-white text-[15px] font-semibold px-6 py-1 shadow opacity-0" />
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    {/* rating placeholder */}
                                    <div className="h-4 w-20 bg-gray-200 rounded" />
                                    {/* inventory badge placeholder */}
                                    <div className="h-6 w-24 bg-gray-200 rounded" />
                                </div>

                                <div className="flex items-start justify-between gap-2">
                                    {/* title placeholder */}
                                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                                </div>

                                {/* category / brand placeholder */}
                                <div className="mt-1 h-3 bg-gray-200 rounded w-1/2" />

                                {/* price placeholders (original + current) */}
                                <div className="mt-3 text-right">
                                    <div className="h-3 bg-gray-200 rounded w-1/3 ml-auto" />
                                    <div className="mt-2 h-5 bg-gray-200 rounded w-1/2 ml-auto" />
                                </div>

                                {/* buttons placeholders */}
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div className="h-9 bg-gray-200 rounded" />
                                    <div className="h-9 bg-gray-200 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchProducts} className="mt-4"><RefreshCw /> Tải lại</Button>
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-700">Chưa có sản phẩm để hiển thị.</p>
                <Button onClick={fetchProducts} className="mt-4">Tải lại</Button>
            </div>
        );
    }

    return (
        <section id="products" className="py-12 px-5">
            <div className="flex justify-between">

                <h2 id="all-products-top" className="text-2xl font-bold">SẢN PHẨM HOT</h2>

                {/* Search bar */}
                <div className="flex gap-2 items-center">

                    <div className="relative items-center gap-2">

                        <Search className="absolute left-3 top-1.5 w-5 h-5 text-gray-400" />
                        <Input
                            variant="project"
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-[200px]"
                        />
                    </div>
                    <DropdownOptions
                        options={categoryOptions}
                        value={selectedCategory}
                        onChange={(val) => setSelectedCategory(val)}
                        width="w-49"
                        placeholder="Danh mục"
                    />
                </div>


            </div>
            {/* Hiển thị sản phẩm gợi ý từ model ML */}
            <div className="mt-4 p-5 rounded-xl 
                    bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500
                     shadow-lg shadow-blue-200/50"
            >
                <div className="flex justify-between items-center">
                    <h2 id="all-products-top" className="text-xl font-bold flex items-center gap-2 text-white "><Sparkles className="h-7 w-7 animated-scale " />BẠN CŨNG CÓ THỂ THÍCH</h2>
                    <ChevronRight
                        className={`w-6 h-6 text-white cursor-pointer transition-transform ${showSuggestion ? 'rotate-90' : 'rotate-0'}`}
                        onClick={() => setShowSuggestion(!showSuggestion)}
                    />
                </div>

                <div className={`
                    ${showSuggestion ? 'max-h-screen overflow-y-auto' : 'max-h-0 overflow-y-auto opacity-0 '}
                    transition-all duration-300 overflow-hidden
                `}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 p-3">
                        {
                            suggestProducts.map((p) => (
                                <div
                                    key={p.product_id ?? p.id}
                                    className="animate-fade-in duration-100 transition-transform"
                                >
                                    <ProductCard
                                        p={p}
                                        onInterest={handleInterest}
                                        onOrder={onOrder}
                                    />
                                </div>

                            ))}

                    </div>
                </div>


            </div>


            {/* Product grid with fade-in */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                {pageItems.map((p) => (
                    <div
                        key={p.product_id ?? p.id}
                        className="animate-fade-in duration-100 transition-transform"
                    >
                        <ProductCard
                            p={p}
                            onInterest={handleInterest}
                            onOrder={onOrder}
                        />
                    </div>
                ))}
                {
                    pageItems.length === 0 && (
                        <div className="col-span-full  flex flex-col text-center py-12 text-gray-600 ">
                            <Box size={48} className="mx-auto mb-4" />
                            Không tìm thấy sản phẩm phù hợp.
                        </div>
                    )
                }
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-center">
                <div>
                    <AppPagination
                        totalPages={totalPages}
                        currentPage={page}
                        handlePageChange={(p) => goTo(p)}
                        handleNext={() => goTo(page + 1)}
                        handlePrev={() => goTo(page - 1)}
                    />
                </div>
            </div>

            {/* Tailwind fade-in animation */}
        </section>
    );
};

export default AllProductPage;
