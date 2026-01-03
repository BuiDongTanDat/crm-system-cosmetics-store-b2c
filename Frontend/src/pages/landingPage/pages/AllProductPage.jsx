import React, { useMemo, useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Box,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { getProducts } from "@/services/products";
import AppPagination from "@/components/pagination/AppPagination";
import { Input } from "@/components/ui/input";
import { getCategories } from "@/services/categories";
import DropdownOptions from "@/components/common/DropdownOptions";
import { toast } from "sonner";
const AllProductPage = ({ onContact, onOrder, onCartChange }) => {
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [likedProducts, setLikedProducts] = useState([]);
  const [showLiked, setShowLiked] = useState(false);

  const pageSize = 15; // 2 row x 8 sản phẩm

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getProducts();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
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

      const active = res.data.filter((c) => c && String(c.status) === "ACTIVE");
      const opts = [
        { value: "all", label: "Danh mục" },
        ...active.map((c) => ({
          value: c.name ?? String(c.category_id),
          label: c.name ?? String(c.category_id),
        })),
      ];
      setCategoryOptions(opts);
    } catch (err) {
      console.error("Failed to load category filter options:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategoriesForFilter();
  }, []);

  useEffect(() => {
    // Load liked products from localStorage on mount
    const data = localStorage.getItem("likedProducts");
    setLikedProducts(data ? JSON.parse(data) : []);
  }, []);

  // Xử lý nút quan tâm
  const handleToggleLike = (product) => {
    const id = product.product_id ?? product.id;
    let liked = [...likedProducts];
    const idx = liked.findIndex((p) => (p.product_id ?? p.id) === id);
    if (idx > -1) {
      liked.splice(idx, 1);
    } else {
      liked.push(product);
    }
    setLikedProducts(liked);
    localStorage.setItem("likedProducts", JSON.stringify(liked));
    toast.success(
      idx > -1
        ? "Đã bỏ quan tâm sản phẩm."
        : "Đã thêm sản phẩm vào danh sách quan tâm."
    );
  };



  //Xử lý nút thêm vào giỏ hàng
  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex(
      (item) => item.product_id === product.product_id
    );
    if (idx !== -1) {
      cart[idx].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    if (typeof onCartChange === "function") onCartChange();
    toast.success("Đã thêm sản phẩm vào giỏ hàng.");
  };

  // Filtered products by search (tùy theo chế độ)
  const filteredAllProducts = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search);
      const matchesCategory =
        !selectedCategory ||
        selectedCategory === "all" ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, selectedCategory, searchText]);

  const filteredLikedProducts = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return likedProducts.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search);
      const matchesCategory =
        !selectedCategory ||
        selectedCategory === "all" ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [likedProducts, selectedCategory, searchText]);

  const total = showLiked
    ? filteredLikedProducts.length
    : filteredAllProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageItems = useMemo(() => {
    const list = showLiked ? filteredLikedProducts : filteredAllProducts;
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [filteredAllProducts, filteredLikedProducts, page, pageSize, showLiked]);

  // Reset page về 1 khi chuyển chế độ xem hoặc thay đổi filter/search
  useEffect(() => {
    setPage(1);
  }, [showLiked, searchText, selectedCategory]);

  const goTo = (p) => {
    const np = Math.max(1, Math.min(totalPages, p));
    setPage(np);
    window.requestAnimationFrame(() => {
      const el = document.getElementById("all-products-top");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (loading) {
    return (
      <section id="products" className="space-y-4">
        <h2 id="all-products-top" className="text-2xl font-bold">
          SẢN PHẨM HOT
        </h2>

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
        <Button onClick={fetchProducts} className="mt-4">
          <RefreshCw /> Tải lại
        </Button>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-700">Chưa có sản phẩm để hiển thị.</p>
        <Button onClick={fetchProducts} className="mt-4">
          Tải lại
        </Button>
      </div>
    );
  }

  return (
    <section id="products" className="py-12 px-5">
      <div className="flex justify-between">
        <h2 id="all-products-top" className="text-2xl font-bold">
          {showLiked ? "SẢN PHẨM ĐÃ QUAN TÂM" : "SẢN PHẨM HOT"}
        </h2>
        <div className="flex gap-2 items-center">
          <Button
            variant={!showLiked ? "actionCreate" : "outline"}
            className="flex items-center"
            onClick={() => setShowLiked(false)}
          >
            <Box className="mr-1" size={18} />
            Tất cả sản phẩm
          </Button>
          <Button
            variant={showLiked ? "actionCreate" : "outline"}
            className="flex items-center"
            onClick={() => setShowLiked(true)}
          >
            <Star className="" size={18} />
            Quan tâm
            {likedProducts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-700 text-xs font-semibold">
                {likedProducts.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Thanh search và filter luôn hiển thị */}
      <div className="flex gap-2 items-center mt-6 mb-2">
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

      {/* Danh sách sản phẩm */}
      {total === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Box size={48} className="mx-auto mb-4" />
          {showLiked
            ? "Bạn chưa quan tâm sản phẩm nào."
            : "Không tìm thấy sản phẩm phù hợp."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            {pageItems.map((p) => (
              <ProductCard
                key={p.product_id}
                p={p}
                isLiked={
                  !!likedProducts.find(
                    (lp) => (lp.product_id) === (p.product_id)
                  )
                }
                onToggleLike={handleToggleLike}
                onOrder={() => handleAddToCart(p)}
                
              />
            ))}
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
        </>
      )}
    </section>
  );
};

export default AllProductPage;
