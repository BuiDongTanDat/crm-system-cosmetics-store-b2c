"use client";
import * as React from "react"

import { Calendar } from "@/components/ui/calendar"

export default function CalendarRangePicker({ value, onChange }) {
  return (
    <Calendar
      mode="range"
      defaultMonth={value?.from}
      selected={value}
      onSelect={onChange}
      className="rounded-lg border shadow-sm w-auto min-w-[220px]" />
  );
}
