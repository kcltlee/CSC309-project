'use client';

// Template from Recharts official documentation: https://recharts.github.io/en-US/examples/BarChartHasBackground/

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function EventsBarChart({ data }) {
  // Max event count 
  const maxCount = Math.max(...data.map((item) => item.count));

  // Set y axis based on min (0) and max
  const yDomain = [
    0,
    // if no events, set 5 as default max; otherwise, set max + 1 (for top padding)
    maxCount === 0 ? 5 : maxCount + 1,
  ];

  return (
    <div style={{ width: '100%', height: 300, flexGrow: 1 }}>
      {/* Scale chart with screen size */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          // Adjust however
          margin={{
            top: 20,
            right: 10,
            left: -20,
            bottom: 5,
          }}
        >
          {/* This adds optional grid lines (can be removed) */}
          <CartesianGrid strokeDasharray="3 3" />

          {/* Scale the x axis */}
          <XAxis dataKey="label" tickLine={false} interval={0} />

          {/* Scale the y axis */}
          <YAxis
            allowDecimals={false}
            domain={yDomain} // set the y domain based on data 
            label={{
              value: 'Number of Events',
              angle: -90, // rotate label to make it align with y axis  
              position: 'center',
            }}
          />

          {/* When hover */}
          <Tooltip
            cursor={{ fill: 'rgba(9, 9, 9, 0.06)' }}
            formatter={(value) => [
              `${value} Events`, // Label that shows when we hover 
            ]}
          />

          {/* bars */}
          <Bar
            dataKey="count"
            fill="#706f6fff"
            name="Events"
            radius={[4, 4, 0, 0]} // Round edges 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
