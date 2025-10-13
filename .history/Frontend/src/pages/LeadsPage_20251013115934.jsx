import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import CountUp from 'react-countup';
import { kanbanCards as initialCards } from '@/lib/data';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(amount);

const LeadsPage = () => {
  const [cards, setCards] = useState(initialCards || []);
  const [prevStats, setPrevStats] = useState({ totalDeals: 0, totalValue: 0, conversionRate: 0, activeDeals: 0 });
  const [shouldAnimateStats, setShouldAnimateStats] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShouldAnimateStats(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const stats = {
    totalDeals: cards.length,
    totalValue: cards.reduce((sum, c) => sum + (c.value || 0), 0),
    conversionRate: (cards.filter(c => c.stage === 'closed-won').length / Math.max(cards.length, 1)) * 100,
    activeDeals: cards.filter(c => !['closed-won', 'closed-lost'].includes(c.stage)).length
  };

  useEffect(() => {
    const changed =
      prevStats.totalDeals !== stats.totalDeals ||
      prevStats.totalValue !== stats.totalValue ||
      prevStats.conversionRate !== stats.conversionRate ||
      prevStats.activeDeals !== stats.activeDeals;
    if (changed) {
      setShouldAnimateStats(true);
      const t = setTimeout(() => {
        setPrevStats(stats);
        setShouldAnimateStats(false);
      }, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  return (
    <div className="p-0">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-bold text-gray-900">Khách hàng tiềm năng</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">Tổng số deals</p>
          {shouldAnimateStats ? (
            <CountUp end={stats.totalDeals} start={prevStats.totalDeals} duration={0.5} className="text-lg font-bold text-gray-900" />
          ) : (
            <p className="text-lg font-bold text-gray-900">{stats.totalDeals}</p>
          )}
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">Tổng giá trị</p>
          {shouldAnimateStats ? (
            <CountUp end={stats.totalValue} start={prevStats.totalValue} duration={0.6}
              formattingFn={(value) => formatCurrency(Math.floor(value))}
              className="text-sm font-bold text-gray-900" />
          ) : (
            <p className="text-sm font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
          )}
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">Tỷ lệ chuyển đổi</p>
          {shouldAnimateStats ? (
            <CountUp end={stats.conversionRate} start={prevStats.conversionRate} decimals={1} suffix="%" duration={0.6} className="text-lg font-bold text-gray-900" />
          ) : (
            <p className="text-lg font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
          )}
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">Deals đang xử lý</p>
          {shouldAnimateStats ? (
            <CountUp end={stats.activeDeals} start={prevStats.activeDeals} duration={0.6} className="text-lg font-bold text-gray-900" />
          ) : (
            <p className="text-lg font-bold text-gray-900">{stats.activeDeals}</p>
          )}
        </div>
      </div>

      {/* List view */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-xl font-semibold mb-4">Danh sách deals</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-600 border-b">
                <th className="py-2 px-3">Tiêu đề</th>
                <th className="py-2 px-3 hidden sm:table-cell">Công ty</th>
                <th className="py-2 px-3">Giá trị</th>
                <th className="py-2 px-3">Giai đoạn</th>
                <th className="py-2 px-3">Hoạt động cuối</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
                <tr key={card.id} className="hover:bg-gray-50 border-b">
                  <td className="py-3 px-3">
                    <div className="font-medium">{card.title}</div>
                    <div className="text-xs text-gray-500">{card.contact || card.owner || ''}</div>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">{card.company || '-'}</td>
                  <td className="py-3 px-3">{formatCurrency(card.value || 0)}</td>
                  <td className="py-3 px-3 capitalize">{card.stage || card.status}</td>
                  <td className="py-3 px-3">{card.lastActivity || card.createdDate || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;