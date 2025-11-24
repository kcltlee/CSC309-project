'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Map colours 
const COLOURS = {
  automatic: '#506a8eff',
  onetime: '#706f6fff',
};

const getColour = (type) => COLOURS[type.toLowerCase()];

export function PromotionChart({ promotions }) {
  // Count promotions by type
  const typeCounts = promotions.reduce((acc, promo) => {
    const type = promo.type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Format data 
  const chartData = Object.keys(typeCounts).map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
    value: typeCounts[type],
    color: getColour(type)
  }));

  const total = promotions.length;

  if (total === 0) {
    return (
      <div>No data available.</div>
    );
  }

  // Tooltip should show count and percentage
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = (data.value / total) * 100;

      return (
        <div style={{ backgroundColor: '#FFFFFF', padding: '8px', border: '1px solid #000000' }}>
          <p>{`${percentage.toFixed(1)}%`}</p>
          <p>{data.name}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 250, flexGrow: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60} // radius of hole
            outerRadius={90}
            paddingAngle={0} // gap between  
          >
            {/* Colour the chart */}
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}