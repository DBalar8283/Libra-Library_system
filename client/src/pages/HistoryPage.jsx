import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHistory } from '../services/api';

export default function HistoryPage() {
    const { isLibrarian } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHistory().then(res => {
            if(res && res.success) setHistory(res.history || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if(loading) return <div>Loading history...</div>;

    return (
        <div className="view active">
            <div className="page-header">
                <h1>{isLibrarian ? "Transaction Log" : "Reading History"}</h1>
                <p>{isLibrarian ? "All book issuances and returns across the portal." : "A complete record of books you've journeyed through."}</p>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Book Title</th>
                            {isLibrarian && <th>Student</th>}
                            <th>Borrow Date</th>
                            <th>Return Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr><td colSpan={isLibrarian ? "5" : "4"}>No history found.</td></tr>
                        ) : (
                            history.map(item => (
                                <tr key={item.txId}>
                                    <td>{item.bookTitle}</td>
                                    {isLibrarian && <td>{item.studentName}</td>}
                                    <td>{new Date(item.borrowDate).toLocaleDateString()}</td>
                                    <td>{item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '-'}</td>
                                    <td>
                                        {item.returned ? (
                                            <span className="status-badge" style={{background:'rgba(16,185,129,0.15)', color:'#10b981', padding:'4px 8px', borderRadius:'12px', fontSize:'12px'}}>Returned</span>
                                        ) : (
                                            <span className="status-badge" style={{background:'rgba(59,130,246,0.15)', color:'#3b82f6', padding:'4px 8px', borderRadius:'12px', fontSize:'12px'}}>Active</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
