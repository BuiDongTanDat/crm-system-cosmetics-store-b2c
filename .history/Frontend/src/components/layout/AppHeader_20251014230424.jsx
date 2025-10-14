import { useEffect, useState } from "react";
import { Menu, X, ChevronFirst, ChevronLast, Search, Bell, ChevronDown, User, KeyRound, LogOut } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useLocation, useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { notifications as mockNotifications } from '@/lib/data';

// Danh sách các trang từ sidebar để tìm kiếm
const searchablePages = [
  { name: "Dashboard", path: "/", keywords: ["dashboard", "trang chủ", "home"] },
  { name: "Sản phẩm", path: "/products", keywords: ["sản phẩm", "product", "hàng hóa"] },
  { name: "Danh sách KH", path: "/customer-list", keywords: ["khách hàng", "customer", "danh sách", "kh"] },
  { name: "Phân tích CFM", path: "/ana-cfm", keywords: ["cfm", "phân tích", "analysis"] },
  { name: "Phân tích CLV", path: "/ana-clv", keywords: ["clv", "phân tích", "analysis"] },
  { name: "Phân tích Churn", path: "/ana-churn", keywords: ["churn", "phân tích", "analysis"] },
  { name: "Pipeline B2C", path: "/kanban", keywords: ["pipeline", "b2c", "kanban", "bán hàng"] },
  { name: "Khách hàng tiềm năng", path: "/leads", keywords: ["leads", "tiềm năng", "prospect"] },
  { name: "Cơ hội bán hàng", path: "/opporturnities", keywords: ["opportunity", "cơ hội", "bán hàng"] },
  { name: "Đơn hàng", path: "/orders", keywords: ["đơn hàng", "order", "hóa đơn"] },
  { name: "Hành vi mua hàng", path: "/shopping_activity", keywords: ["hành vi", "mua hàng", "shopping", "activity"] },
  { name: "Chiến dịch Marketing", path: "/marketing", keywords: ["marketing", "chiến dịch", "campaign"] },
  { name: "Automation", path: "/automation", keywords: ["automation", "tự động", "email"] },
  { name: "Báo cáo", path: "/reports", keywords: ["báo cáo", "report", "thống kê"] },
  { name: "Vai trò", path: "/roles", keywords: ["vai trò", "role", "quyền", "permission"] },
  { name: "Nhân viên", path: "/employees", keywords: ["nhân viên", "employee", "staff"] },
  { name: "Cá nhân", path: "/profile", keywords: ["cá nhân", "profile", "thông tin"] },
  { name: "Cài đặt", path: "/settings", keywords: ["cài đặt", "setting", "config"] }
];

export default function AppHeader() {
  const {
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
    isExpanded,
    isMobile,
  } = useSidebar();

  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  // notifications list (mock data)
  const [notifList, setNotifList] = useState(mockNotifications || []);

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50); // Thay đổi background sau khi scroll 50px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đổi route thì auto đóng sidebar mobile và clear search
  useEffect(() => {
    if (isMobileOpen) toggleMobileSidebar();
    setSearchQuery('');
    setShowSearchResults(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Xử lý tìm kiếm
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const filtered = searchablePages.filter(page => {
      const searchTerm = query.toLowerCase();
      return (
        page.name.toLowerCase().includes(searchTerm) ||
        page.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
    });

    setSearchResults(filtered);
    setShowSearchResults(true);
  };

  // Chọn trang từ kết quả tìm kiếm
  const handleSelectPage = (path) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Đóng kết quả tìm kiếm khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Đổi route thì auto đóng sidebar mobile
  useEffect(() => {
    if (isMobileOpen) toggleMobileSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleToggle = () => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  const handleLogout = () => {
    // TODO: integrate real logout logic (clear tokens, call API, redirect)
    console.log('Logging out...');
  };

  const goProfile = () => {
    // TODO: navigate to profile page
    console.log('Go to profile');
  };

  const goChangePassword = () => {
    // TODO: navigate to change password page
    console.log('Go to change password');
  };

  const markAsRead = (id) => setNotifList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const deleteNotification = (id) => setNotifList(prev => prev.filter(n => n.id !== id));

  return (
    <header className={`sticky top-2 z-30 flex items-center justify-between h-14 px-4 gap-4 transition-all duration-300 ${isScrolled
      ? 'bg-white/90 backdrop-blur-md shadow-lg border border-white/20 rounded-lg mx-4'
      : 'bg-transparent'
      }`}>
      {/* Left: toggle + search */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          onClick={handleToggle}
          variant={"actionNormal"}
          aria-label="Toggle Sidebar"
          aria-expanded={isMobileOpen}
        >
          {isMobile
            ? (isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />)
            : (isExpanded ? <ChevronFirst className="w-5 h-5" /> : <ChevronLast className="w-5 h-5" />)}
        </Button>

        {/* Search input với dropdown results */}
        <div className="relative w-56 md:w-72 lg:w-80 search-container">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm chức năng..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className={`w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all ${isScrolled
              ? 'border-gray-200 bg-white/90 dark:bg-gray-800/90'
              : 'border-border/60 bg-white dark:bg-gray-800/60 backdrop-blur'
              }`}
          />
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
              {searchResults.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    Kết quả tìm kiếm ({searchResults.length})
                  </div>
                  {searchResults.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectPage(page.path)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <Search className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {page.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {page.path}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Không tìm thấy kết quả phù hợp
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="actionNormal" aria-label="Notifications" className="relative  data-[state=open]:shadow-none">
              <Bell className="w-5 h-5" />
              {/*Badge nếu có thông báo chưa đọc */}
              {notifList.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-96 p-0 overflow-hidden" align="end" sideOffset={8}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
              <h3 className="font-semibold">Thông báo</h3>
              <button
                className="text-sm text-destructive px-2 hover:underline"
                onClick={() => setNotifList([])}
              >
                Xóa tất cả
              </button>
            </div>

            {/* List */}
            <div className="max-h-[60vh] overflow-auto divide-y">
              {notifList.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Không có thông báo mới
                </div>
              ) : (
                notifList.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 flex items-start gap-3 transition-colors duration-150 cursor-pointer 
              ${n.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{n.title}</div>
                        <div className="text-xs text-gray-400">{n.time}</div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{n.message}</div>
                      <div className="mt-2 flex gap-2">
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className={`flex items-center gap-2 rounded-xl px-2 py-1 cursor-pointer hover:border-brand transition-colors border border-transparent ${isScrolled
              ? 'bg-white/90 dark:bg-gray-800/90'
              : 'bg-white dark:bg-gray-800/60 backdrop-blur'
              }`}>
              <img
                src="/images/user/Tom meme.jpg"
                alt="User Avatar"
                className="w-9 h-9 rounded-full object-cover"
              />
              <div className="hidden sm:flex flex-col leading-tight min-w-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">Alex Nguyen</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Admin</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52" align="end" sideOffset={8}>
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-medium">Alex Nguyen</span>
              <span className="text-xs text-muted-foreground">admin@example.com</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={goProfile} className="cursor-pointer">
              <User className="w-4 h-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={goChangePassword} className="cursor-pointer">
              <KeyRound className="w-4 h-4 mr-2" /> Đổi mật khẩu
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}