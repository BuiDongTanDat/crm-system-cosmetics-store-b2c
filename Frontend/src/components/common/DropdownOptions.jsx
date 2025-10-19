import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export default function DropdownOptions({
  options = [],
  value,
  onChange,
  placeholder = "Chọn",
  disabled = false,
  className = "",
  triggerClassName = "",
  width = "w-full"
}) {
  const selectedOption = options.find(option => option.value === value || option.id === value);
  const displayText = selectedOption ? (selectedOption.label || selectedOption.name) : placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <div
          className={`flex items-center justify-between ${width} px-3 py-2 bg-white border border-gray-300 rounded-lg ${
            disabled
              ? 'bg-gray-50 cursor-not-allowed'
              : 'cursor-pointer hover:border-blue-500'
          } ${triggerClassName}`}
        >
          <span className="text-sm">{displayText}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={`w-[var(--radix-dropdown-menu-trigger-width)] ${className}`}>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value || option.id}
            onSelect={() => onChange?.(option.value || option.id)}
          >
            {option.label || option.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
