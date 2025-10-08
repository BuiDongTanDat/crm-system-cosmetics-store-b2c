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
import BasicTablesPage from "./pages/BasicTablesPage";
import AlertsPage from "./pages/AlertsPage";
import ButtonsPage from "./pages/ButtonsPage";
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

                {/* Đăng nhập xong mới được truy cập các trang có PrivateRoute */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <HomePage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ProfilePage />
                        </Layout>
                      
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ProductPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Customer routes */}
                <Route
                  path="/customer-list"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CustomerListPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ana-cfm"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CFMAnalysisPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ana-clv"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CLVAnalysisPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ana-churn"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ChurnAnalysisPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Sales routes */}
                <Route
                  path="/leads"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <LeadsPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/opporturnities"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <OpportunitiesPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/kanban"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <KanbanPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Bills routes */}
                <Route
                  path="/orders"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <OrderPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/shopping_activity"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ShoppingActivityPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Marketing route */}
                <Route
                  path="/marketing"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <MarketingPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Reports routes */}
                <Route
                  path="/reports"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ReportPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Account management routes */}
                <Route
                  path="/employees"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <EmployeePage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/roles"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <RolePage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Others routes */}
                <Route
                  path="/alerts"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <AlertsPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/buttons"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ButtonsPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <SettingsPage />
                      </Layout>
                    </PrivateRoute>
                  }
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