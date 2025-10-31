import React, { useState, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';

export default function DropdownWithSearch({
  items = [],
  onSelect,
  renderItem,
  itemKey, // function or string key
  filterFn,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm...",
  children,
  className = "",
  disabled = false,
  contentClassName = "",
}) {
  const [search, setSearch] = useState('');

  const keyFor = (it, idx) => {
    if (typeof itemKey === 'function') return itemKey(it);
    if (typeof itemKey === 'string') return it[itemKey] ?? idx;
    return it?.id ?? it?.product_id ?? it?.customer_id ?? idx;
  };

  const defaultFilter = (it, s) => {
    const txt = (it.name || it.product_name || it.full_name || it.customer_id || it.label || '').toString().toLowerCase();
    return txt.includes((s || '').toLowerCase());
  };

  const filtered = useMemo(() => {
    if (!search) return items;
    return (items || []).filter(it => (filterFn || defaultFilter)(it, search));
  }, [items, search, filterFn]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {children ? children : (
          <div className="flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
            <span className="text-sm truncate">{placeholder}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className={`w-[var(--radix-dropdown-menu-trigger-width)] p-2 ${contentClassName}`}>
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-2 top-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            placeholder={searchPlaceholder}
            className="pl-8 focus:ring-1 focus: border-1"
          />
        </div>

        {(filtered || []).map((it, idx) => (
          <DropdownMenuItem
            key={keyFor(it, idx)}
            onSelect={() => onSelect?.(it)}
            className={className}
          >
            {renderItem ? renderItem(it) : (it.label || it.name || it.full_name || it.customer_id || it.product_name || it.id)}
          </DropdownMenuItem>
        ))}

        {(!filtered || filtered.length === 0) && (
          <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
