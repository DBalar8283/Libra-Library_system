import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentDashboard, updateReadingGoal, getStats, getActiveLoans, getAllBooks } from '../services/api';
import api from '../services/api';
import { Link } from 'react-router-dom';
import BookCover from '../components/BookCover';

function StudentDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [goalEditMode, setGoalEditMode] = useState(false);
    const [goalInput, setGoalInput] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const loadDashboard = () => {
        Promise.all([
            getStudentDashboard().catch(e => null),
            api.get('/student/reading-goal').then(r => r.data).catch(e => null),
            getAllBooks().catch(e => null)
        ]).then(([dashboardRes, goalRes, catalogRes]) => {
            if (dashboardRes && dashboardRes.success) {
                const activeBorrowsList = dashboardRes.borrows || [];
                const activeBorrows = activeBorrowsList.length;
                const dueSoon = activeBorrowsList.filter(b => b.daysLeft <= 3 && b.daysLeft >= 0).length;
                const readingGoal = goalRes?.success ? goalRes.goal : 12;

                setData({
                    ...dashboardRes,
                    activeBorrowsList,
                    activeBorrows,
                    dueSoon,
                    readingGoal,
                    catalog: catalogRes?.success ? catalogRes.books : []
                });
            }
        });
    };

    useEffect(() => {
        loadDashboard();

        const handleGlobalSearch = (e) => {
            setSearchQuery(e.detail || '');
        };
        window.addEventListener('libra-search', handleGlobalSearch);
        return () => window.removeEventListener('libra-search', handleGlobalSearch);
    }, []);

    const addToWishlist = async (book) => {
        try {
            const res = await api.post('/student/wishlist/add', { bookId: book.id });
            if (res.success) {
                alert(`"${book.title}" added to your Wishlist!`);
            } else {
                alert(res.message || 'Already in wishlist');
            }
        } catch (e) {
            alert('Could not add to wishlist. Please try again.');
        }
    };

    const handleSaveGoal = async () => {
        try {
            const res = await updateReadingGoal(goalInput);
            if (res.success) {
                setData({ ...data, readingGoal: goalInput });
                setGoalEditMode(false);
            }
        } catch (e) { console.error(e) }
    };

    if (!data) return <p style={{ padding: '40px', textAlign: 'center' }}>Gathering your reading stats...</p>;

    const goalPct = data.readingGoal > 0 ? Math.min(100, Math.round((data.booksRead / data.readingGoal) * 100)) : 0;
    const circleOffset = 251.2 - (251.2 * goalPct) / 100;

    // Filtered Catalog
    const filteredCatalog = (data.catalog || []).filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="view active">
            <div className="welcome-section">
                <h1>Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
                <p>Track your loans, achieve your goals, and discover new stories.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><i className="fa-solid fa-book-open-reader"></i></div>
                    <div className="stat-details">
                        <h3>Active Loans</h3>
                        <p className="stat-number">{data.activeBorrows}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><i className="fa-solid fa-triangle-exclamation"></i></div>
                    <div className="stat-details">
                        <h3>Due Soon</h3>
                        <p className="stat-number">{data.dueSoon}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><i className="fa-solid fa-book-circle-check"></i></div>
                    <div className="stat-details">
                        <h3>Completed</h3>
                        <p className="stat-number">{data.booksRead}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><i className="fa-solid fa-receipt"></i></div>
                    <div className="stat-details">
                        <h3>Pending Fine</h3>
                        <p className="stat-number">₹{data.pendingFines.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="feature-panel">
                <div className="quote-card" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
                    <i className="fa-solid fa-quote-left quote-icon" style={{ opacity: 0.2 }}></i>
                    <p className="quote-text">"The more that you read, the more things you will know."</p>
                    <span className="quote-author">- Dr. Seuss</span>
                </div>
                <div className="goal-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div className="goal-header">
                        <h3>Annual Reading Goal</h3>
                        <span className="status-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '10px' }}>2026 Target</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '16px' }}>
                        <div className="goal-progress-circle" style={{ width: '80px', height: '80px' }}>
                            <svg width="80" height="80" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" className="circle-bg" strokeWidth="8" />
                                <circle cx="50" cy="50" r="40" className="circle-progress" strokeWidth="8" style={{ strokeDasharray: 251.2, strokeDashoffset: circleOffset }} />
                            </svg>
                            <div className="goal-percentage"><span className="pct" style={{ fontSize: '16px' }}>{goalPct}%</span></div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{data.booksRead} of {data.readingGoal || 0} books</p>
                            <div style={{ marginTop: '8px' }}>
                                {!goalEditMode ? (
                                    <button onClick={() => { setGoalEditMode(true); setGoalInput(data.readingGoal); }}
                                        style={{ background: 'none', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        <i className="fa-solid fa-pen-to-square"></i> Edit Goal
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <input type="number" value={goalInput} onChange={e => setGoalInput(Number(e.target.value))}
                                            style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid var(--primary)' }} />
                                        <button onClick={handleSaveGoal} style={{ padding: '4px 8px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px' }}>Set</button>
                                        <button onClick={() => setGoalEditMode(false)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '11px' }}>X</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-layout">
                <section className="borrowed-section">
                    <div className="section-header">
                        <h2>Currently Reading</h2>
                        <Link to="/my-books" className="view-all">View All</Link>
                    </div>
                    <div className="book-list">
                        {data.activeBorrowsList?.length === 0 ? (
                            <div className="empty-state" style={{ minHeight: '180px', border: '1px dashed var(--border)' }}>
                                <i className="fa-solid fa-mug-hot" style={{ fontSize: '32px', color: 'var(--text-light)', marginBottom: '12px' }}></i>
                                <p style={{ fontSize: '14px' }}>Time for a new story?</p>
                                <Link to="/wishlist" className="btn btn-outline btn-sm mt-2">Browse Catalog</Link>
                            </div>
                        ) : (
                            data.activeBorrowsList?.slice(0, 3).map(book => (
                                <div key={book.txId} className="book-card" style={{ padding: '12px', gap: '16px' }}>
                                    <BookCover title={book.title} coverClass={book.coverClass} style={{ width: '50px', height: '75px', borderRadius: '6px' }} />
                                    <div className="book-info">
                                        <h4 style={{ fontSize: '15px' }}>{book.title}</h4>
                                        <p className="author">{book.author}</p>
                                        <p className={`due-date ${book.overdue ? 'warning' : ''}`} style={{ fontSize: '12px' }}>
                                            <i className="fa-solid fa-clock"></i> {book.overdue ? 'Overdue!' : `Due in ${book.daysLeft} days`}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="recommendations-column">
                    <div className="section-header">
                        <h2>Recommended For You</h2>
                    </div>
                    <div className="recs-stack" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data.catalog?.slice(3, 6).map(book => (
                            <div key={book.id} className="rec-card" style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center'
                            }}>
                                <BookCover title={book.title} coverClass={book.coverClass || 'rec-1'} style={{ width: '40px', height: '60px', borderRadius: '4px', flexShrink: 0 }} />
                                <div className="rec-info" style={{ flex: 1 }}>
                                    <h5 style={{ fontSize: '13px', margin: '0 0 2px 0' }}>{book.title}</h5>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{book.author}</p>
                                </div>
                                <button onClick={() => addToWishlist(book)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}>
                                    <i className="fa-solid fa-plus-circle"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="library-catalog-section" style={{ marginTop: '48px' }}>
                <div className="section-header">
                    <div>
                        <h2>Library Catalog</h2>
                        {searchQuery && <p style={{ fontSize: '13px', color: 'var(--primary)' }}>Showing results for "{searchQuery}"</p>}
                    </div>
                    {!searchQuery && <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Explore our vast collection</p>}
                </div>

                <div className="catalog-grid" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '40px'
                }}>
                    {filteredCatalog.length > 0 ? filteredCatalog.map(book => {
                        const isAvailable = book.available > 0;
                        return (
                            <div key={book.id} className="catalog-card" style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer'
                            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                                <BookCover title={book.title} coverClass={book.coverClass} style={{ width: '100%', aspectRatio: '2/3' }} />
                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>{book.title}</h4>
                                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)' }}>{book.author}</p>

                                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: isAvailable ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <i className={`fa-solid ${isAvailable ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i> {book.available} / {book.totalCopies} Available
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); addToWishlist(book); }} className="btn btn-primary btn-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                            <i className="fa-solid fa-heart"></i> Add to Wishlist
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '48px', color: 'var(--text-light)', marginBottom: '16px' }}></i>
                            <p style={{ color: 'var(--text-muted)' }}>No books matching "{searchQuery}" were found.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function LibrarianDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loans, setLoans] = useState([]);

    useEffect(() => {
        getStats().then(res => { if (res && res.success) setStats(res.stats); }).catch(console.error);
        getActiveLoans().then(res => { if (res && res.success) setLoans(res.borrows || []); }).catch(console.error);
    }, []);

    if (!stats) return <p>Loading admin stats...</p>;

    return (
        <div className="view active">
            <div className="admin-banner">
                <div className="admin-badge"><i className="fa-solid fa-shield-halved"></i> Admin Panel</div>
                <h1>Library Administration</h1>
                <p>Manage your library catalog, issue books, and track all loans.</p>
            </div>

            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="stat-icon-admin"><i className="fa-solid fa-books"></i></div>
                    <div className="stat-value">{stats.totalBooks}</div>
                    <div className="stat-label">Total Books</div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon-admin"><i className="fa-solid fa-arrow-right-from-bracket"></i></div>
                    <div className="stat-value">{stats.booksIssued}</div>
                    <div className="stat-label">Books Issued</div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon-admin"><i className="fa-solid fa-user-group"></i></div>
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Registered Students</div>
                </div>
                <div className="admin-stat-card">
                    <div className="stat-icon-admin"><i className="fa-solid fa-coins"></i></div>
                    <div className="stat-value" style={{ color: '#ffc107' }}>₹{stats.totalFinesPending}</div>
                    <div className="stat-label">Pending Fines</div>
                </div>
            </div>

            <div className="admin-actions-grid">
                <Link to="/manage-books" className="admin-action-card action-add" style={{ textDecoration: 'none', color: 'white' }}>
                    <i className="fa-solid fa-book-medical"></i> Add New Book
                </Link>
                <Link to="/manage-books" className="admin-action-card action-issue" style={{ textDecoration: 'none', color: 'white' }}>
                    <i className="fa-solid fa-paper-plane"></i> Issue to Student
                </Link>
                <Link to="/manage-users" className="admin-action-card action-fine" style={{ textDecoration: 'none', color: 'white' }}>
                    <i className="fa-solid fa-hand-holding-dollar"></i> Collect Fine
                </Link>
            </div>

            <div className="admin-table-container" style={{ marginBottom: '40px' }}>
                <div className="admin-table-header">
                    <h2><i className="fa-solid fa-clipboard-list"></i> Active Loans</h2>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Book</th>
                            <th>Student</th>
                            <th>Borrowed</th>
                            <th>Due Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.length === 0 ? (
                            <tr><td colSpan="5" className="empty-loans-message">No active loans found.</td></tr>
                        ) : (
                            loans.map(loan => {
                                const isOverdue = loan.overdue;
                                return (
                                    <tr key={loan.txId}>
                                        <td>{loan.bookTitle}</td>
                                        <td>{loan.studentName}</td>
                                        <td>{new Date(loan.borrowDate).toLocaleDateString()}</td>
                                        <td style={{ color: isOverdue ? 'red' : 'inherit' }}>{new Date(loan.dueDate).toLocaleDateString()}</td>
                                        <td><span className={`status-badge ${isOverdue ? 'status-overdue' : 'status-active'}`}>{isOverdue ? 'Overdue' : 'Active'}</span></td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { isLibrarian } = useAuth();
    return isLibrarian ? <LibrarianDashboard /> : <StudentDashboard />;
}
