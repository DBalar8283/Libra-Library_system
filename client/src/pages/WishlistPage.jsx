import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWishlist, removeFromWishlistApi, getBookAiDescription } from '../services/api';
import { Link } from 'react-router-dom';
import BookCover from '../components/BookCover';

// ── AI Insight Modal ──────────────────────────────────────────────────────────
function AiModal({ book, description, isLoading, onClose }) {
    if (!book) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(15,23,42,0.65)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px',
                animation: 'fadeInOverlay 0.2s ease-out',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '500px',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    animation: 'slideUpModal 0.25s ease-out',
                }}
            >
                {/* Modal Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    padding: '24px 28px',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
                }}>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                            <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '5px' }}></i>AI Perspective
                        </div>
                        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>{book.title}</div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginTop: '4px' }}>{book.author}</div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                            width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', flexShrink: 0, transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        title="Close"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <i className="fa-solid fa-robot" style={{ color: '#7c3aed', fontSize: '15px' }}></i>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Gemini AI Insight
                        </span>
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#7c3aed', marginBottom: '12px', display: 'block' }}></i>
                            Analysing this book...
                        </div>
                    ) : (
                        <p style={{
                            margin: 0, fontSize: '14px', lineHeight: 1.75, color: '#374151',
                            maxHeight: '300px', overflowY: 'auto',
                            scrollbarWidth: 'thin', paddingRight: '4px',
                        }}>
                            {description}
                        </p>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUpModal  { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
            `}</style>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function WishlistPage() {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [descriptions, setDescriptions] = useState({});
    const [loadingId, setLoadingId] = useState(null);
    const [modalBook, setModalBook] = useState(null); // book whose modal is open

    const loadWishlist = () => {
        setLoading(true);
        getWishlist().then(res => {
            if (res && res.success) setWishlist(res.wishlist || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        if (user) loadWishlist();
    }, [user]);

    const removeFromWishlist = async (bookId) => {
        try {
            const res = await removeFromWishlistApi(bookId);
            if (res.success) setWishlist(prev => prev.filter(b => b.id !== bookId));
        } catch (e) {
            alert('Could not remove item. Please try again.');
        }
    };

    const handleAiExplain = async (book) => {
        setModalBook(book); // open modal immediately — shows loading spinner inside
        if (descriptions[book.id] || loadingId === book.id) return;
        setLoadingId(book.id);
        try {
            const res = await getBookAiDescription(book.id);
            if (res.success) {
                setDescriptions(prev => ({ ...prev, [book.id]: res.description }));
            }
        } catch (e) {
            console.error('AI Error:', e);
            setModalBook(null);
        } finally {
            setLoadingId(null);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '12px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: '#ec4899' }}></i> Syncing your wishlist...
        </div>
    );

    return (
        <div className="view active">
            {/* Modal */}
            {modalBook && (
                <AiModal
                    book={modalBook}
                    description={descriptions[modalBook.id]}
                    isLoading={loadingId === modalBook.id}
                    onClose={() => setModalBook(null)}
                />
            )}

            {/* Banner */}
            <div style={{ background: 'linear-gradient(135deg, #db2777, #f43f5e)', padding: '24px', borderRadius: '12px', color: '#fff', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', margin: '0 0 8px 0' }}><i className="fa-solid fa-heart"></i> AI-Enhanced Wishlist</h1>
                <p style={{ margin: 0, opacity: 0.9 }}>Explore your curated collection with instant AI-powered book summaries.</p>
            </div>

            {wishlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                    <i className="fa-solid fa-heart-crack" style={{ fontSize: '48px', color: 'var(--text-light)', marginBottom: '16px' }}></i>
                    <h3 style={{ margin: '0 0 8px 0' }}>Your shelf is empty</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Add books from the library catalog to track what you want to read next.</p>
                    <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none', padding: '10px 24px', borderRadius: '8px' }}>Explore Catalog</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
                    {wishlist.map(book => (
                        <div
                            key={book.id}
                            style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: '12px', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column',
                                position: 'relative', transition: 'transform 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                        >
                            {/* Cover */}
                            <BookCover title={book.title} coverClass={book.coverClass} style={{ width: '100%', aspectRatio: '2/3' }} />

                            {/* Remove button */}
                            <button
                                onClick={() => removeFromWishlist(book.id)}
                                style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: '#fff', color: '#ef4444', border: 'none',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 3,
                                }}
                            >
                                <i className="fa-solid fa-trash-can"></i>
                            </button>

                            {/* Info */}
                            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                <div>
                                    <h4 style={{ margin: '0 0 3px 0', fontSize: '14px', fontWeight: 700 }}>{book.title}</h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{book.author}</p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: book.available > 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <i className={`fa-solid ${book.available > 0 ? 'fa-check' : 'fa-clock'}`}></i>
                                        {book.available > 0 ? `${book.available} Available` : 'Waitlisted'}
                                    </span>
                                    <button
                                        onClick={() => handleAiExplain(book)}
                                        style={{
                                            background: 'linear-gradient(45deg, #7c3aed, #ec4899)',
                                            color: '#fff', border: 'none',
                                            padding: '5px 11px', borderRadius: '6px',
                                            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                        }}
                                    >
                                        <i className="fa-solid fa-wand-magic-sparkles"></i> AI
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
