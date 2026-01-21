import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TrendingUp, ShoppingBag, Clock, Glasses, Users, RefreshCcw, ArrowUpRight } from 'lucide-react';
import { StatCardSkeleton } from '../../components/Skeleton';
import DashboardCharts from '../../components/Admin/DashboardCharts';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        ordersCount: 0,
        productsCount: 0,
        pendingOrders: 0,
        customersCount: 0
    });
    const [orders, setOrders] = useState([]);
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
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            setOrders(allOrders);

            const activeOrders = allOrders.filter(o => o.status !== 'cancelled');
            const totalSales = activeOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
            const pendingOrders = allOrders.filter(o => o.status === 'pending').length;

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
                    <>
                        {[...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)}
                    </>
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

            {/* Charts Section */}
            {!loading && <DashboardCharts orders={orders} />}

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders Feature Placeholder - Functional upgrade candidate */}
                <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-text-main font-outfit uppercase tracking-tight">Top Performance</h3>
                        <TrendingUp size={20} className="text-text-muted" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-text-muted text-sm font-outfit">Performance snapshots and trend analysis are active in the charts above.</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <ShoppingBag size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-text-main font-outfit mb-2">Order Management</h3>
                    <p className="text-text-muted text-sm font-outfit">Detailed order management available in the sidebar.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
