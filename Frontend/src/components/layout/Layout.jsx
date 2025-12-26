import { AppSidebar } from "@/components/layout/AppSideBar";
import AppHeader from "@/components/layout/AppHeader";
import { useSidebar } from "@/context/SidebarContext";
import { Outlet } from "react-router";

function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  if (!isMobileOpen) return null;
  return (
    <div
      onClick={toggleMobileSidebar}
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
    />
  );
}

function LayoutInner({ children }) {
  const { isExpanded, isMobileOpen, isHovered, isMobile } = useSidebar();

  const sidebarWidth = isExpanded || isHovered ? 260 : 62; /// Sidebar chiếm 260 với 64
  const desktopGap = 0;

  return (
    <div className="relative flex min-h-screen bg-transparent text-foreground">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out w-full min-w-0`}
        style={
          !isMobile
            ? {
              marginLeft: sidebarWidth, // sidebar left gap + itself + right gap
              paddingTop: desktopGap,
              paddingRight: desktopGap,
            }
            : undefined
        }
      >
        <AppHeader />
        <div className="px-3 py-1 flex-1 w-full mx-auto max-w-screen "
          
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  // SidebarProvider đã được bọc ở App.jsx, tránh lồng kép.
  return <LayoutInner><Outlet/></LayoutInner>;
}