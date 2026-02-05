import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Search,
  Info,
  Calendar,
  ChevronLeft,
  MailOpen,
  Mail,
  Star,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Virtuoso } from 'react-virtuoso';
import { cn } from "@/lib/utils";
import { useNotificationStore } from '@/store/useNotificationStore';

export default function NotificationPage() {
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
  } = useNotificationStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && !selected && window.innerWidth >= 1024) {
      setSelected(notifications[0]);
    }
  }, [notifications, selected]);

  const filtered = useMemo(() => {
    if (!search.trim()) return notifications;
    const s = search.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(s) ||
        n.message.toLowerCase().includes(s)
    );
  }, [search, notifications]);

  const handleSelect = (notif) => {
    setSelected(notif);
  };

  const handleMarkAsRead = async (notif) => {
    if (notif.read) return;
    await markAsRead(notif.id);
    setSelected((prev) =>
      prev && prev.id === notif.id ? { ...prev, read: true } : prev
    );
  };

  return (
    // Container cha thêm padding và background xám nhạt để làm nổi bật 2 khối trắng
    <div className="h-full w-full flex py-3 px-2 gap-2 lg:gap-3 overflow-hidden">
      
      {/*  DANH SÁCH (SIDEBAR) */}
      <aside
        className={cn(
          "animate-fade-in  duration-150  flex flex-col h-full w-full lg:w-[400px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all",
          isMobileView && selected ? "hidden" : "flex"
        )}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand/10 rounded-lg text-brand">
              <Bell className="w-5 h-5" />
            </div>
            <span className="font-bold text-gray-900">Thông báo</span>
          </div>
          <span className="text-[13px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
            {notifications.filter(n => !n.read).length} tin chưa đọc
          </span>
        </div>

        <div className="p-4 border-b bg-gray-50/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm nội dung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-gray-200 focus-visible:ring-brand"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">Không tìm thấy thông báo</div>
          ) : (
            <Virtuoso
              style={{ height: '100%' }}
              totalCount={filtered.length}
              data={filtered}
              itemContent={(index, n) => {
                const isSelected = selected?.id === n.id;
                const isUnread = !n.read;

                return (
                  <div
                    onClick={() => handleSelect(n)}
                    className={cn(
                      "relative px-5 py-4 cursor-pointer transition-all border-b border-gray-50",
                      // Highlight khi được chọn
                      isSelected 
                        ? "bg-brand/[0.04]" 
                        : "hover:bg-gray-50 bg-white",
                    )}
                  >
                    {/* Vạch màu bên trái khi được chọn */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand rounded-r-full" />
                    )}

                    <div className="flex gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {isUnread ? (
                          <div className="relative">
                            <Mail className="w-4 h-4 text-brand" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                          </div>
                        ) : (
                          <MailOpen className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "text-sm mb-1 transition-colors",
                          isUnread ? "font-bold text-gray-900" : "font-medium text-gray-600",
                          isSelected && "text-brand"
                        )}>
                          {n.title}
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {n.message}
                        </div>
                        <div className="flex items-center gap-1 mt-3 text-[10px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          {n.time}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>
      </aside>

      {/* CHI TIẾT (MAIN) */}
      <main
        className={cn(
          "animate-fade-in  duration-150 flex-1 flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all",
          isMobileView && !selected ? "hidden" : "flex"
        )}
      >
        {selected ? (
          <>
            <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                {isMobileView && (
                  <Button
                    variant="actionNormal"
                    size="icon"
                    onClick={() => setSelected(null)}
                  
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </Button>
                )}
                <h2 className="font-bold text-lg text-gray-900 line-clamp-1">{selected.title}</h2>
              </div>
              
              {!selected.read && (
                <Button
                  size="sm"
                  variant="actionUpdate"
                  className="gap-2 px-4 shadow-none"
                  onClick={() => handleMarkAsRead(selected)}
                >
                  <Star className="w-4 h-4 fill-current" /> 
                  <span className="hidden sm:inline">Đánh dấu đã đọc</span>
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-10">
              {/* Info bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="p-2 ">
                    <Info className="w-7 h-7 text-brand" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Người gửi</p>
                    <p className="text-sm font-semibold text-gray-700">{selected.sender || 'Hệ thống'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="p-2">
                    <Calendar className="w-7 h-7 text-brand" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Thời gian</p>
                    <p className="text-sm font-semibold text-gray-700">{selected.time}</p>
                  </div>
                </div>
              </div>

              {/* Nội dung tin nhắn */}
              <div className="prose prose-blue max-w-none">
                <div className="text-gray-700 text-base leading-loose whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30">
            <div className="w-20 h-20 bg-white flex items-center justify-center mb-4 ">
              <Bell className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-gray-900 font-bold">Xem thông báo</h3>
            <p className="text-gray-400 text-sm mt-1">Chọn một mục từ danh sách bên trái để đọc chi tiết</p>
          </div>
        )}
      </main>
    </div>
  );
}