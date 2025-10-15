import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
        <h1 className="text-4xl font-bold text-gray-900 tracking-wide">
          SẢN PHẨM NỔI BẬT
        </h1>
        <p className="text-gray-600 mt-2 text-lg font-medium">
          CHẤT LƯỢNG - UY TÍN - TẬN TÂM
        </p>
      </header>

      {/* Image row */}
      <div className="image-row z-10">
        {images.map((img, index) => (
          <div
            key={index}
            className={`image-card ${index % 2 === 1 ? "lower" : ""}`}
          >
            <img src={img} alt={`Ảnh ${index + 1}`} />
          </div>
        ))}
      </div>

      {/* Contact Button */}
      <div className="contact-section z-10">
        <Button
          variant="default"
          size="lg"
          className="contact-button bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg"
          onClick={() => setShowForm(true)}
        >
          LIÊN HỆ VỚI CHÚNG TÔI
        </Button>
      </div>

      {/* Form Modal (shadcn dialog) */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông Tin Liên Hệ</DialogTitle>
            <DialogDescription>
              Điền thông tin bên dưới để chúng tôi có thể liên hệ với bạn.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Họ và tên *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại *</Label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Gửi Thông Tin
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
