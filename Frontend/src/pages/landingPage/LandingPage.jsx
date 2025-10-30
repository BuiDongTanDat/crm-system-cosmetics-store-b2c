import React, { useState } from "react";
import "./LandingPage.css";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, Contact, PhoneCall } from "lucide-react";

const LandingPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
    });

    // Products data
    const sampleProducts = [
        { id: 1, name: "Majun Pandora", image: "/images/products/product_temp.png", currentPrice: 500000, originalPrice: 600000, brand: "LuBoo", category: "Phân loại A", shortDescription: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.", status: "Còn hàng", rating: 4.5 },
        { id: 2, name: "Dream walker", image: "/images/products/product_temp.png", currentPrice: 750000, originalPrice: 900000, brand: "LuBoo", category: "Phân loại B", shortDescription: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.", status: "Còn hàng", rating: 4.0 },
        { id: 3, name: "Vast Sea", image: "/images/products/product_temp.png", currentPrice: 1200000, originalPrice: 1500000, brand: "LuBoo", category: "Phân loại C", shortDescription: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.", status: "Sắp về", rating: 3.5 },
        { id: 4, name: "Tinh Hoa Âm Sắc", image: "/images/products/product_temp.png", currentPrice: 900000, originalPrice: 1000000, brand: "LuBoo", category: "Phân loại A", shortDescription: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.", status: "Còn hàng", rating: 5.0 },
        { id: 5, name: "Lovely mixture", image: "/images/products/product_temp.png", currentPrice: 650000, originalPrice: 700000, brand: "LuBoo", category: "Phân loại B", shortDescription: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.", status: "Hết hàng", rating: 3.0 },
        { id: 6, name: "ELIE", image: "/images/products/product_temp.png", currentPrice: 1100000, originalPrice: 1300000, brand: "LuBoo", category: "Phân loại C", shortDescription: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.", status: "Còn hàng", rating: 4.8 },
    ];

    // --- Logic điều hướng sản phẩm ---
    const [startIndex, setStartIndex] = useState(0);
    const visibleCount = 4;

    const handleNext = () => {
        setStartIndex((prev) => (prev + 1) % sampleProducts.length);
    };

    const handlePrev = () => {
        setStartIndex((prev) => (prev - 1 + sampleProducts.length) % sampleProducts.length);
    };

    // Tạo danh sách 5 sản phẩm hiển thị (tuần hoàn)
    const visibleProducts = Array.from({ length: visibleCount }, (_, i) => {
        const index = (startIndex + i) % sampleProducts.length;
        return sampleProducts[index];
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Cảm ơn bạn đã để lại thông tin!");
        setShowForm(false);
        setFormData({ name: "", email: "", phone: "", notes: "" });
    };

    const formatCurrency = (value) =>
        value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    return (
        <div className="landing-page">
            {/* Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-10"
                style={{ backgroundImage: 'url("/images/background/bg.jpg")' }}
            />

            {/* Contact Button */}
            <div className="fixed top-6 right-6 z-20">
                <Button variant="actionUpdate" onClick={() => setShowForm(true)}>
                    <PhoneCall />LIÊN HỆ VỚI CHÚNG TÔI
                </Button>
            </div>

            {/* Header */}
            <header className="landing-header text-center z-10">
                <div className="flex items-center justify-center space-x-3">
                    <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-10 w-10" />
                    <span className="text-2xl font-extrabold text-blue-600">CChain</span>
                </div>
                <p className="text-gray-600 mt-2 text-lg font-medium">DỊCH VỤ - THƯƠNG HIỆU - TRUYỀN THÔNG - CHẤT LƯỢNG</p>
            </header>

            {/* Intro Image */}
            <div className="flex justify-center items-center mt-12 z-10 transition-all duration-300 group">
                <img
                    src="/images/background/Intro.png"
                    alt="Intro"
                    className="cursor-pointer max-w-xs md:max-w-md lg:max-w-lg transition-transform hover:scale-105 transition-all duration-200 animate-fade-in group"
                    onClick={() => setShowForm(true)}
                />
            </div>

            {/* Products Section */}
            <div className="products-section z-10 mt-16 px-6">
                <h2 className="text-2xl font-bold text-center text-gray-800 pt-10">
                    SẢN PHẨM HOT
                </h2>
                <hr className="w-full h-[2px] bg-gray-200 mx-auto mb-8  " />

                <div className="relative flex items-center justify-center gap-4">
                    {/* Prev Button */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-0 md:-left-6 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                    >
                        <ChevronLeft />
                    </button>

                    <div className="flex justify-center gap-6 flex-wrap">
                        {visibleProducts.map((product) => (
                            <div key={product.id} className="product-card transition-all duration-200 animate-fade-in group">
                                <div className="product-image">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        onError={(e) => {
                                            e.target.src = "/images/placeholder-product.jpg";
                                        }}
                                    />
                                </div>
                                <div className="product-info">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="product-name">{product.name}</h3>
                                        <span
                                            className={`ml-2 px-2 py-1 text-[10px] font-medium rounded-full ${
                                                (product.status || "").includes("Còn hàng")
                                                    ? "bg-cyan-100 text-blue-700"
                                                    : "bg-red-100 text-red-600"
                                            }`}
                                        >
                                            {product.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">
                                        {product.category} | {product.brand}
                                    </div>
                                    <div className="text-gray-600 text-xs mb-2 line-clamp-2">
                                        {product.shortDescription}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center text-yellow-500 text-xs font-medium gap-1">
                                            <Star size={14} /> {product.rating}
                                        </span>
                                        <div className="text-right">
                                            {product.originalPrice &&
                                                product.originalPrice > product.currentPrice && (
                                                    <div className="text-[12px] text-gray-400 line-through">
                                                        {formatCurrency(product.originalPrice)}
                                                    </div>
                                                )}
                                            <div className="text-sm font-bold text-gray-900">
                                                {formatCurrency(product.currentPrice)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={handleNext}
                        className="absolute right-0 md:-right-6 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                    >
                        <ChevronRight />
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="form-overlay">
                    <div className="form-container">
                        <div className="form-header">
                            <h3 className="text-lg font-semibold text-gray-900">Thông Tin Liên Hệ</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Điền thông tin bên dưới để chúng tôi có thể liên hệ với bạn.
                            </p>
                            <button className="close-button" onClick={() => setShowForm(false)}>
                                ×
                            </button>
                        </div>

                        <div className="form-content">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Nhập họ tên"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-1">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="email@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="w-40">
                                        <label className="block text-sm font-medium mb-1">SĐT *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="0123456"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Ghi chú</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder="Nhập ghi chú (tùy chọn)"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="form-footer">
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                    onClick={() => setShowForm(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                                >
                                    Gửi Thông Tin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
