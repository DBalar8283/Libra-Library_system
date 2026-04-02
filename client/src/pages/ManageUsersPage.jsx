import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser, collectFine } from '../services/api';

export default function ManageUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const loadUsers = () => {
        setLoading(true);
        getUsers().then(res => { 
            if(res && res.success) setUsers(res.users || []); 
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { loadUsers(); }, []);

    const handleDelete = async (id, name) => {
        if(window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) {
            const res = await deleteUser(id);
            if(res && res.success) loadUsers();
            else alert(res?.message || "Error deleting user.");
        }
    };

    const handleCollectFine = async (user) => {
        const amount = window.prompt(`Collect cash from ${user.name} (Current: ₹${user.pendingFines.toFixed(2)}). Enter amount:`, user.pendingFines);
        if (amount === null || amount === "") return;
        
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            alert("Please enter a valid positive amount.");
            return;
        }

        try {
            const res = await collectFine(user.email, parsedAmount);
            if (res.success) {
                alert(`Successfully collected ₹${parsedAmount.toFixed(2)} from ${user.name}.`);
                loadUsers();
            } else {
                alert(res.message || "Error collecting fine.");
            }
        } catch (e) {
            alert("Server error processing payment.");
        }
    };

    return (
        <div className="view active">
            <div className="admin-banner" style={{background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '24px', borderRadius: '12px', color: '#fff', marginBottom: '32px'}}>
                <h1 style={{fontSize: '28px', margin: '0 0 8px 0'}}>User Management</h1>
                <p style={{margin: 0, opacity: 0.9}}>Track student balances, member roles, and account access.</p>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Fine Balance</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>Loading Users...</td></tr> : users.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>No users found.</td></tr>
                        ) : users.map(u => {
                            const isLibrarian = u.role === 'librarian';
                            const hasFine = u.pendingFines > 0;
                            return (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                                            <div style={{width:'32px', height:'32px', borderRadius:'50%', background: isLibrarian ? '#4f46e5' : '#0ea5e9', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600, fontSize:'14px'}}>
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{fontWeight: 600}}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{color: 'var(--text-muted)'}}>{u.email}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px',
                                            background: isLibrarian ? 'rgba(79,70,229,0.1)' : 'rgba(14,165,233,0.1)',
                                            color: isLibrarian ? '#4f46e5' : '#0ea5e9'
                                        }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{fontWeight: 700, color: hasFine ? '#ef4444' : '#10b981'}}>
                                        ₹{u.pendingFines.toFixed(2)}
                                    </td>
                                    <td>
                                        {!isLibrarian && (
                                            <div style={{display:'flex', gap:'8px'}}>
                                                <button onClick={() => handleCollectFine(u)} title="Collect Fine" style={{
                                                    background: hasFine ? 'rgba(16,185,129,0.1)' : 'rgba(200,200,200,0.1)', 
                                                    color: hasFine ? '#10b981' : '#999', 
                                                    border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: hasFine ? 'pointer' : 'default',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <i className="fa-solid fa-hand-holding-dollar"></i>
                                                </button>
                                                <button onClick={() => handleDelete(u.id, u.name)} title="Remove User" style={{
                                                    background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', 
                                                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer'
                                                }}>
                                                    <i className="fa-solid fa-user-xmark"></i>
                                                </button>
                                            </div>
                                        )}
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
