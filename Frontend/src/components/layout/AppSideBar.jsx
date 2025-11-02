import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Users,
  CircleUserRound,
  BarChart3,
  Package,
  ReceiptText,
  BadgeDollarSign,
  Megaphone,
  UserRoundPen
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { Button } from "@/components/ui/button";

//Danh sách các menu chính
const navItems = [
  {
    icon: <Home className="w-5 h-5" />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <Package className="w-5 h-5" />,
    name: "Sản phẩm",
    subItems: [
      { name: "Danh mục", path: "/categories", pro: false },
      { name: "Sản phẩm", path: "/products", pro: false },
    ],
  },
  {
    icon: <Users className="w-5 h-5" />,
    name: "Khách hàng",
    subItems: [{ name: "Danh sách KH", path: "/customer-list", pro: false },
    { name: "Phân tích CFM", path: "/ana-cfm", pro: false },
    { name: "Phân tích CLV", path: "/ana-clv", pro: false },
    { name: "Phân tích Churn", path: "/ana-churn", pro: false }
    ],
  },
  {
    name: "Deals",
    icon: <BadgeDollarSign   className="w-5 h-5" />,
    subItems: [
      { name: "Pipeline", path: "/kanban", pro: false },
      { name: "Leads", path: "/leads", pro: false },
      // { name: "Cơ hội bán hàng", path: "/opporturnities", pro: false }
    ],
  },
  {
    name: "Hóa đơn",
    icon: <ReceiptText className="w-5 h-5" />,
    subItems: [
      { name: "Đơn hàng", path: "/orders", pro: false },
      { name: "Hành vi mua hàng", path: "/shopping_activity", pro: false }
    ],
  },
  {
    name: "Marketing",
    icon: <Megaphone className="w-5 h-5" />,
    subItems: [
      { name: "Chiến dịch", path: "/marketing", pro: false },
      { name: "Automation", path: "/automation", pro: false },
      { name: "Phiên bán hàng", path: "/streams", pro: false }
    ],
  },
  {
    name: "Báo cáo",
    icon: <BarChart3 className="w-5 h-5" />,
    path: "/reports",
  },
  {
    name: "Tài khoản",
    icon: <CircleUserRound className="w-5 h-5" />,
    subItems: [
      { name: "Vai trò", path: "/roles", pro: false },
      { name: "Nhân viên", path: "/employees", pro: false }
    ],
  },
];

//Danh sách các menu khác
const othersItems = [

  {
    icon: <UserRoundPen  className="w-5 h-5" />,
    name: "Cá nhân",
    path: "/profile",
  },
  // {
  //   icon: <Settings className="w-5 h-5" />,
  //   name: "Cài đặt",
  //   path: "/settings",
  // },
];

export function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar, isMobile } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState(null); //Trạng thái đóng/mở submenu
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({}); // Tham chiếu đến các phần tử submenu

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  // Tự động mở đúng submenu nếu route nằm trong submenu nào
  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType,
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  // Cập nhật chiều cao submenu mỗi khi đổi submenu mở
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  // Toggle mở/đóng submenu
  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  //Render menu với Button variants
  const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <Button
              variant="menuSubmenu"
              size="menuItem"
              onClick={() => handleSubmenuToggle(index, menuType)}
              data-active={openSubmenu?.type === menuType && openSubmenu?.index === index}
              className={`${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span className="flex-shrink-0">
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="flex-1 text-left">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180"
                      : ""
                    }`}
                />
              )}
            </Button>
          ) : (
            nav.path && (
              <Button
                asChild
                variant="menuItem"
                size="menuItem"
                data-active={isActive(nav.path)}
                className={`${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <Link to={nav.path}>
                  <span className="flex-shrink-0">
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span>{nav.name}</span>
                  )}
                </Link>
              </Button>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-1 space-y-0.5 ml-6">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Button
                      asChild
                      variant="subMenuItem"
                      size="subMenuItem"
                      data-active={isActive(subItem.path)}
                      className={isActive(subItem.path) ? "font-semibold" : "font-normal"}
                    >
                      <Link to={subItem.path}>
                        <span>{subItem.name}</span>
                        <span className="flex items-center gap-1">
                          {subItem.new && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      role="navigation"
      aria-label="Main Sidebar"
      className={`fixed z-50 flex flex-col bg-background border border-border transition-all duration-200 ease-in-out shadow-md ${isExpanded || isMobileOpen || isHovered ? "w-[260px]" : "w-[64px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${!isMobile ? "top-4 left-2 rounded-xl" : "top-0 left-0 h-screen border-r"
        }`}
      style={!isMobile ? { height: "calc(100vh - 32px)" } : undefined}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header compact */}
      <div className="p-3 border-b border-border/40">
        <Link to="/" className="flex items-center gap-2">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <div className="flex items-end justify-center space-x-3">
              <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-7 w-7" />
               <div className="text-brand font-bold text-md">CChain</div>
            </div>
            </>
          ) : (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-brand">
              <img src="/images/logo/Logo.svg" alt="LuBoo" className="h-7 w-7" />
            </div>
          )}
        </Link>
      </div>

      {/* Navigation với spacing compact */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        <nav className="space-y-4">
          <div>
            <h2
              className={`mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
            >
              {isExpanded || isHovered || isMobileOpen ? (
                "Menu"
              ) : (
                <MoreHorizontal className="w-4 h-4" />
              )}
            </h2>
            {renderMenuItems(navItems, "main")}
          </div>

          <div>
            <h2
              className={`mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
            >
              {isExpanded || isHovered || isMobileOpen ? (
                "Others"
              ) : (
                <MoreHorizontal className="w-4 h-4" />
              )}
            </h2>
            {renderMenuItems(othersItems, "others")}
          </div>
        </nav>
      </div>
    </aside>
  );
}