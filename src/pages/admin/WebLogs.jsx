import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Activity, Users, Eye, ShoppingCart, CreditCard, ShoppingBag,
    TrendingUp, RefreshCw, Smartphone, Monitor, Tablet, Search,
    Filter, ArrowDown, ExternalLink, Clock, ShieldCheck, ChevronRight,
    AlertCircle, Sparkles, X, CheckCircle2, ChevronDown, Radio, Globe, Package,
    ChevronLeft, Download, Shield, MapPin, Wifi, Map
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar
} from 'recharts';
import VisitorGeoMap from '../../components/admin/VisitorGeoMap';

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
    const [isMounted, setIsMounted] = useState(false);
    const [liveViewers, setLiveViewers] = useState([]);
    const [liveExpanded, setLiveExpanded] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [excludeAdmin, setExcludeAdmin] = useState(true);
    const [showMap, setShowMap] = useState(true);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    // ---------- LIVE VIEWERS ----------
    const LIVE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes = considered "live"

    const fetchLiveViewers = useCallback(async () => {
        try {
            const cutoff = new Date(Date.now() - LIVE_THRESHOLD_MS).toISOString();
            const { data } = await supabase
                .from('visitor_sessions')
                .select('id, visitor_id, last_page, device_type, browser, last_active_at')
                .gte('last_active_at', cutoff)
                .order('last_active_at', { ascending: false });
            if (data) setLiveViewers(data);
        } catch {
            // non-critical
        }
    }, []);

    // Fetch live viewers on mount and every 15s
    useEffect(() => {
        fetchLiveViewers();
        const interval = setInterval(fetchLiveViewers, 15000);
        return () => clearInterval(interval);
    }, [fetchLiveViewers]);

    // Derived live viewer analytics
    const liveStats = useMemo(() => {
        const total = liveViewers.length;
        const uniqueVisitors = new Set(liveViewers.map(v => v.visitor_id)).size;

        // Group by page
        const pageMap = {};
        liveViewers.forEach(v => {
            const page = v.last_page || '/';
            if (!pageMap[page]) pageMap[page] = { path: page, count: 0, viewers: [] };
            pageMap[page].count += 1;
            pageMap[page].viewers.push(v);
        });
        const pages = Object.values(pageMap).sort((a, b) => b.count - a.count);

        // Product viewers (paths like /product/xxx or /products/xxx)
        const productViewers = pages.filter(p => /^\/(product|products)\//i.test(p.path));
        const browsingCount = total - productViewers.reduce((s, p) => s + p.count, 0);

        // Device breakdown
        const devices = { mobile: 0, desktop: 0, tablet: 0 };
        liveViewers.forEach(v => {
            const d = v.device_type || 'desktop';
            if (devices[d] !== undefined) devices[d] += 1;
            else devices.desktop += 1;
        });

        return { total, uniqueVisitors, pages, productViewers, browsingCount, devices };
    }, [liveViewers]);

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
    // Filtered Events Feed
    const filteredEvents = useMemo(() => {
        return events.filter((e) => {
            if (excludeAdmin && e.path && e.path.startsWith('/admin')) return false;
            if (eventFilter !== 'all' && e.event_type !== eventFilter) return false;
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const pathMatch = e.path?.toLowerCase().includes(query);
                const visitorMatch = e.visitor_id?.toLowerCase().includes(query);
                const productMatch = e.metadata?.product_name?.toLowerCase().includes(query);
                const nameMatch = e.metadata?.customer_name?.toLowerCase().includes(query);
                const phoneMatch = e.metadata?.customer_phone?.toLowerCase().includes(query);
                const cityMatch = e.metadata?.geo?.city?.toLowerCase().includes(query);
                const countryMatch = e.metadata?.geo?.country?.toLowerCase().includes(query);
                const ispMatch = e.metadata?.geo?.isp?.toLowerCase().includes(query);
                const ipMatch = e.metadata?.geo?.ip?.toLowerCase().includes(query);
                return pathMatch || visitorMatch || productMatch || nameMatch || phoneMatch || cityMatch || countryMatch || ispMatch || ipMatch;
            }
            return true;
        });
    }, [events, eventFilter, searchQuery, excludeAdmin]);

    // Geo & ISP Intelligence from events
    const geoStats = useMemo(() => {
        const cityMap = {};
        const ispMap = {};
        let totalGeo = 0;

        events.forEach((e) => {
            const geo = e.metadata?.geo;
            if (geo && geo.city && geo.city !== 'Unknown City') {
                totalGeo += 1;
                const cityLabel = geo.city;
                if (!cityMap[cityLabel]) {
                    cityMap[cityLabel] = {
                        name: cityLabel,
                        fullLocation: `${geo.city}, ${geo.countryCode || 'BD'}`,
                        flag: geo.flag || '🇧🇩',
                        count: 0
                    };
                }
                cityMap[cityLabel].count += 1;

                if (geo.isp && geo.isp !== 'Unknown ISP') {
                    const cleanIsp = geo.isp.replace(/Limited|Ltd\.?|Internet/gi, '').trim();
                    if (!ispMap[cleanIsp]) {
                        ispMap[cleanIsp] = { name: cleanIsp, fullName: geo.isp, count: 0 };
                    }
                    ispMap[cleanIsp].count += 1;
                }
            }
        });

        const topCities = Object.values(cityMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((c) => ({
                ...c,
                pct: totalGeo > 0 ? Math.round((c.count / totalGeo) * 100) : 0
            }));

        const topISPs = Object.values(ispMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((i) => ({
                ...i,
                pct: totalGeo > 0 ? Math.round((i.count / totalGeo) * 100) : 0
            }));

        return { topCities, topISPs, totalGeo };
    }, [events]);

    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredEvents.slice(start, start + pageSize);
    }, [filteredEvents, currentPage, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const exportToCSV = () => {
        if (filteredEvents.length === 0) return;
        const headers = ['Timestamp', 'Event Type', 'Path', 'City', 'Country', 'ISP', 'IP', 'Device', 'Visitor ID', 'Metadata'];
        const rows = filteredEvents.map((e) => [
            new Date(e.created_at).toISOString(),
            e.event_type,
            e.path || '',
            e.metadata?.geo?.city || '',
            e.metadata?.geo?.country || '',
            e.metadata?.geo?.isp || '',
            e.metadata?.geo?.ip || '',
            e.device_type || 'Desktop',
            e.visitor_id || '',
            JSON.stringify(e.metadata || {})
        ]);
        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

                    {/* Map View Toggle */}
                    <button
                        onClick={() => setShowMap(!showMap)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold font-outfit rounded-xl border transition-all ${
                            showMap
                                ? 'bg-primary/10 text-primary border-primary/20 shadow-xs'
                                : 'bg-gray-50 text-text-muted border-border hover:bg-gray-100'
                        }`}
                        title="Toggle Regional Visitor Map"
                    >
                        <Map size={14} />
                        {showMap ? 'Hide Map' : 'Map View'}
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

            {/* ============ LIVE NOW PANEL ============ */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-lg overflow-hidden">
                {/* Header */}
                <button
                    onClick={() => setLiveExpanded(!liveExpanded)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-white/[0.02] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                                <Radio size={22} className="text-emerald-400" />
                            </div>
                            {liveStats.total > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                            )}
                            {liveStats.total > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white font-outfit flex items-center gap-2">
                                Live Now
                                <span className="text-2xl font-black text-emerald-400 tabular-nums">
                                    {liveStats.total}
                                </span>
                                <span className="text-xs font-bold text-gray-400 font-outfit">
                                    {liveStats.total === 1 ? 'viewer' : 'viewers'} on site
                                </span>
                            </h3>
                            <p className="text-[11px] text-gray-500 font-outfit mt-0.5">
                                Users active within the last 2 minutes • Auto-refreshes every 15s
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Quick device counts */}
                        <div className="hidden sm:flex items-center gap-3 text-gray-400">
                            <span className="flex items-center gap-1 text-[11px] font-bold font-outfit">
                                <Smartphone size={13} /> {liveStats.devices.mobile}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold font-outfit">
                                <Monitor size={13} /> {liveStats.devices.desktop}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold font-outfit">
                                <Tablet size={13} /> {liveStats.devices.tablet}
                            </span>
                        </div>
                        <ChevronDown
                            size={18}
                            className={`text-gray-500 transition-transform duration-300 ${liveExpanded ? 'rotate-180' : ''}`}
                        />
                    </div>
                </button>

                {/* Collapsible Body */}
                {liveExpanded && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-700/60">
                        {liveStats.total === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="p-4 bg-gray-800 rounded-2xl mb-3">
                                    <Globe size={28} className="text-gray-600" />
                                </div>
                                <p className="text-sm font-bold text-gray-500 font-outfit">No active viewers right now</p>
                                <p className="text-[11px] text-gray-600 font-outfit mt-1">Visitors will appear here as they browse your store</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
                                {/* Left: Summary Stats */}
                                <div className="space-y-3">
                                    <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                                        <h4 className="text-[11px] font-bold text-gray-500 font-outfit uppercase tracking-wider mb-3">Live Summary</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-2xl font-black text-white font-outfit tabular-nums">{liveStats.uniqueVisitors}</p>
                                                <p className="text-[11px] text-gray-500 font-outfit">Unique visitors</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-white font-outfit tabular-nums">{liveStats.total}</p>
                                                <p className="text-[11px] text-gray-500 font-outfit">Active sessions</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-emerald-400 font-outfit tabular-nums">{liveStats.productViewers.length}</p>
                                                <p className="text-[11px] text-gray-500 font-outfit">Viewing products</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-blue-400 font-outfit tabular-nums">{liveStats.browsingCount}</p>
                                                <p className="text-[11px] text-gray-500 font-outfit">Browsing site</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Device breakdown mini */}
                                    <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                                        <h4 className="text-[11px] font-bold text-gray-500 font-outfit uppercase tracking-wider mb-3">Devices</h4>
                                        <div className="space-y-2">
                                            {[
                                                { label: 'Mobile', count: liveStats.devices.mobile, icon: Smartphone, color: 'bg-blue-500' },
                                                { label: 'Desktop', count: liveStats.devices.desktop, icon: Monitor, color: 'bg-purple-500' },
                                                { label: 'Tablet', count: liveStats.devices.tablet, icon: Tablet, color: 'bg-amber-500' }
                                            ].map(d => (
                                                <div key={d.label} className="flex items-center gap-2">
                                                    <d.icon size={14} className="text-gray-500" />
                                                    <span className="text-xs font-bold text-gray-300 font-outfit w-14">{d.label}</span>
                                                    <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${d.color} rounded-full transition-all duration-500`}
                                                            style={{ width: liveStats.total > 0 ? `${(d.count / liveStats.total) * 100}%` : '0%' }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-gray-400 font-outfit w-6 text-right tabular-nums">{d.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Center & Right: Active Pages List */}
                                <div className="lg:col-span-2 bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
                                        <h4 className="text-[11px] font-bold text-gray-500 font-outfit uppercase tracking-wider">Active Pages</h4>
                                        <span className="text-[11px] font-bold text-gray-600 font-outfit">{liveStats.pages.length} pages</span>
                                    </div>
                                    <div className="max-h-[240px] overflow-y-auto scrollbar-thin">
                                        {liveStats.pages.map((page, idx) => {
                                            const isProduct = /^\/(product|products)\//i.test(page.path);
                                            const pathSegments = page.path.split('/').filter(Boolean);
                                            const displayName = isProduct
                                                ? decodeURIComponent(pathSegments[pathSegments.length - 1] || '').replace(/-/g, ' ')
                                                : page.path === '/' ? 'Homepage' : page.path;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors last:border-b-0"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <div className={`p-1.5 rounded-lg ${isProduct ? 'bg-emerald-500/15' : 'bg-blue-500/15'}`}>
                                                            {isProduct ? (
                                                                <Package size={14} className="text-emerald-400" />
                                                            ) : (
                                                                <Globe size={14} className="text-blue-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`text-xs font-bold font-outfit truncate ${
                                                                isProduct ? 'text-emerald-300' : 'text-gray-300'
                                                            }`}>
                                                                {isProduct ? '🔍 ' : ''}{displayName}
                                                            </p>
                                                            <p className="text-[10px] text-gray-600 font-outfit truncate">{page.path}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                        <span className="text-sm font-black text-white font-outfit tabular-nums">
                                                            {page.count}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-outfit">
                                                            {page.count === 1 ? 'viewer' : 'viewers'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
                <div className="lg:col-span-2 min-w-0 bg-white p-6 rounded-2xl border border-border shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-black text-text-main font-outfit">Visitor & Purchase Trends</h3>
                            <p className="text-xs text-text-muted font-outfit">Daily trend of visits, cart additions, and sales</p>
                        </div>
                    </div>

                    <div className="h-64 min-h-[16rem] w-full min-w-0">
                        {isMounted && timelineData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
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
                                {!isMounted ? 'Loading chart...' : 'No visitor data recorded in this period yet.'}
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

            {/* Regional Visitor Map View */}
            {showMap && (
                <VisitorGeoMap
                    events={events}
                    onSelectCity={(city) => {
                        setSearchQuery(city);
                        setCurrentPage(1);
                    }}
                />
            )}

            {/* Geo-Location & ISP Breakdown Card */}
            {geoStats.totalGeo > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-border shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-primary rounded-xl">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-text-main font-outfit">Visitor Geo & ISP Intelligence</h3>
                                <p className="text-xs text-text-muted font-outfit">Real-time geographic locations and internet providers across Bangladesh</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-text-muted bg-gray-50 border border-border px-2.5 py-1 rounded-lg">
                            {geoStats.totalGeo} Geo Records
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Top Cities */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-text-main font-outfit uppercase tracking-wider flex items-center gap-1.5">
                                <Globe size={13} className="text-primary" /> Top Cities & Regions
                            </h4>
                            <div className="space-y-2">
                                {geoStats.topCities.map((city, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs font-outfit">
                                            <button
                                                onClick={() => { setSearchQuery(city.name); setCurrentPage(1); }}
                                                className="font-bold text-text-main hover:text-primary transition-colors flex items-center gap-1.5"
                                            >
                                                <span>{city.flag}</span>
                                                <span>{city.name}</span>
                                            </button>
                                            <span className="text-text-muted font-mono text-[11px]">
                                                {city.count} ({city.pct}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${city.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top ISPs */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-text-main font-outfit uppercase tracking-wider flex items-center gap-1.5">
                                <Wifi size={13} className="text-emerald-500" /> Top Internet Providers (ISP)
                            </h4>
                            <div className="space-y-2">
                                {geoStats.topISPs.map((isp, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs font-outfit">
                                            <button
                                                onClick={() => { setSearchQuery(isp.name); setCurrentPage(1); }}
                                                className="font-bold text-text-main hover:text-primary transition-colors truncate max-w-[200px]"
                                                title={isp.fullName}
                                            >
                                                {isp.name}
                                            </button>
                                            <span className="text-text-muted font-mono text-[11px]">
                                                {isp.count} ({isp.pct}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${isp.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Real-Time Web Event Logs Table */}
            <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
                {/* Compact Table Header Controls */}
                <div className="p-4 sm:px-5 border-b border-border flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-text-main font-outfit">Live Activity & Event Stream</h3>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-black rounded-full font-outfit">
                                {filteredEvents.length} Events
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Exclude Admin Toggle */}
                            <button
                                onClick={() => { setExcludeAdmin(!excludeAdmin); setCurrentPage(1); }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-outfit border transition-colors ${
                                    excludeAdmin
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-gray-50 text-text-muted border-border hover:bg-gray-100'
                                }`}
                                title="Hide internal admin navigation events (/admin)"
                            >
                                <Shield size={13} />
                                {excludeAdmin ? 'Admin Hidden' : 'Admin Included'}
                            </button>

                            {/* Export CSV */}
                            <button
                                onClick={exportToCSV}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-border text-text-muted hover:text-text-main rounded-lg text-xs font-bold font-outfit transition-colors"
                                title="Download logs as CSV"
                            >
                                <Download size={13} />
                                CSV
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Compact Search */}
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-border rounded-xl text-xs font-outfit w-full sm:w-64">
                            <Search size={14} className="text-text-muted shrink-0" />
                            <input
                                type="text"
                                placeholder="Search city, ISP, URL, or visitor..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="bg-transparent border-none outline-none w-full text-text-main placeholder:text-text-muted/70 text-xs"
                            />
                            {searchQuery && (
                                <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="text-text-muted hover:text-text-main">
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Event Filter Pills */}
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-border overflow-x-auto text-xs font-bold font-outfit">
                            <button
                                onClick={() => { setEventFilter('all'); setCurrentPage(1); }}
                                className={`px-2 py-1 rounded-lg transition-all text-xs ${
                                    eventFilter === 'all' ? 'bg-white text-primary shadow-xs' : 'text-text-muted hover:text-text-main'
                                }`}
                            >
                                All
                            </button>
                            {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={() => { setEventFilter(key); setCurrentPage(1); }}
                                    className={`px-2 py-1 rounded-lg whitespace-nowrap transition-all text-xs ${
                                        eventFilter === key ? 'bg-white text-primary shadow-xs' : 'text-text-muted hover:text-text-main'
                                    }`}
                                >
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Compact Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-[11px] font-bold text-text-muted uppercase tracking-wider font-outfit border-b border-border">
                                <th className="py-2.5 px-4">Time</th>
                                <th className="py-2.5 px-4">Event Type</th>
                                <th className="py-2.5 px-4">Activity Details</th>
                                <th className="py-2.5 px-4">Location & ISP</th>
                                <th className="py-2.5 px-4">Page Path</th>
                                <th className="py-2.5 px-4">Device</th>
                                <th className="py-2.5 px-4">Visitor ID</th>
                                <th className="py-2.5 px-4 text-right">Inspect</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-xs font-outfit">
                            {paginatedEvents.length > 0 ? (
                                paginatedEvents.map((evt) => {
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
                                        <tr key={evt.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-2 px-4 whitespace-nowrap text-text-muted">
                                                <div className="font-bold text-text-main text-xs">{formatTimeAgo(evt.created_at)}</div>
                                                <div className="text-[10px] text-text-muted font-mono">
                                                    {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="py-2 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                                                    <Icon size={12} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 font-bold text-text-main max-w-xs truncate text-xs">
                                                {detailText !== '-' ? (
                                                    detailText
                                                ) : (
                                                    <span className="text-text-muted font-normal text-[11px] italic">Visited page</span>
                                                )}
                                            </td>
                                            <td className="py-2 px-4 whitespace-nowrap">
                                                {evt.metadata?.geo?.city ? (
                                                    <div className="flex flex-col">
                                                        <span
                                                            className="font-bold text-text-main text-xs flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
                                                            title={`${evt.metadata.geo.city}, ${evt.metadata.geo.region || ''} ${evt.metadata.geo.country} (Click to filter)`}
                                                            onClick={() => { setSearchQuery(evt.metadata.geo.city); setCurrentPage(1); }}
                                                        >
                                                            <span>{evt.metadata.geo.flag || '🌐'}</span>
                                                            <span>{evt.metadata.geo.city}</span>
                                                            <span className="text-[10px] text-text-muted font-normal uppercase">({evt.metadata.geo.countryCode || 'BD'})</span>
                                                        </span>
                                                        <span
                                                            className="text-[10px] text-text-muted flex items-center gap-1 max-w-[130px] truncate cursor-pointer hover:text-primary transition-colors"
                                                            title={`ISP: ${evt.metadata.geo.isp} | IP: ${evt.metadata.geo.ip} (Click to filter)`}
                                                            onClick={() => { setSearchQuery(evt.metadata.geo.isp); setCurrentPage(1); }}
                                                        >
                                                            <Wifi size={10} className="shrink-0 text-emerald-500" />
                                                            <span className="truncate">{evt.metadata.geo.isp || 'Broadband'}</span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-text-muted text-[11px] flex items-center gap-1">
                                                        <MapPin size={11} className="text-text-muted/60" />
                                                        <span className="italic">Web / Local</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-4 text-text-muted font-mono text-[11px] max-w-xs truncate">
                                                {evt.path}
                                            </td>
                                            <td className="py-2 px-4 whitespace-nowrap">
                                                <span className="capitalize px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded font-bold text-[10px]">
                                                    {evt.device_type || 'Desktop'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 font-mono text-[11px] text-text-muted truncate max-w-[110px]">
                                                {evt.visitor_id ? (
                                                    <button
                                                        onClick={() => { setSearchQuery(evt.visitor_id); setCurrentPage(1); }}
                                                        className="hover:text-primary hover:underline transition-colors"
                                                        title={`Click to filter by visitor: ${evt.visitor_id}`}
                                                    >
                                                        {evt.visitor_id.slice(0, 8)}...
                                                    </button>
                                                ) : 'Unknown'}
                                            </td>
                                            <td className="py-2 px-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedEventModal(evt)}
                                                    className="px-2 py-0.5 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded text-[11px] font-bold transition-colors"
                                                >
                                                    View JSON
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-text-muted">
                                        <Activity size={24} className="mx-auto mb-1.5 text-text-muted/40" />
                                        <p className="font-bold text-xs">No web events matching the filter found.</p>
                                        <p className="text-[11px] mt-0.5">Events will appear here automatically as visitors navigate your site.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Compact Pagination Footer */}
                {filteredEvents.length > 0 && (
                    <div className="p-3 sm:px-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-outfit bg-gray-50/50">
                        <div className="flex items-center gap-3 text-text-muted">
                            <span>
                                Showing <strong className="text-text-main font-bold">{Math.min((currentPage - 1) * pageSize + 1, filteredEvents.length)}</strong>–<strong className="text-text-main font-bold">{Math.min(currentPage * pageSize, filteredEvents.length)}</strong> of <strong className="text-text-main font-bold">{filteredEvents.length}</strong> events
                            </span>

                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px]">Show:</span>
                                {[10, 25, 50].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => { setPageSize(size); setCurrentPage(1); }}
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                                            pageSize === size
                                                ? 'bg-primary text-white'
                                                : 'bg-white border border-border text-text-muted hover:text-text-main'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-text-muted text-[11px] mr-1">
                                Page <strong className="text-text-main">{currentPage}</strong> of <strong className="text-text-main">{totalPages}</strong>
                            </span>

                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-border bg-white text-text-muted hover:text-text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Previous page"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-border bg-white text-text-muted hover:text-text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Next page"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
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

                            {selectedEventModal.metadata?.geo && (
                                <div className="p-3.5 bg-gradient-to-br from-blue-50/90 to-indigo-50/60 rounded-xl border border-blue-100 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-primary font-black text-xs uppercase tracking-wider font-outfit">
                                            <MapPin size={14} />
                                            <span>Geo-Location & Network Intelligence</span>
                                        </div>
                                        <span className="text-base">{selectedEventModal.metadata.geo.flag || '🇧🇩'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-outfit">
                                        <div>
                                            <span className="text-text-muted text-[11px] block">Location:</span>
                                            <span className="font-bold text-text-main">
                                                {selectedEventModal.metadata.geo.city || 'Unknown City'}
                                                {selectedEventModal.metadata.geo.region ? `, ${selectedEventModal.metadata.geo.region}` : ''}
                                                {selectedEventModal.metadata.geo.country ? ` (${selectedEventModal.metadata.geo.country})` : ''}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-text-muted text-[11px] block">Internet Provider (ISP):</span>
                                            <span className="font-bold text-text-main flex items-center gap-1 truncate" title={selectedEventModal.metadata.geo.isp}>
                                                <Wifi size={12} className="text-emerald-500 shrink-0" />
                                                <span className="truncate">{selectedEventModal.metadata.geo.isp || 'Broadband'}</span>
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-text-muted text-[11px] block">Public IP Address:</span>
                                            <span className="font-mono text-text-main text-[11px] font-bold">{selectedEventModal.metadata.geo.ip || 'Hidden'}</span>
                                        </div>
                                        <div>
                                            <span className="text-text-muted text-[11px] block">ASN Network:</span>
                                            <span className="font-mono text-text-muted text-[11px]">{selectedEventModal.metadata.geo.asn ? `AS${selectedEventModal.metadata.geo.asn}` : 'Standard'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

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
