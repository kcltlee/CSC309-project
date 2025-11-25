'use client';

import React from 'react';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";


// take stats object
export function UserLineChart({ chartData }) {
    return (
        <ResponsiveContainer width="93%" height="300">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 20, bottom: 20 }}>
                {/* grid lines (can be removed) */}
                <CartesianGrid strokeDasharray="3 3" />

                {/* x axis */}
                <XAxis
                    dataKey="name"
                    label={{
                        value: 'Transaction',
                        position: 'insideBottom',
                        offset: -15, // prevent overlap 
                        style: { fontSize: 14, fill: '#000000' }
                    }}
                    padding={{ bottom: 10 }}
                />

                {/* y axis*/}
                <YAxis
                    label={{
                        value: 'Points',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 14, fill: '#000000' }
                    }}
                />

                {/* pop up box when hover */}
                <Tooltip />

                {/* y axis at 0 (can be removed) */}
                <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />

                <Line
                    type="linear"
                    dataKey="points"
                    stroke="#000000"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}