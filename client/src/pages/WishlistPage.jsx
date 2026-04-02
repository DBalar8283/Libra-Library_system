import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWishlist, removeFromWishlistApi } from '../services/api';
import { Link } from 'react-router-dom';

export default function WishlistPage() {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadWishlist = () => {
        setLoading(true);
        getWishlist().then(res => {
            if(res && res.success) {
                setWishlist(res.wishlist || []);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        if(user) loadWishlist();
    }, [user]);

    const removeFromWishlist = async (bookId) => {
        try {
            const res = await removeFromWishlistApi(bookId);
            if(res.success) {
                setWishlist(prev => prev.filter(b => b.id !== bookId));
            }
        } catch (e) {
            alert('Could not remove item. Please try again.');
        }
    };

    if(loading) return <div style={{padding:'40px', textAlign:'center'}}>Syncing your wishlist...</div>;

    return (
        <div className="view active">
            <div className="admin-banner" style={{background: 'linear-gradient(135deg, #db2777, #f43f5e)', padding: '24px', borderRadius: '12px', color: '#fff', marginBottom: '32px'}}>
                <h1 style={{fontSize: '28px', margin: '0 0 8px 0'}}><i className="fa-solid fa-heart"></i> Personal Wishlist</h1>
                <p style={{margin: 0, opacity: 0.9}}>Your curated collection. These books are saved to your account.</p>
            </div>

            {wishlist.length === 0 ? (
                <div style={{textAlign:'center', padding:'60px', background:'var(--bg-card)', borderRadius:'12px', border:'1px dashed var(--border)'}}>
                    <i className="fa-solid fa-heart-crack" style={{fontSize: '48px', color: 'var(--text-light)', marginBottom: '16px'}}></i>
                    <h3 style={{margin: '0 0 8px 0'}}>Your shelf is empty</h3>
                    <p style={{color: 'var(--text-muted)', marginBottom: '24px'}}>Add books from the library catalog to track what you want to read next.</p>
                    <Link to="/" className="btn btn-primary" style={{textDecoration:'none', padding:'10px 24px', borderRadius:'8px'}}>Explore Catalog</Link>
                </div>
            ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px'}}>
                    {wishlist.map(book => (
                        <div key={book.id} className="catalog-card" style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column', position: 'relative', transition: 'transform 0.2s'
                        }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                            <div className={book.coverClass || 'placeholder-cover-1'} style={{height: '160px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#ec4899'}}></div>
                            <button onClick={() => removeFromWishlist(book.id)} style={{
                                position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '50%',
                                background: '#fff', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 2
                            }}>
                                <i className="fa-solid fa-trash-can"></i>
                            </button>
                            <div style={{padding: '16px', display: 'flex', flexDirection: 'column', flex: 1}}>
                                <h4 style={{margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600}}>{book.title}</h4>
                                <p style={{margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)'}}>{book.author}</p>
                                <div style={{marginTop: 'auto', display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:700, color: book.available > 0 ? '#10b981' : '#ef4444'}}>
                                    <i className={`fa-solid ${book.available > 0 ? 'fa-check' : 'fa-clock'}`}></i>
                                    {book.available > 0 ? `${book.available} Available` : 'Waitlisted'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
