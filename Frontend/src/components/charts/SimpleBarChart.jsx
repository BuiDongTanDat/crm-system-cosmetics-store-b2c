import React from 'react';

export default function SimpleBarChart({ data, title, dataKey, nameKey = 'name', color = '#3B82F6' }) {
  const maxValue = Math.max(...data.map(item => item[dataKey]));

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-600 truncate">
              {item[nameKey]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
              <div
                className="h-8 rounded-full flex items-center justify-end pr-2 text-white text-sm font-medium"
                style={{
                  width: `${(item[dataKey] / maxValue) * 100}%`,
                  backgroundColor: color,
                  minWidth: '40px'
                }}
              >
                {formatValue(item[dataKey])}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
