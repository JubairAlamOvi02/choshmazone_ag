import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { TrendingUp, ShoppingBag, Clock, Glasses, Users, RefreshCcw, ArrowUpRight } from 'lucide-react';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        ordersCount: 0,
        productsCount: 0,
        pendingOrders: 0,
        customersCount: 0
    });
    const [orders, setOrders] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // 1. Fetch Orders and calculate Sales
            const { data: allOrders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: true });

            if (ordersError) throw ordersError;

            setOrders([...allOrders].reverse());

            const activeOrders = allOrders.filter(o => o.status !== 'cancelled');
            const totalSales = activeOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
            const pendingOrders = allOrders.filter(o => o.status === 'pending').length;

            // Process chart data (Last 7 days)
            const salesByDate = allOrders.reduce((acc, order) => {
                const date = new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                acc[date] = (acc[date] || 0) + Number(order.total_amount);
                return acc;
            }, {});

            const formattedChartData = Object.entries(salesByDate).map(([name, sales]) => ({
                name,
                sales
            })).slice(-7);

            setChartData(formattedChartData);

            // 2. Fetch Products count
            const { count: productsCount, error: productsError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            if (productsError) throw productsError;

            // 3. Fetch Customers count
            const { count: customersCount, error: customersError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (customersError) throw customersError;

            setStats({
                totalSales,
                ordersCount: allOrders.length,
                productsCount: productsCount || 0,
                pendingOrders,
                customersCount: customersCount || 0
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, bgColor, textColor, trend }) => (
        <div className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${bgColor}`}>
                    <Icon size={24} className={textColor} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold font-outfit">
                        <ArrowUpRight size={14} />
                        {trend}
                    </div>
                )}
            </div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-1 font-outfit">{title}</h3>
            <p className="text-2xl font-bold text-text-main font-outfit">{value}</p>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">Dashboard Overview</h1>
                    <p className="text-text-muted font-outfit">Real-time business performance analytics.</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-border rounded-xl text-sm font-bold text-text-main hover:bg-gray-50 transition-all font-outfit uppercase tracking-widest shadow-sm"
                >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh Stats
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm animate-pulse">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4"></div>
                            <div className="w-20 h-4 bg-gray-100 rounded mb-2"></div>
                            <div className="w-12 h-6 bg-gray-100 rounded"></div>
                        </div>
                    ))
                ) : (
                    <>
                        <StatCard
                            title="Total Sales"
                            value={`৳${stats.totalSales.toLocaleString()}`}
                            icon={TrendingUp}
                            bgColor="bg-green-50"
                            textColor="text-green-600"
                            trend="+12.5%"
                        />
                        <StatCard
                            title="Total Orders"
                            value={stats.ordersCount}
                            icon={ShoppingBag}
                            bgColor="bg-indigo-50"
                            textColor="text-indigo-600"
                        />
                        <StatCard
                            title="Pending"
                            value={stats.pendingOrders}
                            icon={Clock}
                            bgColor="bg-amber-50"
                            textColor="text-amber-600"
                        />
                        <StatCard
                            title="Products"
                            value={stats.productsCount}
                            icon={Glasses}
                            bgColor="bg-sky-50"
                            textColor="text-sky-600"
                        />
                        <StatCard
                            title="Customers"
                            value={stats.customersCount}
                            icon={Users}
                            bgColor="bg-slate-50"
                            textColor="text-slate-600"
                        />
                    </>
                )}
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-[2fr_1.2fr] gap-8">
                {/* Sales Chart */}
                <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm overflow-hidden h-full min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-tight">Sales Performance</h3>
                            <p className="text-xs text-text-muted font-outfit">Revenue trends for the last 7 active days</p>
                        </div>
                        <TrendingUp size={20} className="text-text-muted" />
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#666', fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#666', fontWeight: 600 }}
                                    tickFormatter={(val) => `৳${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                    formatter={(value) => [`৳${value}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#d4af37"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-tight">Recent Orders</h3>
                        <Link to="/admin/orders" className="text-xs font-bold text-primary hover:text-secondary transition-colors uppercase tracking-widest font-outfit border-b border-primary/20 hover:border-secondary">View All</Link>
                    </div>

                    <div className="space-y-6 flex-1">
                        {orders.slice(0, 5).map(order => (
                            <div key={order.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-main font-outfit">#{order.id.slice(0, 8)}</p>
                                        <p className="text-[10px] text-text-muted font-outfit uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-primary font-outfit">৳{Number(order.total_amount).toLocaleString()}</p>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && !loading && (
                            <div className="text-center py-10">
                                <p className="text-text-muted text-sm font-outfit">No orders found yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
