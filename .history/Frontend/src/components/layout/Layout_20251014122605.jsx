import { AppSidebar } from "@/components/layout/AppSideBar";
import AppHeader from "@/components/layout/AppHeader";
import { useSidebar } from "@/context/SidebarContext";

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

  const sidebarWidth = isExpanded || isHovered ? 280 : 72;
  const desktopGap = 8; // Tailwind spacing 5 (px)

  return (
  <div className="relative flex min-h-screen bg-transparent text-foreground">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out w-full min-w-0`}
        style={
          !isMobile
            ? {
                marginLeft: sidebarWidth + desktopGap * 2, // sidebar left gap + itself + right gap
                paddingTop: desktopGap,
                paddingRight: desktopGap,
              }
            : undefined
        }
      >
        <AppHeader />
        <div className="p-0 md:pt-5 md:pr-10 md:px-0 flex-1 w-full mx-auto max-w-screen-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  // SidebarProvider đã được bọc ở App.jsx, tránh lồng kép.
  return <LayoutInner>{children}</LayoutInner>;
}