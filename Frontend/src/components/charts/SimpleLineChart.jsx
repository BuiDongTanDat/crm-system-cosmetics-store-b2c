import React from 'react';

export default function SimpleLineChart({ data, title, dataKey, nameKey = 'name' }) {
  const maxValue = Math.max(...data.map(item => item[dataKey]));
  const minValue = Math.min(...data.map(item => item[dataKey]));
  const range = maxValue - minValue;

  const getY = (value) => {
    return 100 - ((value - minValue) / range) * 80; // 80% of height for data, 20% for padding
  };

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
      <div className="relative h-64">
        <svg className="w-full h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={`${y}%`}
              x2="100%"
              y2={`${y}%`}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}
          
          {/* Line path */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            points={data.map((item, index) => 
              `${(index / (data.length - 1)) * 100},${getY(item[dataKey])}`
            ).join(' ')}
          />
          
          {/* Data points */}
          {data.map((item, index) => (
            <g key={index}>
              <circle
                cx={`${(index / (data.length - 1)) * 100}%`}
                cy={`${getY(item[dataKey])}%`}
                r="4"
                fill="#3B82F6"
              />
              <text
                x={`${(index / (data.length - 1)) * 100}%`}
                y="95%"
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {item[nameKey]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
