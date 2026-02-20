"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SalesData {
    name: string
    vendas: number
}

const data: SalesData[] = [
    { name: 'Seg', vendas: 400 },
    { name: 'Ter', vendas: 700 },
    { name: 'Qua', vendas: 600 },
    { name: 'Qui', vendas: 800 },
    { name: 'Sex', vendas: 500 },
    { name: 'Sáb', vendas: 900 },
    { name: 'Dom', vendas: 1100 },
]

export function SalesChart() {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0a1f3a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#00C402' }}
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
