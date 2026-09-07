import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Activity, Users, Eye, ShoppingCart, CreditCard, ShoppingBag,
    TrendingUp, RefreshCw, Smartphone, Monitor, Tablet, Search,
    Filter, ArrowDown, ExternalLink, Clock, ShieldCheck, ChevronRight,
    AlertCircle, Sparkles, X, CheckCircle2, ChevronDown
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar
} from 'recharts';

const TIME_RANGES = [
    { label: 'Today', value: 'today' },
    { label: 'Last 24 Hours', value: '24h' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'All Time', value: 'all' }
];

const EVENT_TYPE_CONFIG = {
    page_view: { label: 'Page View', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Eye },
    view_product: { label: 'View Product', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Sparkles },
    add_to_cart: { label: 'Add to Cart', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: ShoppingCart },
    remove_from_cart: { label: 'Remove Cart', color: 'bg-red-50 text-red-600 border-red-200', icon: X },
    initiate_checkout: { label: 'Initiate Checkout', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: CreditCard },
    purchase: { label: 'Purchase', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: ShoppingBag }
};

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }) => (
    <div className="bg-white p-5 rounded-2xl border border-border shadow-xs hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} />
            </div>
            {trend !== undefined && (
                <span className="text-xs font-bold font-outfit px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                    {trend}
                </span>
            )}
        </div>
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 font-outfit">{title}</h4>
        <p className="text-2xl font-black text-text-main font-outfit tracking-tight">{value}</p>
        {subtext && <p className="text-xs text-text-muted mt-1 font-outfit">{subtext}</p>}
    </div>
);

const WebLogs = () => {
    const [timeRange, setTimeRange] = useState('7d');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [events, setEvents] = useState([]);
    const [eventFilter, setEventFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEventModal, setSelectedEventModal] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'products'

    // Compute start date based on selected time range
    const getStartDate = useCallback(() => {
        const now = new Date();
        if (timeRange === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today.toISOString();
        } else if (timeRange === '24h') {
            return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        } else if (timeRange === '7d') {
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (timeRange === '30d') {
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        return null; // all time
    }, [timeRange]);

    const fetchData = useCallback(async (isSilent = false) => {
        if (!isSilent) setRefreshing(true);
        try {
            const startDate = getStartDate();

            // 1. Fetch Sessions
            let sessionQuery = supabase
                .from('visitor_sessions')
                .select('*')
                .order('started_at', { ascending: false });

            if (startDate) {
                sessionQuery = sessionQuery.gte('started_at', startDate);
            }

            // 2. Fetch Events
            let eventQuery = supabase
                .from('web_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(300);

            if (startDate) {
                eventQuery = eventQuery.gte('created_at', startDate);
            }

            const [sessionRes, eventRes] = await Promise.all([sessionQuery, eventQuery]);

            if (sessionRes.data) setSessions(sessionRes.data);
            if (eventRes.data) setEvents(eventRes.data);
        } catch (error) {
            console.error('Error loading web log analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getStartDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh interval (every 20s)
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            fetchData(true);
        }, 20000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    // Realtime subscription for incoming events
    useEffect(() => {
        const channel = supabase
            .channel('realtime_web_logs')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'web_events' },
                (payload) => {
                    setEvents((prev) => [payload.new, ...prev.slice(0, 299)]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Aggregations & Metrics Calculation
    const metrics = useMemo(() => {
        const uniqueVisitors = new Set(sessions.map((s) => s.visitor_id)).size;
        const totalSessions = sessions.length;
        const totalPageViews = events.filter((e) => e.event_type === 'page_view').length;

        // Funnel Step Counts from Sessions
        const viewedProductSessions = sessions.filter((s) => s.has_viewed_product).length;
        const addedToCartSessions = sessions.filter((s) => s.has_added_to_cart).length;
        const initiatedCheckoutSessions = sessions.filter((s) => s.has_initiated_checkout).length;
        const purchasedSessions = sessions.filter((s) => s.has_purchased).length;

        const totalRevenue = sessions
            .filter((s) => s.has_purchased)
            .reduce((sum, s) => sum + (Number(s.total_purchased_amount) || 0), 0);

        // Conversion Rates
        const addToCartRate = totalSessions > 0 ? ((addedToCartSessions / totalSessions) * 100).toFixed(1) : 0;
        const checkoutRate = totalSessions > 0 ? ((initiatedCheckoutSessions / totalSessions) * 100).toFixed(1) : 0;
        const overallConversionRate = totalSessions > 0 ? ((purchasedSessions / totalSessions) * 100).toFixed(1) : 0;

        // Funnel Steps for visual bar
        const funnel = [
            {
                step: '1. Visitors',
                count: totalSessions,
                pct: '100%',
                dropOff: totalSessions > 0 ? `${(100 - (viewedProductSessions / totalSessions) * 100).toFixed(1)}% drop` : '0%',
                color: 'bg-blue-500'
            },
            {
                step: '2. Viewed Product',
                count: viewedProductSessions,
                pct: totalSessions > 0 ? `${((viewedProductSessions / totalSessions) * 100).toFixed(1)}%` : '0%',
                dropOff: viewedProductSessions > 0 ? `${(100 - (addedToCartSessions / viewedProductSessions) * 100).toFixed(1)}% drop` : '0%',
                color: 'bg-purple-500'
            },
            {
                step: '3. Added to Cart',
                count: addedToCartSessions,
                pct: totalSessions > 0 ? `${((addedToCartSessions / totalSessions) * 100).toFixed(1)}%` : '0%',
                dropOff: addedToCartSessions > 0 ? `${(100 - (initiatedCheckoutSessions / addedToCartSessions) * 100).toFixed(1)}% drop` : '0%',
                color: 'bg-amber-500'
            },
            {
                step: '4. Initiated Checkout',
                count: initiatedCheckoutSessions,
                pct: totalSessions > 0 ? `${((initiatedCheckoutSessions / totalSessions) * 100).toFixed(1)}%` : '0%',
                dropOff: initiatedCheckoutSessions > 0 ? `${(100 - (purchasedSessions / initiatedCheckoutSessions) * 100).toFixed(1)}% drop` : '0%',
                color: 'bg-indigo-500'
            },
            {
                step: '5. Purchased',
                count: purchasedSessions,
                pct: totalSessions > 0 ? `${((purchasedSessions / totalSessions) * 100).toFixed(1)}%` : '0%',
                dropOff: 'Winner',
                color: 'bg-emerald-500'
            }
        ];

        return {
            uniqueVisitors,
            totalSessions,
            totalPageViews,
            viewedProductSessions,
            addedToCartSessions,
            initiatedCheckoutSessions,
            purchasedSessions,
            totalRevenue,
            addToCartRate,
            checkoutRate,
            overallConversionRate,
            funnel
        };
    }, [sessions, events]);

    // Timeline Chart Data
    const timelineData = useMemo(() => {
        if (sessions.length === 0) return [];

        const dateMap = {};

        sessions.forEach((s) => {
            const dateStr = new Date(s.started_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            if (!dateMap[dateStr]) {
                dateMap[dateStr] = { name: dateStr, visitors: 0, cartAdds: 0, purchases: 0 };
            }
            dateMap[dateStr].visitors += 1;
            if (s.has_added_to_cart) dateMap[dateStr].cartAdds += 1;
            if (s.has_purchased) dateMap[dateStr].purchases += 1;
        });

        return Object.values(dateMap);
    }, [sessions]);

    // Device breakdown
    const deviceStats = useMemo(() => {
        const counts = { mobile: 0, desktop: 0, tablet: 0 };
        sessions.forEach((s) => {
            const type = s.device_type || 'desktop';
            if (counts[type] !== undefined) counts[type] += 1;
            else counts.desktop += 1;
        });
        const total = sessions.length || 1;
        return [
            { name: 'Mobile', count: counts.mobile, pct: Math.round((counts.mobile / total) * 100), icon: Smartphone },
            { name: 'Desktop', count: counts.desktop, pct: Math.round((counts.desktop / total) * 100), icon: Monitor },
            { name: 'Tablet', count: counts.tablet, pct: Math.round((counts.tablet / total) * 100), icon: Tablet }
        ];
    }, [sessions]);

    // Top added-to-cart products
    const topCartProducts = useMemo(() => {
        const productMap = {};
        events.forEach((e) => {
            if (e.event_type === 'add_to_cart' && e.metadata) {
                const name = e.metadata.product_name || 'Product';
                const price = Number(e.metadata.price) || 0;
                const qty = Number(e.metadata.quantity) || 1;
                if (!productMap[name]) {
                    productMap[name] = { name, count: 0, totalValue: 0, price };
                }
                productMap[name].count += qty;
                productMap[name].totalValue += price * qty;
            }
        });
        return Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [events]);

    // Top visited pages
    const topPages = useMemo(() => {
        const pageMap = {};
        events.forEach((e) => {
            if (e.event_type === 'page_view') {
                const path = e.path || '/';
                pageMap[path] = (pageMap[path] || 0) + 1;
            }
        });
        return Object.entries(pageMap)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [events]);

    // Filtered Events Feed
    const filteredEvents = useMemo(() => {
        return events.filter((e) => {
            if (eventFilter !== 'all' && e.event_type !== eventFilter) return false;
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const pathMatch = e.path?.toLowerCase().includes(query);
                const visitorMatch = e.visitor_id?.toLowerCase().includes(query);
                const productMatch = e.metadata?.product_name?.toLowerCase().includes(query);
                const nameMatch = e.metadata?.customer_name?.toLowerCase().includes(query);
                const phoneMatch = e.metadata?.customer_phone?.toLowerCase().includes(query);
                return pathMatch || visitorMatch || productMatch || nameMatch || phoneMatch;
            }
            return true;
        });
    }, [events, eventFilter, searchQuery]);

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);

        if (diffSeconds < 60) return `${diffSeconds}s ago`;
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-8 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-main font-outfit">Web Logs & Funnel Analytics</h1>
                            <p className="text-xs font-bold text-text-muted font-outfit uppercase tracking-wider">
                                Real-time visitor logs, cart activity, and e-commerce conversions
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Time Range Selector */}
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-border/60">
                        {TIME_RANGES.map((range) => (
                            <button
                                key={range.value}
                                onClick={() => setTimeRange(range.value)}
                                className={`px-3 py-1.5 text-xs font-bold font-outfit rounded-lg transition-all ${
                                    timeRange === range.value
                                        ? 'bg-white text-primary shadow-xs'
                                        : 'text-text-muted hover:text-text-main'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    {/* Auto-Refresh Toggle */}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold font-outfit rounded-xl border transition-all ${
                            autoRefresh
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-50 text-text-muted border-border'
                        }`}
                        title="Toggle 20-second live auto-refresh"
                    >
                        <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                        Live Stream
                    </button>

                    {/* Manual Refresh */}
                    <button
                        onClick={() => fetchData()}
                        disabled={refreshing}
                        className="p-2 text-text-muted hover:text-primary hover:bg-gray-100 rounded-xl border border-border transition-all"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin text-primary' : ''} />
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    title="Unique Visitors"
                    value={metrics.uniqueVisitors}
                    subtext={`${metrics.totalSessions} Sessions`}
                    icon={Users}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Page Views"
                    value={metrics.totalPageViews}
                    subtext={`${metrics.totalSessions > 0 ? (metrics.totalPageViews / metrics.totalSessions).toFixed(1) : 0} views / session`}
                    icon={Eye}
                    color="bg-indigo-50 text-indigo-600"
                />
                <StatCard
                    title="Add to Carts"
                    value={metrics.addedToCartSessions}
                    subtext={`${metrics.addToCartRate}% of visitors`}
                    icon={ShoppingCart}
                    color="bg-amber-50 text-amber-600"
                    trend={`${metrics.addToCartRate}% rate`}
                />
                <StatCard
                    title="Checkouts Started"
                    value={metrics.initiatedCheckoutSessions}
                    subtext={`${metrics.checkoutRate}% of visitors`}
                    icon={CreditCard}
                    color="bg-purple-50 text-purple-600"
                />
                <StatCard
                    title="Purchases"
                    value={metrics.purchasedSessions}
                    subtext={`${metrics.overallConversionRate}% conversion`}
                    icon={ShoppingBag}
                    color="bg-emerald-50 text-emerald-600"
                    trend={`${metrics.overallConversionRate}% CVR`}
                />
                <StatCard
                    title="Tracked Revenue"
                    value={`৳${metrics.totalRevenue.toLocaleString()}`}
                    subtext="From tracked sessions"
                    icon={TrendingUp}
                    color="bg-rose-50 text-rose-600"
                />
            </div>

            {/* Conversion Funnel Section */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                        <h3 className="text-lg font-black text-text-main font-outfit">E-Commerce Conversion Funnel</h3>
                        <p className="text-xs text-text-muted font-outfit">
                            Step-by-step visitor journey from landing on site to completed purchase
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold font-outfit border border-emerald-200">
                        <CheckCircle2 size={16} />
                        Overall Conversion: {metrics.overallConversionRate}%
                    </div>
                </div>

                {/* Visual Funnel Step Bars */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {metrics.funnel.map((step, idx) => (
                        <div key={idx} className="relative bg-gray-50/80 p-4 rounded-xl border border-border/80 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between text-xs font-bold font-outfit text-text-muted mb-1 uppercase tracking-wider">
                                    <span>{step.step}</span>
                                    <span className="text-text-main font-black">{step.pct}</span>
                                </div>
                                <div className="text-2xl font-black text-text-main font-outfit my-2">
                                    {step.count.toLocaleString()}
                                </div>
                                {/* Bar */}
                                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${step.color} transition-all duration-500`}
                                        style={{ width: step.pct }}
                                    />
                                </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-border/50 text-[11px] font-bold font-outfit flex items-center justify-between">
                                <span className="text-text-muted">Drop-off:</span>
                                <span className={step.dropOff === 'Winner' ? 'text-emerald-600' : 'text-amber-600'}>
                                    {step.dropOff}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts & Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic & Funnel Timeline Area Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-black text-text-main font-outfit">Visitor & Purchase Trends</h3>
                            <p className="text-xs text-text-muted font-outfit">Daily trend of visits, cart additions, and sales</p>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        {timelineData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCart" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            fontFamily: 'Outfit, sans-serif',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
                                    <Area type="monotone" dataKey="cartAdds" name="Add to Cart" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCart)" />
                                    <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPurchases)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-text-muted text-xs font-outfit">
                                No visitor data recorded in this period yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-black text-text-main font-outfit mb-1">Device Distribution</h3>
                        <p className="text-xs text-text-muted font-outfit mb-6">Visitor hardware & screen breakdown</p>

                        <div className="space-y-4">
                            {deviceStats.map((d, i) => {
                                const Icon = d.icon;
                                return (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-bold font-outfit">
                                            <div className="flex items-center gap-2 text-text-main">
                                                <Icon size={16} className="text-text-muted" />
                                                <span>{d.name}</span>
                                            </div>
                                            <span className="text-text-muted">
                                                {d.count} ({d.pct}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                style={{ width: `${d.pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider font-outfit mb-2">
                            Top Landing Pages
                        </h4>
                        <div className="space-y-2 text-xs font-outfit">
                            {topPages.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                                    <span className="text-text-main truncate max-w-[180px] font-mono">{p.path}</span>
                                    <span className="font-bold text-primary">{p.count} views</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products Added To Cart */}
            {topCartProducts.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-border shadow-xs">
                    <h3 className="text-base font-black text-text-main font-outfit mb-1">Most Added-to-Cart Products</h3>
                    <p className="text-xs text-text-muted font-outfit mb-4">High intent items customers are actively considering</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        {topCartProducts.map((prod, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-border/70 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                        #{idx + 1} High Demand
                                    </span>
                                    <h4 className="text-sm font-bold text-text-main font-outfit mt-2 line-clamp-2">{prod.name}</h4>
                                </div>
                                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs font-outfit">
                                    <span className="text-text-muted">{prod.count} added</span>
                                    <span className="font-black text-emerald-600">৳{prod.totalValue.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Real-Time Web Event Logs Table */}
            <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
                {/* Table Controls */}
                <div className="p-6 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-text-main font-outfit">Live Activity & Event Stream</h3>
                            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-black rounded-full font-outfit">
                                {filteredEvents.length} Events
                            </span>
                        </div>
                        <p className="text-xs text-text-muted font-outfit mt-0.5">
                            Chronological web log of every visitor action across the website
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-outfit w-full sm:w-64">
                            <Search size={16} className="text-text-muted shrink-0" />
                            <input
                                type="text"
                                placeholder="Search URL, product, or visitor ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none w-full text-text-main"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-main">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Event Filter */}
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-border overflow-x-auto text-xs font-bold font-outfit">
                            <button
                                onClick={() => setEventFilter('all')}
                                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                                    eventFilter === 'all' ? 'bg-white text-primary shadow-xs' : 'text-text-muted hover:text-text-main'
                                }`}
                            >
                                All
                            </button>
                            {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={() => setEventFilter(key)}
                                    className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                                        eventFilter === key ? 'bg-white text-primary shadow-xs' : 'text-text-muted hover:text-text-main'
                                    }`}
                                >
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-[11px] font-bold text-text-muted uppercase tracking-wider font-outfit border-b border-border">
                                <th className="py-3.5 px-6">Time</th>
                                <th className="py-3.5 px-6">Event Type</th>
                                <th className="py-3.5 px-6">Activity Details</th>
                                <th className="py-3.5 px-6">Page Path</th>
                                <th className="py-3.5 px-6">Device</th>
                                <th className="py-3.5 px-6">Visitor ID</th>
                                <th className="py-3.5 px-6 text-right">Inspect</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-xs font-outfit">
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((evt) => {
                                    const cfg = EVENT_TYPE_CONFIG[evt.event_type] || {
                                        label: evt.event_type,
                                        color: 'bg-gray-100 text-gray-700 border-gray-200',
                                        icon: Activity
                                    };
                                    const Icon = cfg.icon;

                                    // Extract summary detail
                                    let detailText = '-';
                                    if (evt.metadata) {
                                        if (evt.metadata.product_name) {
                                            detailText = `${evt.metadata.product_name} ${
                                                evt.metadata.price ? `(৳${evt.metadata.price})` : ''
                                            }`;
                                        } else if (evt.metadata.order_id) {
                                            detailText = `Order: ${evt.metadata.order_id} (৳${evt.metadata.total_amount || 0})`;
                                        } else if (evt.metadata.cart_count) {
                                            detailText = `${evt.metadata.cart_count} items in checkout (৳${evt.metadata.total_value || 0})`;
                                        } else if (evt.metadata.search_query) {
                                            detailText = `Search: "${evt.metadata.search_query}"`;
                                        }
                                    }

                                    return (
                                        <tr key={evt.id} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="py-3.5 px-6 whitespace-nowrap text-text-muted">
                                                <div className="font-bold text-text-main">{formatTimeAgo(evt.created_at)}</div>
                                                <div className="text-[10px] text-text-muted font-mono">
                                                    {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                                                    <Icon size={13} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 font-bold text-text-main max-w-xs truncate">
                                                {detailText}
                                            </td>
                                            <td className="py-3.5 px-6 text-text-muted font-mono max-w-xs truncate">
                                                {evt.path}
                                            </td>
                                            <td className="py-3.5 px-6 whitespace-nowrap">
                                                <span className="capitalize px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-bold text-[11px]">
                                                    {evt.device_type || 'Desktop'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 font-mono text-[11px] text-text-muted truncate max-w-[120px]" title={evt.visitor_id}>
                                                {evt.visitor_id ? evt.visitor_id.slice(0, 8) + '...' : 'Unknown'}
                                            </td>
                                            <td className="py-3.5 px-6 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedEventModal(evt)}
                                                    className="px-2.5 py-1 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    View JSON
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-text-muted">
                                        <Activity size={32} className="mx-auto mb-2 text-text-muted/50" />
                                        <p className="font-bold text-sm">No web events matching the filter found.</p>
                                        <p className="text-xs mt-1">Events will appear here automatically as visitors navigate your site.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Event JSON Modal */}
            {selectedEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Activity size={20} className="text-primary" />
                                <h3 className="font-black text-text-main font-outfit">Event Metadata Inspector</h3>
                            </div>
                            <button
                                onClick={() => setSelectedEventModal(null)}
                                className="p-1 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text-main"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="my-4 space-y-3 font-outfit text-xs">
                            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <span className="text-text-muted block">Event Type:</span>
                                    <span className="font-bold text-text-main capitalize">{selectedEventModal.event_type}</span>
                                </div>
                                <div>
                                    <span className="text-text-muted block">Timestamp:</span>
                                    <span className="font-bold text-text-main">{new Date(selectedEventModal.created_at).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-text-muted block">Session ID:</span>
                                    <span className="font-mono text-text-main text-[11px] truncate">{selectedEventModal.session_id}</span>
                                </div>
                                <div>
                                    <span className="text-text-muted block">Visitor ID:</span>
                                    <span className="font-mono text-text-main text-[11px] truncate">{selectedEventModal.visitor_id}</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-text-muted uppercase text-[10px] tracking-wider mb-1.5">Raw JSON Metadata</h4>
                                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-60">
                                    {JSON.stringify(selectedEventModal.metadata, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setSelectedEventModal(null)}
                                className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs font-outfit hover:opacity-90 transition-opacity"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebLogs;
