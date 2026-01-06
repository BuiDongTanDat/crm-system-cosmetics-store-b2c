import {
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Tags,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerOptions, actionOptions } from "@/lib/data";
import { formatDate } from "@/utils/helper";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";

export default function AutomationCard({
  automation,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  // Badge trạng thái
  const getStatusBadge = (status) => {
    let color = "bg-gray-100 text-gray-700";
    let text = status ? status : "UNDEFINED";
    if (status === "ACTIVE") {
      color = "bg-green-100 text-green-700";
    } else if (status === "DRAFT") {
      color = "bg-gray-100 text-gray-700";
    } else if (status === "INACTIVE") {
      color = "bg-red-100 text-red-700";
    }
    return (
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${color}`}
      >
        {text}
      </span>
    );
  };

  return (
    <div className="animate-fade-in hover:shadow-lg bg-white rounded-lg border shadow-sm transition-shadow duration-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base line-clamp-1 flex-1">
            {automation.name}
          </h3>
          {getStatusBadge(automation.status)}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">
          {automation.description || "Không có mô tả"}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 space-y-3">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 truncate">{automation.created_by}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 truncate">
              {automation.created_at ? formatDate(automation.created_at) : "—"}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-start gap-2">
          <Tags className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-gray-600 line-clamp-1">
            {(automation.tags || []).length > 0
              ? (automation.tags || []).join(", ")
              : "Không có tag"}
          </span>
        </div>

        {/* Triggers & Actions Summary */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Triggers</div>
            <div className="text-lg font-semibold text-blue-600">
              {automation.triggers?.length || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Actions</div>
            <div className="text-lg font-semibold text-green-600">
              {automation.actions?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Actions */}
      <div className="p-3 border-t bg-gray-50 rounded-bl-md rounded-br-md">
        <div className="flex items-center justify-between gap-2">
          {/* Left: View/Edit/Delete buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="actionRead"
              size="icon"
              onClick={() => onView(automation)}
              className="h-8 w-8"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="actionUpdate"
              size="icon"
              onClick={() => onEdit(automation)}
              className="h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <ConfirmDialog
              title="Xác nhận xóa"
              description={
                <>
                  Bạn có chắc chắn muốn xóa automation{" "}
                  <span className="font-semibold">{automation.name}</span>?
                </>
              }
              confirmText="Xóa"
              cancelText="Hủy"
              onConfirm={() => onDelete(automation.id)}
            >
              <Button variant="actionDelete" size="icon" className="h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            </ConfirmDialog>
          </div>

          {/* Right: Activate/Pause button */}
          <Button
            variant={
              automation.status === "ACTIVE" ? "actionUpdate" : "actionCreate"
            }
            size="sm"
            onClick={() =>
              onStatusChange(
                automation.id,
                automation.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
              )
            }
            className="flex items-center gap-1.5 px-3 h-8"
          >
            {automation.status === "ACTIVE" ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Dừng</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Chạy</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
