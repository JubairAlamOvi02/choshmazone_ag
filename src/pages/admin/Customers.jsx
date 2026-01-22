import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Users, Search, Mail, Shield, ShieldCheck, Filter, MoreHorizontal, Trash2 } from 'lucide-react';

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomers(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) return (
        <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-outfit text-center">
            {error}
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-outfit uppercase tracking-tight">Customer Directory</h1>
                    <p className="text-text-muted font-outfit">Manage registered users and their system access levels.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl">
                        <Search size={18} className="text-text-muted" />
                        <input
                            type="text"
                            placeholder="Find member..."
                            className="bg-transparent border-none outline-none text-sm font-outfit w-40"
                        />
                    </div>
                    <button className="p-3 bg-white border border-border rounded-xl text-text-muted hover:text-text-main transition-colors">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-border/50">
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Full Name</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Identity</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Joined Date</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit">Access Level</th>
                                <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-[0.2em] font-outfit text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {customers.map(customer => (
                                <tr key={customer.id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold font-outfit text-sm">
                                                {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <span className="text-sm font-bold text-text-main font-outfit">{customer.full_name || 'Anonymous User'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono text-text-muted uppercase">#{customer.id.slice(0, 12)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm text-text-main font-outfit">
                                            {new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={customer.role}
                                                onChange={async (e) => {
                                                    const newRole = e.target.value;
                                                    try {
                                                        const { error } = await supabase
                                                            .from('profiles')
                                                            .update({ role: newRole })
                                                            .eq('id', customer.id);

                                                        if (error) throw error;

                                                        // Update local state
                                                        setCustomers(customers.map(c =>
                                                            c.id === customer.id ? { ...c, role: newRole } : c
                                                        ));
                                                    } catch (err) {
                                                        alert('Failed to update user role. You may need higher database permissions.');
                                                    }
                                                }}
                                                className={`
                                                    text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border-none outline-none cursor-pointer
                                                    ${customer.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}
                                                `}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="admin">Administrator</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm(`Are you sure you want to delete ${customer.full_name || 'this user'}? This will remove their profile data.`)) return;

                                                    try {
                                                        const { error } = await supabase
                                                            .from('profiles')
                                                            .delete()
                                                            .eq('id', customer.id);

                                                        if (error) throw error;

                                                        setCustomers(customers.filter(c => c.id !== customer.id));
                                                    } catch (err) {
                                                        alert('Failed to delete user: ' + err.message);
                                                    }
                                                }}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-text-main hover:bg-gray-100 rounded-lg transition-all">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCustomers;
