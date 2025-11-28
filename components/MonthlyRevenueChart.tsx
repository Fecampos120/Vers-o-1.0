import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartPieIcon } from './Icons';

interface MonthlyRevenueChartProps {
    data: { name: string; value: number }[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-700 text-white p-2 rounded-md shadow-lg border border-slate-600">
                <p className="font-semibold">{`${formatCurrency(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};

const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ data }) => {
    return (
        <div>
            <div className="flex items-center mb-3 px-2">
                <ChartPieIcon className="w-5 h-5 text-slate-400" />
                <h3 className="ml-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Recebimentos Mensais (Ano Atual)
                </h3>
            </div>
            <div style={{ width: '100%', height: 150 }}>
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis 
                            stroke="#64748b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(value) => `${Number(value) / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }}/>
                        <Bar 
                            dataKey="value" 
                            fill="#38b2ac" 
                            radius={[4, 4, 0, 0]} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlyRevenueChart;