import { Toaster, toast } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "./context/SidebarContext";

// State
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
// Layouts and Routes
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/routes/ProtectedRoute";
import PublicRoute from "./components/routes/PublicRoute";

// Pages
import HomePage from "./pages/HomePage";
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
                  <Route path="/categories" element={<CategoryPage />} />
                  <Route path="/products" element={<ProductPage />} />

                  {/* Customer routes */}
                  <Route path="/customer-list" element={<CustomerListPage />} />
                  <Route path="/ana-cfm" element={<CFMAnalysisPage />} />
                  <Route path="/ana-clv" element={<CLVAnalysisPage />} />
                  <Route path="/ana-churn" element={<ChurnAnalysisPage />} />

                  {/* Sales routes */}
                  {/* <Route
                path="/leads"
                element={ <LeadsPage />)}
              /> */}
                  {/* <Route
                  path="/opporturnities"
                  element={ <OpportunitiesPage />)}
                /> */}

                  <Route path="/kanban" element={<KanbanPage />} />

                  {/* Bills routes */}
                  <Route path="/orders" element={<OrderPage />} />
                  <Route
                    path="/shopping_activity"
                    element={<ShoppingActivityPage />}
                  />

                  {/* Marketing route */}
                  <Route path="/marketing" element={<MarketingPage />} />
                  <Route path="/channels" element={<ChannelPage />} />
                  <Route path="/automations" element={<AutomationPage />} />
                  <Route
                    path="/automations/flow/new"
                    element={<FlowEditorPage />}
                  />
                  <Route
                    path="/automations/flow/:id"
                    element={<FlowEditorPage />}
                  />

                  {/* Streaming routes */}
                  <Route path="/streams" element={<StreamListPage />} />
                  <Route
                    path="/streams/youtube/cam/:id"
                    element={<YoutubeStreamCam />}
                  />
                  <Route
                    path="/streams/youtube/vid/:id"
                    element={<YoutubeStreamVideo />}
                  />

                  {/* Reports routes */}
                  <Route path="/reports" element={<ReportPage />} />

                  {/* Account management routes */}
                  <Route path="/employees" element={<EmployeePage />} />
                  <Route path="/roles" element={<RolePage />} />

                  {/* Others routes */}
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/flows" element={<FlowEditorPage />} />
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
