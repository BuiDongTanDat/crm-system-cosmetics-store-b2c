import { Toaster, toast } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "./context/SidebarContext";


// Layouts and Routes
import Layout from "./components/layout/Layout";
import PublicRoute from "./components/routes/PublicRoute";

// Pages
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/product/ProductPage";
import CustomerListPage from "./pages/customer/CustomerListPage";
import CFMAnalysisPage from "./pages/customer/CFMAnalysisPage";
import CLVAnalysisPage from "./pages/customer/CLVAnalysisPage";
import ChurnAnalysisPage from "./pages/customer/ChurnAnalysisPage";
import ShoppingActivityPage from "./pages/order/ShoppingActivityPage";
import MarketingPage from "./pages/marketing/MarketingPage";
import SettingsPage from "./pages/SettingsPage";
import EmployeePage from "./pages/employee/EmployeePage";
import OrderPage from "./pages/order/OrderPage";
import ReportPage from "./pages/report/ReportPage";
import KanbanPage from "./pages/deal/KanbanPage";
import RolePage from "./pages/role/RolePage";
import AutomationPage from "./pages/automation/AutomationPage";
import LandingPage from "./pages/landingPage/LandingPage";
import FlowEditorPage from "./pages/automation/FlowBuilderPage";
import CategoryPage from "./pages/category/CategoryPage";
import YoutubeStreamCam from "./pages/stream/YoutubeStreamCam";
import YoutubeStreamVideo from "./pages/stream/YoutubeStreamVideo";
import StreamListPage from "./pages/stream/StreamListPage";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProfilePage from "./pages/profile/ProfilePage";
import ChannelPage from "./pages/channel/ChannelPage";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import DashBoard from "./pages/dashboard/DashBoard";
import CheckoutPage from "./pages/checkout/CheckoutPage";

import NavigateGuard from "./components/auth/NavigateGuard";
function App() {

  return (
    <div className="min-h-screen w-full relative ">
      {/* Background Image */}
      <div
        className="opacity-40 absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/images/background/bg.jpg")',
        }}
      />

      {/* Toaster đặt ở đây (bên ngoài wrapper có z-index thấp) để không bị overlay đè */}
      <Toaster
        richColors
        className="z-[99999] pointer-events-none "
        style={{ zIndex: 999999 }}
      />

      {/* Content with relative positioning */}
      <div className="relative z-10">
        <SidebarProvider>
          <BrowserRouter>
            <Routes>
              {/*Checkout theo id order*/}
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Public root này là những trang khi đã đăng nhập rồi thì không được truy cập nữa */}
              <Route element={<PublicRoute />}>
                <Route path="/auth/login" element={<LoginPage />} />
                <Route
                  path="/auth/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route
                  path="/auth/reset-password"
                  element={<ResetPasswordPage />}
                />

                
              </Route>
              {/* Chưa đăng nhập sẽ truy cập các trang public (Đăng nhập, Đăng ký ,...) */}

              {/* LandingPage */}
              <Route path="/landing" element={<LandingPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                {/* Nếu đăng nhập rồi thì mới render các component con */}
                <Route element={<Layout />}>

        
                  <Route
                    path="/auth/change-password"
                    element={<ChangePasswordPage />}
                  />

                  <Route path="/" element={<DashBoard />} />
                  <Route path="/profile" element={<ProfilePage />} />

                  {/* Sản phẩm */}
                  <Route
                    path="/categories"
                    element={
                      <NavigateGuard module="category">
                        <CategoryPage />
                      </NavigateGuard>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <NavigateGuard module="product">
                        <ProductPage />
                      </NavigateGuard>
                    }
                  />

                  {/* Customer routes */}
                  <Route
                    path="/customer-list"
                    element={
                      <NavigateGuard module="customer">
                        <CustomerListPage />
                      </NavigateGuard>
                    }
                  />
                  <Route
                    path="/ana-cfm"
                    element={
                      <NavigateGuard module="customer">
                        <CFMAnalysisPage />
                      </NavigateGuard>
                    }
                  />
                  <Route
                    path="/ana-clv"
                    element={
                      <NavigateGuard module="customer">
                        <CLVAnalysisPage />
                      </NavigateGuard>
                    }
                  />
                  <Route
                    path="/ana-churn"
                    element={
                      <NavigateGuard module="customer">
                        <ChurnAnalysisPage />
                      </NavigateGuard>
                    }
                  />

                  {/* Sales routes */}
                  <Route
                    path="/kanban"
                    element={
                      // <NavigateGuard module="deal">
                        <KanbanPage />
                      // </NavigateGuard>
                    }
                  />

                  {/* Bills routes */}
                  <Route
                    path="/orders"
                    element={
                      <NavigateGuard module="order">
                        <OrderPage />
                      </NavigateGuard>
                    }
                  />
                  <Route
                    path="/shopping_activity"
                    element={
                      <NavigateGuard module="order">
                        <ShoppingActivityPage />
                      </NavigateGuard>
                    }
                  />

                  {/* Marketing route */}
                  <Route
                    path="/marketing"
                    element={
                      // <NavigateGuard module="marketing">
                        <MarketingPage />
                      // </NavigateGuard>
                    }
                  />
                  <Route
                    path="/channels"
                    element={
                      // <NavigateGuard module="channel">
                        <ChannelPage />
                      // </NavigateGuard>
                    }
                  />
                  <Route
                    path="/automations"
                    element={
                      // <NavigateGuard module="automation">
                        <AutomationPage />
                      // </NavigateGuard>
                    }
                  />
                  <Route
                    path="/automations/flow/new"
                    element={
                      // <NavigateGuard module="automation">
                        <FlowEditorPage />
                      // </NavigateGuard>
                    }
                  />
                  <Route
                    path="/automations/flow/:id"
                    element={
                      // <NavigateGuard module="automation">
                        <FlowEditorPage />
                      // </NavigateGuard>
                    }
                  />

                  {/* Streaming routes */}
                  <Route
                    path="/streams"
                    element={
                      <NavigateGuard module="youtube">
                        <StreamListPage />
                      </NavigateGuard>
                    }
                  />
                  <Route
                    path="/streams/youtube/cam/:id"
                    element={
                      <NavigateGuard module="youtube">
                        <YoutubeStreamCam />
                      </NavigateGuard>
                    }
                  />
                  <Route
                    path="/streams/youtube/vid/:id"
                    element={
                      <NavigateGuard module="youtube">
                        <YoutubeStreamVideo />
                      </NavigateGuard>
                    }
                  />

                  {/* Reports routes */}
                  <Route
                    path="/reports"
                    element={
                      // <NavigateGuard module="report">
                        <ReportPage />
                      // </NavigateGuard>
                    }
                  />

                  {/* Account management routes */}
                  <Route
                    path="/employees"
                    element={
                      <NavigateGuard module="user">
                        <EmployeePage />
                       </NavigateGuard>
                    }
                  />
                  <Route
                    path="/roles"
                    element={
                      <NavigateGuard module="role">
                        <RolePage />
                      </NavigateGuard>
                    }
                  />

                  {/* Others routes */}
                  <Route
                    path="/settings"
                    element={
                      // <NavigateGuard module="setting">
                        <SettingsPage />
                      // </NavigateGuard>
                    }
                  />
                  <Route
                    path="/flows"
                    element={
                      // <NavigateGuard module="automation">
                        <FlowEditorPage />
                      // </NavigateGuard>
                    }
                  />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </div>
    </div>
  );
}

export default App;
