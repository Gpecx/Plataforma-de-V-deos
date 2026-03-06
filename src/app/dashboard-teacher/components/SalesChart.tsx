"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SalesData {
    name: string
    vendas: number
}

export function SalesChart({ data }: { data: SalesData[] }) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#0f172a"
                        fontSize={12}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#0f172a"
                        fontSize={12}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            color: '#334155',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ color: '#00C402', fontWeight: 'bold' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="vendas"
                        stroke="#00C402"
                        strokeWidth={3}
                        dot={{ fill: '#00C402', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
