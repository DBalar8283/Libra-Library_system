import React, { useEffect, useState } from 'react';
import { getAllBooks, addBook, deleteBook, issueBook } from '../services/api';

export default function ManageBooksPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Add Book Form State
    const [newBook, setNewBook] = useState({ title: '', author: '', totalCopies: 1 });
    const [isAdding, setIsAdding] = useState(false);

    // Issuing State
    const [issuingBookId, setIssuingBookId] = useState(null);
    const [studentEmail, setStudentEmail] = useState('');
    const [isIssuing, setIsIssuing] = useState(false);

    const loadBooks = () => {
        setLoading(true);
        getAllBooks().then(res => {
            if(res && res.success) setBooks(res.books || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { loadBooks(); }, []);

    const handleDelete = async (id) => {
        if(window.confirm('Delete this book completely from the registry?')) {
            const res = await deleteBook(id);
            if(res.success) loadBooks();
            else alert(res.message);
        }
    };

    const handleAddBook = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        const res = await addBook(newBook);
        if(res.success) {
            setNewBook({ title: '', author: '', totalCopies: 1 });
            loadBooks();
        } else {
            alert(res.message);
        }
        setIsAdding(false);
    };

    const handleIssueBook = async (e) => {
        e.preventDefault();
        if(!studentEmail) return alert("Please enter a student email.");
        setIsIssuing(true);
        try {
            const res = await issueBook(issuingBookId, studentEmail);
            if(res.success) {
                alert(res.message);
                setIssuingBookId(null);
                setStudentEmail('');
                loadBooks();
            } else {
                alert(res.message);
            }
        } catch (e) {
            alert("Error issuing book. Please check the student email.");
        }
        setIsIssuing(false);
    };

    return (
        <div className="view active">
            <div className="admin-banner" style={{background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '24px', borderRadius: '12px', color: '#fff', marginBottom: '32px'}}>
                <h1 style={{fontSize: '28px', margin: '0 0 8px 0'}}>Inventory Manager</h1>
                <p style={{margin: 0, opacity: 0.9}}>Expand and curate your library's digital catalog</p>
            </div>

            <div style={{background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '32px'}}>
                <h3 style={{marginTop: 0, marginBottom: '20px', fontSize: '18px'}}><i className="fa-solid fa-plus-circle" style={{color:'var(--primary)'}}></i> Register New Book</h3>
                <form onSubmit={handleAddBook} style={{display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap'}}>
                    <div style={{flex: 2, minWidth: '200px'}}>
                        <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'var(--text-muted)', marginBottom:'8px'}}>Book Title</label>
                        <input type="text" required placeholder="e.g. The Great Gatsby" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} style={{width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid var(--border)', outline:'none'}} />
                    </div>
                    <div style={{flex: 1.5, minWidth: '150px'}}>
                        <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'var(--text-muted)', marginBottom:'8px'}}>Author</label>
                        <input type="text" required placeholder="F. Scott Fitzgerald" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} style={{width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid var(--border)', outline:'none'}} />
                    </div>
                    <div style={{flex: 0.5, minWidth: '80px'}}>
                        <label style={{display:'block', fontSize:'13px', fontWeight:600, color:'var(--text-muted)', marginBottom:'8px'}}>Copies</label>
                        <input type="number" required min="1" value={newBook.totalCopies} onChange={e => setNewBook({...newBook, totalCopies: e.target.value})} style={{width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid var(--border)', outline:'none'}} />
                    </div>
                    <div style={{flex: 'none'}}>
                        <button type="submit" disabled={isAdding} className="btn btn-primary" style={{padding: '10px 24px', height: '42px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            {isAdding ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                            {isAdding ? 'Adding...' : 'Add Book'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead><tr><th>Title</th><th>Author</th><th>Availability</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading && books.length === 0 ? <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>Loading Catalog...</td></tr> : books.length === 0 ? (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No books found. Add one above!</td></tr>
                        ) : books.map(b => {
                            const isLow = b.available === 0;
                            const isIssuingThis = issuingBookId === b.id;
                            return (
                                <React.Fragment key={b.id}>
                                    <tr>
                                        <td style={{fontWeight: 600}}>{b.title}</td>
                                        <td style={{color: 'var(--text-muted)'}}>{b.author}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                                background: isLow ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                                color: isLow ? '#ef4444' : '#10b981'
                                            }}>
                                                {b.available} / {b.totalCopies} available
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{display:'flex', gap:'8px', flexWrap: 'wrap'}}>
                                                <button onClick={() => { setIssuingBookId(isIssuingThis ? null : b.id); setStudentEmail(''); }} 
                                                        disabled={isLow}
                                                        style={{
                                                            background: isLow ? '#f3f4f6' : '#eff6ff', 
                                                            color: isLow ? '#9ca3af' : '#2563eb', 
                                                            border: isLow ? '1px solid #e5e7eb' : '1px solid #bfdbfe', 
                                                            padding: '6px 12px', borderRadius: '6px', cursor: isLow ? 'not-allowed' : 'pointer',
                                                            fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                    <i className="fa-solid fa-paper-plane"></i> Issue Book
                                                </button>
                                                <button onClick={() => handleDelete(b.id)} 
                                                        style={{
                                                            background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', 
                                                            padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                                                            fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => {e.currentTarget.style.background = '#fee2e2'}}
                                                        onMouseLeave={e => {e.currentTarget.style.background = '#fef2f2'}}
                                                        >
                                                    <i className="fa-solid fa-trash"></i> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {isIssuingThis && (
                                        <tr style={{background: 'rgba(59,130,246,0.02)'}}>
                                            <td colSpan="4" style={{padding: '16px 24px', borderBottom: '1px solid var(--border)'}}>
                                                <form onSubmit={handleIssueBook} style={{display:'flex', gap:'12px', alignItems:'center'}}>
                                                    <div style={{flex:1}}>
                                                        <input type="email" required placeholder="Enter student email (e.g. student@library.com)" 
                                                               value={studentEmail} onChange={e => setStudentEmail(e.target.value)}
                                                               style={{width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid var(--primary)', outline:'none'}} />
                                                    </div>
                                                    <button type="submit" disabled={isIssuing} className="btn btn-primary" style={{padding:'10px 20px'}}>
                                                        {isIssuing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check-circle"></i>}
                                                        {isIssuing ? ' Issuing...' : ' Confirm Issue'}
                                                    </button>
                                                    <button type="button" onClick={() => setIssuingBookId(null)} style={{background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer'}}>Cancel</button>
                                                </form>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
