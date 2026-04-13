import React, { useEffect, useState } from 'react';
import { getUsers, getStudentAiSummary } from '../services/api';

// ── Overlay Modal ─────────────────────────────────────────────────────────────
function InsightModal({ user, summary, isLoading, onClose }) {
    if (!user) return null;

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
                    maxWidth: '540px',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    animation: 'slideUpModal 0.25s ease-out',
                }}
            >
                {/* Modal Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                    padding: '24px 28px',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
                }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            color: '#fff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0,
                            border: '2px solid rgba(255,255,255,0.35)',
                        }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700, lineHeight: 1.2 }}>{user.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginTop: '3px' }}>{user.email}</div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px' }}>
                                    <i className="fa-solid fa-bullseye" style={{ marginRight: '5px' }}></i>
                                    Goal: {user.readingGoal || 0} books
                                </span>
                                <span style={{
                                    background: user.pendingFines > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)',
                                    color: '#fff', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px'
                                }}>
                                    <i className="fa-solid fa-indian-rupee-sign" style={{ marginRight: '5px' }}></i>
                                    Fines: ₹{(user.pendingFines || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
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
                        <i className="fa-solid fa-robot" style={{ color: '#3b82f6', fontSize: '16px' }}></i>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Gemini AI Profile
                        </span>
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#3b82f6', marginBottom: '12px', display: 'block' }}></i>
                            Analysing student history...
                        </div>
                    ) : (
                        <p style={{
                            margin: 0, fontSize: '14px', lineHeight: 1.75,
                            color: '#374151', maxHeight: '320px', overflowY: 'auto',
                            scrollbarWidth: 'thin', paddingRight: '4px',
                        }}>
                            {summary}
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
export default function StudentInsightsPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summaries, setSummaries] = useState({});
    const [summaryLoading, setSummaryLoading] = useState({});
    const [modalUser, setModalUser] = useState(null); // which student's modal is open

    useEffect(() => {
        getUsers().then(res => {
            if (res && res.success) {
                const students = (res.users || []).filter(u => u.role === 'student');
                setUsers(students);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleAiSummary = async (user) => {
        setModalUser(user); // open modal immediately (shows loading state inside)
        if (summaries[user.email] || summaryLoading[user.email]) return;
        setSummaryLoading(prev => ({ ...prev, [user.email]: true }));
        try {
            const res = await getStudentAiSummary(user.email);
            if (res && res.success) {
                setSummaries(prev => ({ ...prev, [user.email]: res.summary }));
            } else {
                alert(res.message || 'Failed to load summary.');
                setModalUser(null);
            }
        } catch (e) {
            alert('Error communicating with AI service.');
            setModalUser(null);
        }
        setSummaryLoading(prev => ({ ...prev, [user.email]: false }));
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '12px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--primary)' }}></i> Loading records...
        </div>
    );

    return (
        <div className="view active">
            {/* Modal */}
            {modalUser && (
                <InsightModal
                    user={modalUser}
                    summary={summaries[modalUser.email]}
                    isLoading={summaryLoading[modalUser.email]}
                    onClose={() => setModalUser(null)}
                />
            )}

            {/* Banner */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '24px', borderRadius: '12px', color: '#fff', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', margin: '0 0 8px 0' }}><i className="fa-solid fa-chart-pie"></i> Student Insights</h1>
                <p style={{ margin: 0, opacity: 0.9 }}>AI-powered behavioral profiles and reading summaries for each student.</p>
            </div>

            {/* Card Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {users.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>No student records found.</div>
                ) : (
                    users.map(user => (
                        <div key={user.id} style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '20px',
                            display: 'flex', flexDirection: 'column', gap: '14px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                            {/* Avatar + Name */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{
                                    width: '46px', height: '46px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
                                    color: '#fff', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '19px', fontWeight: 700, flexShrink: 0,
                                }}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)' }}>Goal: </span>
                                    <strong style={{ color: 'var(--text-main)' }}>{user.readingGoal || 0} books</strong>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)' }}>Fines: </span>
                                    <strong style={{ color: user.pendingFines > 0 ? '#ef4444' : '#10b981' }}>
                                        ₹{(user.pendingFines || 0).toFixed(2)}
                                    </strong>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={() => handleAiSummary(user)}
                                style={{
                                    width: '100%', padding: '9px 0',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(168,85,247,0.08))',
                                    border: '1px solid rgba(168,85,247,0.3)',
                                    borderRadius: '8px', cursor: 'pointer',
                                    color: '#7e22ce', fontSize: '13px', fontWeight: 600,
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15))'}
                                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(168,85,247,0.08))'}
                            >
                                <i className={`fa-solid ${summaries[user.email] ? 'fa-eye' : 'fa-sparkles'}`}></i>
                                {summaries[user.email] ? 'View AI Profile' : 'Generate AI Profiling'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
