import { Toaster, toast } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';

// State
import { useAuthStore } from './store/useAuthStore';
import { useEffect } from 'react';
// Layouts and Routes
import Layout from './components/layout/Layout';
import PrivateRoute from './components/routes/PrivateRoute';
import PublicRoute from './components/routes/PublicRoute';

// Pages
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import ProductPage from "./pages/product/ProductPage";
import CustomerListPage from "./pages/customer/CustomerListPage";
import CFMAnalysisPage from "./pages/customer/CFMAnalysisPage";
import CLVAnalysisPage from "./pages/customer/CLVAnalysisPage";
import ChurnAnalysisPage from "./pages/customer/ChurnAnalysisPage";
import LeadsPage from "./pages/deal/LeadsPage";
import ShoppingActivityPage from "./pages/order/ShoppingActivityPage";
import MarketingPage from "./pages/marketing/MarketingPage";
import SettingsPage from "./pages/SettingsPage";
import EmployeePage from './pages/employee/EmployeePage';
import OrderPage from './pages/order/OrderPage';
import ReportPage from './pages/report/ReportPage';
import KanbanPage from './pages/deal/KanbanPage';
import RolePage from './pages/role/RolePage';
import AutomationPage from './pages/automation/AutomationPage';
import LandingPage from './pages/landingPage/LandingPage';
import FlowEditorPage from './pages/automation/FlowBuilderPage';
import CategoryPage from './pages/category/CategoryPage';
import YoutubeStreamCam from './pages/stream/YoutubeStreamCam';
import YoutubeStreamVideo from './pages/stream/YoutubeStreamVideo';
import StreamListPage from './pages/stream/StreamListPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProfilePage from './pages/profile/ProfilePage';
import ChannelPage from './pages/channel/ChannelPage';




function App() {

  const { refreshSession } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const token = useAuthStore.getState().accessToken;
      // Chỉ refresh nếu token tồn tại
      if (token) {
        try {
          await refreshSession();
        } catch (err) {
          console.error("Session refresh failed:", err);
        }
      }
    };
    initAuth();
  }, []);

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
        className="opacity-40 absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/images/background/bg.jpg")',
        }}
      />

      {/* Toaster đặt ở đây (bên ngoài wrapper có z-index thấp) để không bị overlay đè */}
      <Toaster richColors className="z-[99999] pointer-events-none " style={{ zIndex: 999999 }} />

      {/* Content with relative positioning */}
      <div className="relative z-10">
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
                path="/auth/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/reset-password"
                element={
                  <PublicRoute>
                    <ResetPasswordPage />
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

              {/* Sản phẩm */}
              <Route
                path="/categories"
                element={privateElement(<CategoryPage />)}
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
              {/* <Route
                path="/leads"
                element={privateElement(<LeadsPage />)}
              /> */}
              {/* <Route
                  path="/opporturnities"
                  element={privateElement(<OpportunitiesPage />)}
                /> */}

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
                path="/channels"
                element={privateElement(<ChannelPage />)}
              />
              <Route
                path="/automations"
                element={privateElement(<AutomationPage />)}
              />
              <Route
                path="/automations/flow/new"
                element={privateElement(<FlowEditorPage />)}
              />
              <Route
                path="/automations/flow/:id"
                element={privateElement(<FlowEditorPage />)}
              />


              {/* Streaming routes */}
              <Route
                path="/streams"
                element={privateElement(<StreamListPage />)}
              />
              <Route
                path="/streams/youtube/cam/:id"
                element={privateElement(<YoutubeStreamCam />)}
              />
              <Route
                path="/streams/youtube/vid/:id"
                element={privateElement(<YoutubeStreamVideo />)}
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

              {/* LandingPage */}
              <Route
                path="/landing"
                element={<LandingPage />}
              />

              {/* Others routes */}
              <Route
                path="/settings"
                element={privateElement(<SettingsPage />)}
              />
              <Route
                path="/flows"
                element={privateElement(<FlowEditorPage />)}
              />
              <Route
                path="*"
                element={<NotFound />}
              />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </div>
    </div>
  );
}

export default App