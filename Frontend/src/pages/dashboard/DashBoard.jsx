"use client";


import { AppSidebar } from "@/components/app-sidebar";
import { OrdersChart } from "@/pages/dashboard/components/order-chart";
import { DataTable } from "@/pages/dashboard/components/data-table";
import SectionCards from "./components/section-cards";

import data from "@/app/dashboard/data.json";
import { RevenueChart } from "./components/revenue-chart";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/helper";
import { Calendar } from "lucide-react";

export default function DashBoard() {
  const ANIM_COUNT = 4;
  const [visible, setVisible] = useState(Array(ANIM_COUNT).fill(false));

  useEffect(() => {
    // TÍnh toán thời gian hợp lý để stagger animation
    const timers = [];
    const base = 10; // ms
    const step = 20; // ms
    for (let i = 0; i < ANIM_COUNT; i++) {
      timers.push(
        setTimeout(() => {
          setVisible((prev) => {
            const copy = [...prev];
            copy[i] = true;
            return copy;
          });
        }, base + i * step)
      );
    }
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className=" @container/main flex flex-1 flex-col gap-0">
        {/* Header */}
        <div className="px-6 pt-4 flex justify-between h-auto items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Tổng quan về hiệu suất kinh doanh
          </p>
          </div>
          <div className="h-auto bg-white text-slate-800 p-2 rounded-md shadow items-center flex text-sm font-medium">
           
            <Calendar className="w-4 h-4 mr-2"/>{formatDate(new Date())}
          </div>
        </div>
        <div className="flex flex-col gap-4 md:gap-4 md:py-6">
          <SectionCards
            className={
              (visible[0]
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3") +
              " transition-all duration-200 ease-out"
            }
            style={{ transitionDelay: `${1 * 60}ms` }}
          />
          <div className="px-4 lg:px-6 flex flex-col md:flex-row gap-4 md:gap-4">
            <div
              className={
                (visible[1]
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3") +
                " transition-all duration-200 ease-out flex-1"
              }
              style={{ transitionDelay: `${2 * 60}ms` }}
            >
              <OrdersChart />
            </div>
            <div
              className={
                (visible[2]
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3") +
                " transition-all duration-200 ease-out flex-1"
              }
              style={{ transitionDelay: `${3 * 60}ms` }}
            >
              <RevenueChart />
            </div>
          </div>

          <DataTable
            data={data}
            className={
              (visible[3]
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3") +
              " transition-all duration-200 ease-out"
            }
            style={{ transitionDelay: `${4 * 60}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
