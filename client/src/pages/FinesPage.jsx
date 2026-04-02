import React, { useEffect, useState } from 'react';
import { getFines, payOnline } from '../services/api';

export default function FinesPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        setLoading(true);
        getFines().then(res => {
            if(res && res.success) {
                setData({
                    totalFines: res.pendingFines || 0,
                    fineDetails: (res.fineItems || []).map((f, i) => ({
                        _id: 'fine-' + i,
                        title: f.bookTitle,
                        dueDate: f.dueDate,
                        daysOverdue: f.daysOverdue,
                        fine: f.amount
                    }))
                });
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const handlePay = async () => {
        if (!data || data.totalFines <= 0) return;
        if (window.confirm(`Are you sure you want to pay ₹${data.totalFines.toFixed(2)}?`)) {
            try {
                const res = await payOnline(data.totalFines, 'online_card');
                if(res.success) {
                    alert("Payment successful!");
                    loadData();
                } else alert(res.message);
            } catch(e) { alert("Payment failed."); }
        }
    };

    if(loading) return <div>Loading fine details...</div>;
    if(!data) return <div>Error loading fines.</div>;

    return (
        <div className="view active">
            <div className="page-header">
                <h1>Fines & Payments</h1>
                <p>Manage your overdue fees.</p>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginBottom:'24px'}}>
                <div style={{background:'var(--bg-card)', padding:'24px', borderRadius:'12px', border:'1px solid var(--border)'}}>
                    <h3>Total Outstanding Balance</h3>
                    <h2 style={{fontSize:'36px', color:'var(--danger)', marginTop:'8px'}}>₹{data.totalFines.toFixed(2)}</h2>
                    {data.totalFines > 0 && (
                        <button onClick={handlePay} className="btn btn-primary mt-3">Pay Full Amount</button>
                    )}
                </div>
            </div>

            <div className="admin-table-container">
                <h3>Overdue Books</h3>
                <table className="admin-table mt-3">
                    <thead>
                        <tr>
                            <th>Book Title</th>
                            <th>Due Date</th>
                            <th>Days Overdue</th>
                            <th>Fine Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.fineDetails.length === 0 ? (
                            <tr><td colSpan="4">No active fines.</td></tr>
                        ) : (
                            data.fineDetails.map(item => (
                                <tr key={item._id}>
                                    <td>{item.title}</td>
                                    <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                                    <td>{item.daysOverdue} days</td>
                                    <td style={{color:'red'}}>₹{item.fine.toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
