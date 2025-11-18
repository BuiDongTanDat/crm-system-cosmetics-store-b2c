import React, { useMemo, useState, useEffect } from "react";
import ProductCard from "./components/ProductCard";
import { Button } from "@/components/ui/button";
import { Box, RefreshCw, Search } from "lucide-react";
import { getProducts } from "@/services/products";
import AppPagination from "@/components/pagination/AppPagination";
import { Input } from "@/components/ui/input";

const AllProductPage = ({ onContact, onOrder }) => {
    // State
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [searchText, setSearchText] = useState("");

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

    useEffect(() => {
        fetchProducts();
    }, []);

    // Filtered products by search
    const filteredProducts = useMemo(() => {
        if (!searchText) return products;
        return products.filter((p) =>
            p.name?.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [products, searchText]);

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-64 rounded-2xl bg-white shadow animate-pulse" />
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
                <div className="relative items-center gap-2 mt-2">
                    <Search className="absolute left-3 top-1.5 w-5 h-5 text-gray-400" />
                    <Input
                    variant = "project"
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-[400px]"
                    />
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
            <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    {total} sản phẩm • Trang {page} / {totalPages}
                </div>
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
