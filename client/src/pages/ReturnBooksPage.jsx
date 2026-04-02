import React, { useEffect, useState } from 'react';
import { getActiveLoans, returnBook } from '../services/api';

export default function ReturnBooksPage() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const loadLoans = () => {
        getActiveLoans().then(res => { 
            if(res && res.success) setLoans(res.borrows || []); 
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { loadLoans(); }, []);

    const handleReturn = async (txId, bookTitle) => {
        if(window.confirm(`Process return for "${bookTitle}"?`)) {
            const res = await returnBook(txId);
            if(res.success) loadLoans();
            else alert(res.message);
        }
    };

    return (
        <div className="view active">
            <div className="admin-banner" style={{background: 'linear-gradient(135deg, #0f766e, #14b8a6)', padding: '24px', borderRadius: '12px', color: '#fff', marginBottom: '32px'}}>
                <h1 style={{fontSize: '28px', margin: '0 0 8px 0'}}>Process Returns</h1>
                <p style={{margin: 0, opacity: 0.9}}>Clear active loans and update book availability</p>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead><tr><th>Book</th><th>Student</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>Loading Active Loans...</td></tr> : loans.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No active loans found. Everything is returned!</td></tr>
                        ) : loans.map(l => {
                            const isOverdue = l.overdue;
                            const borrowDate = new Date(l.borrowDate).toLocaleDateString();
                            return (
                                <tr key={l.txId}>
                                    <td style={{fontWeight: 600}}>{l.bookTitle}</td>
                                    <td>
                                        <div style={{display:'flex', flexDirection:'column'}}>
                                            <span style={{fontWeight:600}}>{l.studentName}</span>
                                            <span style={{fontSize:'12px', color:'var(--text-muted)'}}>{l.studentEmail}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                                            <span style={{
                                                display: 'inline-block', width: 'max-content',
                                                padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                                                background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                                color: isOverdue ? '#ef4444' : '#10b981'
                                            }}>
                                                {isOverdue ? 'Overdue' : 'Active'}
                                            </span>
                                            <span style={{fontSize:'11px', color:'var(--text-muted)'}}>Borrowed: {borrowDate}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <button onClick={() => handleReturn(l.txId, l.bookTitle)} style={{
                                            background: '#14b8a6', color: '#fff', border: 'none', 
                                            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                                            transition: 'background 0.2s'
                                        }} onMouseEnter={(e) => e.currentTarget.style.background = '#0d9488'}
                                           onMouseLeave={(e) => e.currentTarget.style.background = '#14b8a6'}>
                                            <i className="fa-solid fa-rotate-left"></i> Return
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
