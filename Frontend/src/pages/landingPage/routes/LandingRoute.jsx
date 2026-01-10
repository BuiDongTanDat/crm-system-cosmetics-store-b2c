import React from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import IntroPage from "../pages/IntroPage";
import AllProductPage from "../pages/AllProductPage";
import CartPage from "../pages/CartPage";
import OrderLookupPage from "../pages/OrderLookupPage";
import CampaignLandingPage from "../pages/CampaignLandingPage";

const LandingRoute = ({ onContact, onViewProducts, onSubmitInterest }) => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <IntroPage
            onContact={onContact}
            onViewProducts={onViewProducts}
          />
        }
      />
      <Route 
        path="/products" 
        element={
          <AllProductPage 
            onContact={onContact}
            onSubmitInterest={onSubmitInterest}
          />
        } 
      />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/order-lookup" element={<OrderLookupPage />} />
      <Route path="/campaigns/:id" element={<CampaignLandingPage />} />
      <Route
        path="/events"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-900">Sự kiện</h1>
              <p className="text-gray-600">Chưa có sự kiện nào</p>
            </div>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default LandingRoute;
