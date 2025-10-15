import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const cards = [
    { icon: "/images/dashboard/Frame_Product.png", title: "Sản phẩm", path: "/products", top: 0, left: 0, width: 280, height: 400 },
    { icon: "/images/dashboard/Frame_Bills.png", title: "Hóa đơn", path: "/orders", top: 0, left: 290, width: 200, height: 200 },
    { icon: "/images/dashboard/Frame_Account.png", title: "Tài khoản", path: "/employees", top: 0, left: 420, width: 500, height: 140 },
    { icon: "/images/dashboard/Frame_Report.png", title: "Báo cáo", path: "/reports", top: 220, left: 240, width: 300, height: 180 },
    { icon: "/images/dashboard/Frame_Marketing.png", title: "Marketing", path: "/marketing", top: 130, left: 520, width: 300, height: 180 },
    { icon: "/images/dashboard/Frame_Sales.png", title: "Bán hàng", path: "/kanban", top: 380, left: 25, width: 480, height: 250 },
    { icon: "/images/dashboard/Frame_Customer.png", title: "Khách hàng", path: "/customers", top: 300, left: 520, width: 300, height: 300 },
  ];

  return (
    <div className="">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="">Dashboard</p>
      {/* Container chứa tất cả cards */}
      <div
        className="relative mx-auto  "
        style={{ width: 1000, height: 700 }}
      >
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className="absolute cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-100 animate-fade-in group"
            style={{
              top: card.top,
              left: card.left,
              width: card.width,
              height: card.height,
            }}
          >
            <img
              src={card.icon}
              alt={card.title}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
