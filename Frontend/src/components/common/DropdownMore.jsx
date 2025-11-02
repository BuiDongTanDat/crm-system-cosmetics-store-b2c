import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { Button } from '../ui/button';

// Lý do có thêm bảng màu vì DropdownMore cần dùng màu động từ props truyền vào
// Bảng mapping lớp -> màu hex 
//Tailwind không compile được hover:${dynamic_class}, nên khi hover UI lib override text 
// -> thành màu đen. Cần dùng class tĩnh hoặc inline style để giữ màu icon/text.
const COLOR_MAP = {
  'text-blue-500': '#3b82f6',
  'text-blue-600': '#2563eb',
  'text-blue-700': '#1d4ed8',
  'text-red-500': '#ef4444',
  'text-red-600': '#dc2626',
  'text-red-700': '#b91c1c',
  'text-yellow-500': '#eab308',
  'text-yellow-600': '#ca8a04',
  'text-gray-500': '#6b7280',
  'text-gray-700': '#374151',
  'text-gray-400': '#9ca3af',
  // thêm khi cần...
};
const BG_MAP = {
  'bg-blue-100': '#dbeafe',
  'bg-red-100': '#fee2e2',
  'bg-yellow-100': '#fff7cc',
  'bg-gray-100': '#f3f4f6',
};

export default function DropdownMore({
  options = [],
  value,
  onChange,
  disabled = false,
  className = '',
  triggerClassName = '',
  side = 'right',
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  const getHex = (cls, map, fallback = undefined) => {
    if (!cls) return fallback;
    // nếu truyền nhiều class (ví dụ "text-blue-500 other"), lấy phần có tiền tố text- hoặc bg-
    const parts = cls.split(/\s+/);
    for (const p of parts) {
      if (map[p]) return map[p];
    }
    return fallback;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="actionMore"
          size="none"
          className={triggerClassName}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((p) => !p);
          }}
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side={side} className={`min-w-[140px] p-1 ${className}`}>
        {options.map((option) => {
          const key = option.value ?? option.id;
          const iconHex = getHex(option.iconColor, COLOR_MAP, undefined);
          const textHex = getHex(option.textColor, COLOR_MAP, undefined) ?? iconHex;
          const hoverBgHex = getHex(option.hoverBg, BG_MAP, undefined);

          const isHover = hovered === key;

          return (
            <DropdownMenuItem
              key={key}
              onSelect={() => {
                onChange?.(option.value ?? option.id);
                setOpen(false);
              }}
              // dùng handlers để quản lý hover state và stopPropagation nếu cần
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition`}
              // style inline để override bất kỳ màu hover mặc định nào của lib
              style={{
                backgroundColor: isHover ? hoverBgHex : undefined,
              }}
            >
              {option.icon && (
                <span
                  className="w-4 h-4 flex items-center justify-center"
                  // color inline để bắt buộc icon đổi màu
                  style={{ color: isHover ? textHex : iconHex }}
                >
                  {option.icon}
                </span>
              )}

              <span
                className="text-sm font-normal"
                style={{ color: isHover ? textHex : textHex }}
              >
                {option.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
