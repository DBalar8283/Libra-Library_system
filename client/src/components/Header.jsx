import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        const event = new CustomEvent('libra-search', { detail: query });
        window.dispatchEvent(event);
    };

    return (
        <header className="header">
            <div className="search-bar">
                <i className="fas fa-search"></i>
                <input 
                    type="text" 
                    placeholder="Search books, authors..." 
                    id="global-search" 
                    onChange={handleSearch}
                />
            </div>
            <div className="header-actions">
                <div 
                    className="user-profile" 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                >
                    <img 
                        src={user?.photoURL || "https://ui-avatars.com/api/?name=User&background=0056b3&color=fff"} 
                        alt="Profile" 
                        className="avatar" 
                    />
                    <div className="user-info">
                        <span className="user-name">{user?.name || "User"}</span>
                        <span className="user-role">{user?.role === 'librarian' ? 'Librarian' : 'Student'}</span>
                    </div>
                    <i className="fas fa-chevron-down" style={{ fontSize: '10px', marginLeft: '6px', color: 'var(--text-muted)' }}></i>
                    
                    {dropdownOpen && (
                        <div 
                            className="profile-dropdown" 
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: '0',
                                marginTop: '10px',
                                background: '#fff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                minWidth: '150px',
                                zIndex: 100,
                                overflow: 'hidden'
                            }}
                        >
                            <div 
                                onClick={handleLogout}
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--danger)',
                                    background: 'transparent',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <i className="fas fa-sign-out-alt"></i>
                                <span>Log Out</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
