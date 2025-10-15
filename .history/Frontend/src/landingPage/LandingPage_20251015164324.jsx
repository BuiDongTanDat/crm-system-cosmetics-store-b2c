import React, { useState } from "react";
import "./LandingPage.css";

const LandingPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
    });

    const images = [
        "/images/landing/CL_rmb.png",
        "/images/landing/TH_rmb.png",
        "/images/landing/TT_rmb.png",
        "/images/landing/DV_rmb.png",
    ];

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

    return (
        <div className="landing-page">
            {/* Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-5"
                style={{
                    backgroundImage: 'url("/images/background/bg.jpg")',
                }}
            />

            {/* Header */}
            <header className="landing-header text-center z-10">
                {/* Thêm: logo + brand */}
                <div className="flex items-center justify-center space-x-3">
                    <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-10 w-10 " />
                    <span className="text-2xl font-extrabold  text-blue-600">LuBoo</span>
                </div>
                <p className="text-gray-600 mt-2 text-lg font-medium">
                    TƯƠNG TÁC VỚI DOANH NGHIỆP
                </p>
            </header>

            {/* Image row */}
            <div className="image-row z-10 ">
                <div>
                    
                </div>
                {images.map((img, index) => (
                    <div
                        key={index}
                        className={`image-card ${index % 2 === 1 ? "lower" : ""}  `}
                    >
                        <img src={img} alt={`Ảnh ${index + 1}`} />
                    </div>
                ))}
            </div>

            {/* Contact Button */}
            <div className="contact-section z-10">
                <button
                    className="contact-button bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg"
                    onClick={() => setShowForm(true)}
                >
                    LIÊN HỆ VỚI CHÚNG TÔI
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="form-overlay">
                    <div className="form-container">
                        <div className="form-header">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Thông Tin Liên Hệ
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Điền thông tin bên dưới để chúng tôi có thể liên hệ với bạn.
                            </p>
                            <button
                                className="close-button"
                                onClick={() => setShowForm(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="form-content">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Họ và tên *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500"
                                        placeholder="Nhập họ tên"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium mb-1">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500"
                                            placeholder="email@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="w-40">
                                        <label className="block text-sm font-medium mb-1">
                                            SĐT *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500"
                                            placeholder="0123456"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Ghi chú
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-white border focus:outline-none border-gray-300 rounded-lg focus:border-blue-500 resize-none"
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
