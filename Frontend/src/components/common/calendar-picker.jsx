"use client";
import { Calendar } from "@/components/ui/calendar";

export default function CalendarPicker({ value, onChange }) {
	return (
		<Calendar
			mode="single"
			defaultMonth={value}
			selected={value}
			onSelect={onChange}
			className="rounded-lg border shadow-sm w-auto min-w-[220px]"
		/>
	);
}
