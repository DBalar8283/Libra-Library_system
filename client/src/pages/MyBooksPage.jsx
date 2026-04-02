import React, { useEffect, useState } from 'react';
import { getStudentDashboard } from '../services/api';
import { Link } from 'react-router-dom';

export default function MyBooksPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStudentDashboard().then(res => {
            if(res && res.success) {
                setBooks(res.borrows || []);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if(loading) return <div className="books-loading">Loading your library...</div>;

    const overdues = books.filter(b => b.daysLeft < 0).length;
    const active = books.length;

    return (
        <div className="view active">
            <div className="page-header">
                <h1>My Books</h1>
                <p>Track your borrowed books and upcoming due dates.</p>
            </div>

            <div className="books-summary-bar">
                <div className="summary-chip chip-blue">
                    <i className="fa-solid fa-book-open-reader"></i>
                    <span>{active} Active {active === 1 ? 'Borrow' : 'Borrows'}</span>
                </div>
                {overdues > 0 && (
                    <div className="summary-chip chip-red">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span>{overdues} Overdue {overdues === 1 ? 'Book' : 'Books'}</span>
                    </div>
                )}
            </div>

            <div className="books-grid">
                {books.length === 0 ? (
                    <div className="empty-books">
                        <i className="fa-solid fa-box-open"></i>
                        <h3>Your library shelf is empty</h3>
                        <p>When you borrow books, they'll appear here.</p>
                        <Link to="/wishlist" className="btn btn-primary" style={{marginTop:'16px', display:'inline-block', textDecoration:'none'}}>Browse Collection</Link>
                    </div>
                ) : (
                    books.map(book => {
                        const isOverdue = book.daysLeft < 0;
                        const isWarning = book.daysLeft >= 0 && book.daysLeft <= 3;
                        const progressPct = Math.min(100, Math.max(0, ((14 - book.daysLeft) / 14) * 100)); // Approx typical 14 day loan
                        let fillClass = '';
                        let badgeClass = 'success';
                        let statusText = `${book.daysLeft} days remaining`;
                        
                        if(isOverdue) {
                            fillClass = 'danger-fill';
                            badgeClass = 'danger';
                            statusText = `Overdue by ${Math.abs(book.daysLeft)} days`;
                        } else if(isWarning) {
                            fillClass = 'warning-fill';
                            badgeClass = 'warning';
                        }

                        return (
                            <div key={book.id} className="book-card-vertical" style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'20px', display:'flex', flexDirection:'column'}}>
                                <div className="book-top" style={{display:'flex', gap:'16px'}}>
                                    <div className={`book-cover-wrap ${book.coverClass || 'placeholder-cover-1'}`} style={{width:'80px', height:'120px', borderRadius:'8px', flexShrink:0}}></div>
                                    <div className="book-info">
                                        <h3 style={{fontSize:'16px', marginBottom:'4px'}}>{book.title}</h3>
                                        <p style={{fontSize:'13px', color:'var(--text-muted)'}}>{book.author}</p>
                                        <div className={`due-badge ${badgeClass}`} style={{marginTop:'8px', display:'inline-block', padding:'4px 8px', borderRadius:'12px', fontSize:'11px', fontWeight:600}}>
                                            <i className="fa-solid fa-calendar-alt"></i> Due: {new Date(book.dueDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="timeline-wrap" style={{marginTop:'16px'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--text-muted)', marginBottom:'4px'}}>
                                        <span>Borrowed</span>
                                        <span>{statusText}</span>
                                    </div>
                                    <div className="progress-track" style={{height:'6px', background:'rgba(0,0,0,0.05)', borderRadius:'3px'}}>
                                        <div className={`progress-fill ${fillClass}`} style={{width:`${progressPct}%`, height:'100%', background:'var(--primary)', borderRadius:'3px'}}></div>
                                    </div>
                                </div>
                                {isOverdue && (
                                    <Link to="/fines" className="btn-fine-link" style={{marginTop:'12px', padding:'8px', background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', textAlign:'center', display:'block', textDecoration:'none', fontSize:'13px', fontWeight:600}}>
                                        <i className="fa-solid fa-money-bill"></i> Pay Fine
                                    </Link>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
