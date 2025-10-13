import { useEffect, useState } from "react";
import { Menu, X, ChevronFirst, ChevronLast, Search, Bell, ChevronDown, User, KeyRound, LogOut } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useLocation } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { notifications as mockNotifications } from '@/lib/data';

export default function AppHeader() {
  const {
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
    isExpanded,
    isMobile,
  } = useSidebar();

  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
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
    <header className={`sticky top-5 z-30 flex items-center justify-between h-14 px-4 gap-4 transition-all duration-300 ${isScrolled
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

        {/* Search input với icon bên trong */}
        <div className="relative w-56 md:w-72 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className={`w-full h-10 pl-9 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all ${isScrolled
              ? 'border-gray-200 bg-white/90 dark:bg-gray-800/90'
              : 'border-border/60 bg-white dark:bg-gray-800/60 backdrop-blur'
              }`}
          />
        </div>

      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="actionNormal" aria-label="Notifications">
              <Bell className="w-5 h-5" />

            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-96 p-0 overflow-hidden" align="end" sideOffset={8}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Thông báo</h3>
              <button className="text-sm text-destructive px-2 hover:shadow-md" onClick={() => setNotifList([])}>Xóa tất cả</button>
            </div>
            <div className="max-h-[60vh] overflow-auto divide-y">
              {notifList.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Không có thông báo mới</div>
              ) : (
                notifList.map(n => (
                  <div key={n.id} className={`p-3 flex items-start gap-3 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">{n.title}</div>
                        <div className="text-xs text-gray-400">{n.time}</div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{n.message}</div>
                      <div className="mt-2 flex gap-2">
                        {!n.read && (
                          <button onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }} className="text-xs text-blue-600">Đánh dấu đã đọc</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="text-xs text-red-600">Xóa</button>
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
            <div className={`flex items-center gap-2 rounded-xl px-2 py-1 cursor-pointer hover:border-primary/60 transition-colors border border-transparent ${isScrolled
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