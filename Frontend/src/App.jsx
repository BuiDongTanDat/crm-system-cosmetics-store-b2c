import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router';
import { SidebarProvider } from './context/SidebarContext';
import Layout from './components/layout/Layout';
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
        <SidebarProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={<HomePage />}
                />
                <Route
                  path="/products"
                  element={<ProductPage />}
                />

                {/* Customer routes */}
                <Route
                  path="/customer-list"
                  element={<CustomerListPage />}
                />
                <Route
                  path="/ana-cfm"
                  element={<CFMAnalysisPage />}
                />
                <Route
                  path="/ana-clv"
                  element={<CLVAnalysisPage />}
                />
                <Route
                  path="/ana-churn"
                  element={<ChurnAnalysisPage />}
                />

                {/* Sales routes */}
                <Route
                  path="/leads"
                  element={<LeadsPage />}
                />
                <Route
                  path="/opporturnities"
                  element={<OpportunitiesPage />}
                />

                <Route
                  path="/kanban"
                  element={<KanbanPage />}
                />

                {/* Bills routes */}
                <Route
                  path="/orders"
                  element={<OrderPage />}
                />
                <Route
                  path="/shopping_activity"
                  element={<ShoppingActivityPage />}
                />

                {/* Marketing route */}
                <Route
                  path="/marketing"
                  element={<MarketingPage />}
                />

                {/* Reports routes */}
                <Route
                  path="/reports"
                  element={<ReportPage />}
                />

                {/* Account management routes */}
                <Route
                  path="/employees"
                  element={<EmployeePage />}
                />
                <Route
                  path="/roles"
                  element={<RolePage />}
                />

                {/* Others routes */}
                <Route
                  path="/alerts"
                  element={<AlertsPage />}
                />
                <Route
                  path="/buttons"
                  element={<ButtonsPage />}
                />
                <Route
                  path="/settings"
                  element={<SettingsPage />}
                />

                <Route
                  path="*"
                  element={<NotFound />}
                />
              </Routes>
            </Layout>
          </BrowserRouter>
        </SidebarProvider>
      </div>
    </div>
  );
}

export default App