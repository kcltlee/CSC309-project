'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Define fixed colors for consistency across the chart
const COLOURS = {
    regular: '#506a8eff',
    cashier: '#7a9a87ff',
    manager: '#706f6fff',
};

// take stats object
export function UserPieChart({ userStats }) {
    const { total, regular, cashier, manager } = userStats;

    // Data for the chart
    const chartData = [
        { name: 'Regular', value: regular, color: COLOURS.regular },
        { name: 'Cashier', value: cashier, color: COLOURS.cashier },
        { name: 'Manager/Superuser', value: manager, color: COLOURS.manager },
    ].filter(item => item.value > 0); // Only show if counts > 0

    // no users
    if (total === 0 || chartData.length === 0) {
        return (
            <div>No user data available to display distribution.</div>
        );
    }

    // Tooltip shows percentage and count
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = (data.value / total) * 100;

            return (
                <div style={{ backgroundColor: '#FFFFFF', padding: '10px', border: '1px solid #000000' }}>
                    <p>{`${percentage.toFixed(1)}%`}</p>
                    <p>{data.name}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ width: '100%', height: 300, flexGrow: 1, marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" // center x
                        cy="50%" // center y
                        outerRadius={80} // size
                        labelLine={false}
                    >
                        {/* Colour chart */}
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip total={total} />} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}