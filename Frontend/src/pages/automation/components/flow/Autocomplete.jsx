import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A beautiful Autocomplete component that allows:
 * 1. Manual typing (free text)
 * 2. Selection from a list of suggestions
 * 3. Searching within suggestions
 */
export default function Autocomplete({
    value = "",
    onChange,
    options = [],
    placeholder = "Nhập hoặc chọn...",
    className
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const inputRef = useRef(null);

    // Sync search state
    useEffect(() => {
        if (open) setSearch("");
    }, [open]);

    const filteredOptions = options.filter((opt) =>
        String(opt).toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val) => {
        onChange?.(val);
        setOpen(false);
        // Return focus to input after selection
        inputRef.current?.focus();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={cn("relative flex w-full items-center group", className)}>
                    <Input
                        variant="normal"
                        ref={inputRef}
                        value={value}
                        onFocus={() => !open && setOpen(true)}
                        onChange={(e) => {
                            onChange?.(e.target.value);
                            if (!open) setOpen(true);
                        }}
                        placeholder={placeholder}
                        className="pr-10 bg-white border-gray-200 shadow-sm focus-visible:ring-brand-500 focus-visible:border-brand-500 transition-all"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 group-hover:text-gray-600"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpen(!open);
                        }}
                    >
                        <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                </div>
            </PopoverTrigger>

            <PopoverContent
                className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[200px] overflow-hidden shadow-xl border-gray-200"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex items-center border-b px-3 h-10 bg-gray-50/50">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-40" />
                    <Input
                        variant="normal"
                        className="flex h-full w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Tìm kiếm gợi ý..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1 bg-white">
                    {filteredOptions.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400 italic">
                            Không tìm thấy gợi ý nào.
                        </div>
                    ) : (
                        filteredOptions.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                className={cn(
                                    "relative flex w-full cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none hover:bg-brand-50 hover:text-brand-700 transition-colors text-left",
                                    value === opt && "bg-brand-50 text-brand-700 font-semibold"
                                )}
                                onClick={() => handleSelect(opt)}
                            >
                                <div className="flex-1 truncate">{opt}</div>
                                {value === opt && (
                                    <Check className="ml-2 h-4 w-4 shrink-0 opacity-100" />
                                )}
                            </button>
                        ))
                    )}
                </div>

                {value && !options.includes(value) && (
                    <div className="border-t p-2.5 bg-gray-50/80">
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 px-1">
                            Giá trị tùy chỉnh hiện tại
                        </div>
                        <div className="flex items-center gap-2 px-1 text-sm text-brand-600 font-medium truncate italic bg-white/50 rounded p-1 border border-white">
                            "{value}"
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
