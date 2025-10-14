import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router';
import { SidebarProvider } from './context/SidebarContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/ProductPage";
import CustomerListPage from "./pages/CustomerListPage";
import CFMAnalysisPage from "./pages/CFMAnalysisPage";
import CLVAnalysisPage from "./pages/CLVAnalysisPage";
import ChurnAnalysisPage from "./pages/ChurnAnalysisPage";
import LeadsPage from "./pages/LeadsPage";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import ShoppingActivityPage from "./pages/ShoppingActivityPage";
import MarketingPage from "./pages/MarketingPage";
import SettingsPage from "./pages/SettingsPage";
import EmployeePage from './pages/EmployeePage';
import OrderPage from './pages/OrderPage';
import ReportPage from './pages/ReportPage';
import KanbanPage from './pages/KanbanPage';
import RolePage from './pages/RolePage';
// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ProfilePage from './pages/auth/ProfilePage';

function App() {

  // Thêm: kiểm soát tắt/bật redirect (set VITE_DISABLE_AUTH_REDIRECTS=true để tắt redirect)
  const DISABLE_AUTH_REDIRECT = import.meta.env.VITE_DISABLE_AUTH_REDIRECTS === 'true';

  // Helper để render route private hoặc bypass khi đang thiết kế giao diện
  const privateElement = (page) =>
    DISABLE_AUTH_REDIRECT
      ? (<Layout>{page}</Layout>)
      : (<PrivateRoute><Layout>{page}</Layout></PrivateRoute>);

  return (
    <div className="min-h-screen w-full relative ">
      {/* Background Image */}
      <div
        className="opacity-30 absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/images/background/bg.jpg")',
        }}
      />



      {/* Content with relative positioning */}
      <div className="relative z-10">
        <Toaster richColors />
        <AuthProvider>
          <SidebarProvider>
            <BrowserRouter>
              <Routes>
                {/* Chưa đăng nhập sẽ truy cập các trang public (Đăng nhập, Đăng ký ,...) */}
                <Route
                  path="/auth/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/auth/signup"
                  element={
                    <PublicRoute>
                      <SignupPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/auth/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/auth/change-password"
                  element={<ChangePasswordPage />}
                />

                {/* Sử dụng helper privateElement(...) để có thể tắt redirect tạm thời */}
                <Route
                  path="/"
                  element={privateElement(<HomePage />)}
                />
                <Route
                  path="/profile"
                  element={privateElement(<ProfilePage />)}
                />
                <Route
                  path="/products"
                  element={privateElement(<ProductPage />)}
                />

                {/* Customer routes */}
                <Route
                  path="/customer-list"
                  element={privateElement(<CustomerListPage />)}
                />
                <Route
                  path="/ana-cfm"
                  element={privateElement(<CFMAnalysisPage />)}
                />
                <Route
                  path="/ana-clv"
                  element={privateElement(<CLVAnalysisPage />)}
                />
                <Route
                  path="/ana-churn"
                  element={privateElement(<ChurnAnalysisPage />)}
                />

                {/* Sales routes */}
                <Route
                  path="/leads"
                  element={privateElement(<LeadsPage />)}
                />
                <Route
                  path="/opporturnities"
                  element={privateElement(<OpportunitiesPage />)}
                />

                <Route
                  path="/kanban"
                  element={privateElement(<KanbanPage />)}
                />

                {/* Bills routes */}
                <Route
                  path="/orders"
                  element={privateElement(<OrderPage />)}
                />
                <Route
                  path="/shopping_activity"
                  element={privateElement(<ShoppingActivityPage />)}
                />

                {/* Marketing route */}
                <Route
                  path="/marketing"
                  element={privateElement(<MarketingPage />)}
                />
                <Route
                  path="/marketing"
                  element={privateElement(<MarketingPage />)}
                />

                {/* Reports routes */}
                <Route
                  path="/reports"
                  element={privateElement(<ReportPage />)}
                />

                {/* Account management routes */}
                <Route
                  path="/employees"
                  element={privateElement(<EmployeePage />)}
                />
                <Route
                  path="/roles"
                  element={privateElement(<RolePage />)}
                />

                {/* Others routes */}
                <Route
                  path="/settings"
                  element={privateElement(<SettingsPage />)}
                />

                <Route
                  path="*"
                  element={<NotFound />}
                />
              </Routes>
            </BrowserRouter>
          </SidebarProvider>
        </AuthProvider>
      </div>
    </div>
  );
}

export default App