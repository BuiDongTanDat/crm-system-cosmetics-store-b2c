import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const TriggerPickerContent = ({ catalog, onSelect }) => {
  const [query, setQuery] = useState('');

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? catalog.filter((item) => (item.label || '').toLowerCase().includes(q))
      : catalog;
  }, [query, catalog]);

  return (
    <div className="p-2">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Tìm kiếm trigger..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="normal"
          className="pl-9 pr-3 py-2 w-full"
          autoFocus
        />
      </div>
      <div className="max-h-96 overflow-auto pr-1">
        {filteredCatalog.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={() => onSelect(it)}
              className="cursor-pointer w-full flex items-start justify-start gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
            >
              <Icon className="w-5 h-5 mt-0.5 text-brand-600" />
              <div className="min-w-0 text-left">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {it.label}
                </div>
                {/*  Hiển thị mô tả */}
                {it.description && (
                  <div className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                    {it.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
        {filteredCatalog.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            Không tìm thấy Trigger phù hợp
          </div>
        )}
      </div>
    </div>
  );
};

export default TriggerPickerContent;