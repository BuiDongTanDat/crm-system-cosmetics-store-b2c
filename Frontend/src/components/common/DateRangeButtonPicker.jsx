import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";

export default function DateRangeButtonPicker({ value, onChange }) {
  const [open, setOpen] = React.useState(false);

  const getLabel = () => {
    if (value?.from && value?.to) {
      return (
        <>
          {format(value.from, "dd/MM/yyyy", { locale: vi })} - {format(value.to, "dd/MM/yyyy", { locale: vi })}
        </>
      );
    }
    if (value?.from) {
      return format(value.from, "dd/MM/yyyy", { locale: vi });
    }
    return <span>Chọn khoảng thời gian</span>;
  };

  const handleSelect = (range) => {
    onChange?.(range);
    if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="actionNormal"
          className="w-auto justify-start text-left font-normal hover:text-black active:bg-white active:text-black border border-gray-300 rounded-lg"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={handleSelect}
          className="rounded-lg border shadow-sm w-auto min-w-[220px]"
        />
      </PopoverContent>
    </Popover>
  );
}
