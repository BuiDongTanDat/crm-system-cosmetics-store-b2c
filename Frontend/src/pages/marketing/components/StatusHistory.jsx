import React, { useMemo } from "react";
import { CheckCircle, XCircle, Clock, Send } from "lucide-react";

const StatusHistory = React.memo(({ history }) => {
  if (!Array.isArray(history) || history.length === 0) return null;

  // Sort newer first - sử dụng useMemo để tránh sort lại không cần thiết
  const sorted = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [history]);

  const getIcon = (action) => {
    switch (action) {
      case "submit":
        return <Send className="w-4 h-4 text-blue-500" />;
      case "reject":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "approve":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLabel = (action, status) => {
    switch (action) {
      case "submit":
        return "Đã gửi duyệt";
      case "reject":
        return "Bị từ chối";
      case "approve":
        return "Đã duyệt";
      default:
        return status;
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-semibold mb-4 text-sm uppercase text-gray-500">
        Lịch sử hoạt động
      </h3>
      <div className="relative pl-4 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
        {sorted.map((item, i) => (
          <div key={`${item.at}-${i}`} className="relative pl-6">
            <div
              className="absolute left-[-15px] 
                        
                        flex items-center justify-center
                        bg-white rounded-full
                        border border-gray-100 shadow-sm
                        z-10
                        p-1
                        "
            >
              {" "}
              {getIcon(item.action)}
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900 flex items-center gap-2">
                {getLabel(item.action, item.status)}
                <span className="text-xs font-normal text-gray-400">
                  {new Date(item.at).toLocaleString("vi-VN")}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Bởi: {item.by || "Hệ thống"}
              </p>
              {item.reason && (
                <div className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded border border-red-100">
                  Lý do: {item.reason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

StatusHistory.displayName = 'StatusHistory';

export default StatusHistory;
