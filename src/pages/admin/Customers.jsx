
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

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

    if (loading) return <div>Loading customers...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="admin-customers">
            <h1>Customers</h1>
            <p>Manage registered users and their roles.</p>

            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflowX: 'auto', marginTop: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Full Name</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Joined Date</th>
                            <th style={{ padding: '1rem' }}>User ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => (
                            <tr key={customer.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>{customer.full_name || 'N/A'}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '999px',
                                        fontSize: '0.8rem',
                                        background: customer.role === 'admin' ? '#e8f0fe' : '#f1f3f4',
                                        color: customer.role === 'admin' ? '#1967d2' : '#5f6368'
                                    }}>
                                        {customer.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {new Date(customer.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', fontFamily: 'monospace' }}>
                                    {customer.id.slice(0, 8)}...
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminCustomers;
