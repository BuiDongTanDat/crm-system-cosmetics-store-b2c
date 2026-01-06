import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function DateButtonPicker({ value, onChange, className }) {
  const [open, setOpen] = React.useState(false);

  const getLabel = () => {
    if (value) {
      return format(value, "dd/MM/yyyy", { locale: vi });
    }
    return <span>Chọn ngày</span>;
  };

  const handleSelect = (date) => {
    onChange?.(date);
    if (date) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="actionNormal"
          className={cn(
            "w-full justify-start text-left font-normal hover:text-black active:bg-white active:text-black border border-gray-300 rounded-lg",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          defaultMonth={value}
          selected={value}
          onSelect={handleSelect}
          className="rounded-lg border shadow-sm w-auto min-w-[220px]"
        />
      </PopoverContent>
    </Popover>
  );
}
