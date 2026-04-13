import React, { useEffect, useState } from 'react';
import { getStudentDashboard } from '../services/api';
import { Link } from 'react-router-dom';
import BookCover from '../components/BookCover';

export default function MyBooksPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStudentDashboard().then(res => {
            if(res && res.success) setBooks(res.borrows || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if(loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
            <span>Loading your library...</span>
        </div>
    );

    const overdues = books.filter(b => b.daysLeft < 0).length;
    const active = books.length;
    const dueSoon = books.filter(b => b.daysLeft >= 0 && b.daysLeft <= 3).length;

    const getStatusInfo = (daysLeft) => {
        if (daysLeft < 0) return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', fill: '#ef4444', text: `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}`, icon: 'fa-circle-exclamation' };
        if (daysLeft <= 3) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', fill: '#f59e0b', text: `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`, icon: 'fa-clock' };
        return { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', fill: '#10b981', text: `${daysLeft} days remaining`, icon: 'fa-circle-check' };
    };

    return (
        <div className="view active">
            {/* Page Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
                    <i className="fa-solid fa-book-open-reader" style={{ color: 'var(--primary)', marginRight: '10px' }}></i>
                    My Books
                </h1>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Track your borrowed books and upcoming due dates.</p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '140px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <i className="fa-solid fa-book-open-reader" style={{ fontSize: '24px', color: '#3b82f6' }}></i>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#3b82f6' }}>{active}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Active Loans</div>
                    </div>
                </div>
                {dueSoon > 0 && (
                    <div style={{ flex: 1, minWidth: '140px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <i className="fa-solid fa-clock" style={{ fontSize: '24px', color: '#f59e0b' }}></i>
                        <div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#f59e0b' }}>{dueSoon}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Due Soon</div>
                        </div>
                    </div>
                )}
                {overdues > 0 && (
                    <div style={{ flex: 1, minWidth: '140px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '24px', color: '#ef4444' }}></i>
                        <div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444' }}>{overdues}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Overdue</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Books Grid */}
            {books.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                    <i className="fa-solid fa-box-open" style={{ fontSize: '48px', marginBottom: '16px', display: 'block', opacity: 0.4 }}></i>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-main)' }}>Your library shelf is empty</h3>
                    <p style={{ margin: '0 0 20px 0' }}>When you borrow books, they'll appear here.</p>
                    <Link to="/wishlist" className="btn btn-primary" style={{ marginTop: '4px', display: 'inline-block', textDecoration: 'none' }}>Browse Collection</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {books.map(book => {
                        const { color, bg, border, fill, text, icon } = getStatusInfo(book.daysLeft);
                        const progressPct = Math.min(100, Math.max(5, ((14 - book.daysLeft) / 14) * 100));

                        return (
                            <div key={book.id} style={{
                                background: 'var(--bg-card)',
                                border: `1px solid ${border}`,
                                borderRadius: '14px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                boxShadow: `0 2px 12px ${bg}`,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {/* Book Cover + Info */}
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <BookCover
                                        title={book.title}
                                        coverClass={book.coverClass}
                                        style={{ width: '72px', height: '108px', borderRadius: '8px', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                    />
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)', lineHeight: 1.3 }}>{book.title}</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>{book.author}</p>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: bg, color: color, border: `1px solid ${border}`, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                                            <i className={`fa-solid ${icon}`}></i>
                                            Due: {new Date(book.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                                        <span>Borrowed</span>
                                        <span style={{ color, fontWeight: 600 }}>{text}</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${progressPct}%`, background: fill, borderRadius: '3px', transition: 'width 0.8s ease' }}></div>
                                    </div>
                                </div>

                                {/* Pay Fine Button */}
                                {book.daysLeft < 0 && (
                                    <Link to="/fines" style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '9px', background: 'rgba(239,68,68,0.08)',
                                        color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)',
                                        borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                    >
                                        <i className="fa-solid fa-money-bill-wave"></i> Pay Fine
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
