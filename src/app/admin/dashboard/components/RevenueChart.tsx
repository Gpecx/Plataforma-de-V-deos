"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface RevenueChartProps {
    platform: number
    teacher: number
}

export default function RevenueChart({ platform, teacher }: RevenueChartProps) {
    const data = [
        { name: 'Plataforma', value: platform },
        { name: 'Professores', value: teacher },
    ]

    const COLORS = ['#1D5F31', '#061629']

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#061629', 
                            border: '1px solid #1D5F31',
                            borderRadius: '0px',
                            color: '#fff'
                        }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
