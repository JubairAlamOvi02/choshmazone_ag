import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { format, subDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';

const DashboardCharts = ({ orders = [] }) => {
    // Process data for charts
    const chartData = useMemo(() => {
        if (!orders || orders.length === 0) return [];

        // Generate last 7 days labels
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), 6 - i);
            return {
                date: format(date, 'MMM dd'),
                fullDate: startOfDay(date),
                revenue: 0,
                orders: 0
            };
        });

        // Map orders to days
        orders.forEach(order => {
            const orderDate = startOfDay(parseISO(order.created_at));
            const dayEntry = last7Days.find(d => d.fullDate.getTime() === orderDate.getTime());

            if (dayEntry && order.status !== 'cancelled') {
                dayEntry.revenue += Number(order.total_amount || 0);
                dayEntry.orders += 1;
            }
        });

        return last7Days;
    }, [orders]);

    const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const averageOrderValue = orders.length > 0
        ? totalRevenue / orders.filter(o => o.status !== 'cancelled').length
        : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
            {/* Revenue Trend Area Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-tight">Revenue Trend</h3>
                    <p className="text-xs text-text-muted">Net revenue over the last 7 days</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#666' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#666' }}
                                tickFormatter={(value) => `৳${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value) => [`৳${value}`, 'Revenue']}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#d4af37"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRev)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Order Volume Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-tight">Order Volume</h3>
                    <p className="text-xs text-text-muted">Number of orders successfully placed</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#666' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#666' }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f9f9f9' }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 6 ? '#0a0a0a' : '#d4af37'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
