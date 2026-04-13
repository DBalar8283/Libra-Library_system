import React, { useEffect, useState } from 'react';
import { getUsers, getStudentAiSummary } from '../services/api';

export default function StudentInsightsPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summaries, setSummaries] = useState({});
    const [summaryLoading, setSummaryLoading] = useState({});

    useEffect(() => {
        getUsers().then(res => {
            if (res && res.success) {
                const students = (res.users || []).filter(u => u.role === 'student');
                setUsers(students);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleAiSummary = async (email) => {
        if (summaries[email] || summaryLoading[email]) return;
        setSummaryLoading(prev => ({ ...prev, [email]: true }));
        try {
            const res = await getStudentAiSummary(email);
            if (res && res.success) {
                setSummaries(prev => ({ ...prev, [email]: res.summary }));
            } else {
                alert(res.message || "Failed to load summary.");
            }
        } catch (e) {
            alert("Error communicating with AI service.");
        }
        setSummaryLoading(prev => ({ ...prev, [email]: false }));
    };

    if (loading) return <div>Loading records...</div>;

    return (
        <div className="view active">
            <div className="admin-banner" style={{background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '24px', borderRadius: '12px', color: '#fff', marginBottom: '32px'}}>
                <h1 style={{fontSize: '28px', margin: '0 0 8px 0'}}><i className="fa-solid fa-chart-pie"></i> Student Insights</h1>
                <p style={{margin: 0, opacity: 0.9}}>AI-powered behavioral profiles and reading summaries for each student.</p>
            </div>

            {/* Card grid — align-items: stretch so all cards in a row have the same height */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
                alignItems: 'start'   /* cards DON'T stretch to match siblings — each stands alone */
            }}>
                {users.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>No student records found.</div>
                ) : (
                    users.map(user => {
                        const hasSummary = !!summaries[user.email];
                        const isLoadingId = summaryLoading[user.email];

                        return (
                            <div key={user.id} style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                transition: 'box-shadow 0.2s',
                            }}>

                                {/* Header row: avatar + name/email */}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '46px', height: '46px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
                                        color: '#fff', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '19px', fontWeight: 700,
                                        flexShrink: 0
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

                                {/* Stats row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Goal: </span>
                                        <strong style={{ color: 'var(--text-main)' }}>{user.readingGoal || 12} books</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)' }}>Fines: </span>
                                        <strong style={{ color: user.pendingFines > 0 ? '#ef4444' : '#10b981' }}>
                                            ₹{(user.pendingFines || 0).toFixed(2)}
                                        </strong>
                                    </div>
                                </div>

                                {/* Generate button */}
                                {!hasSummary && !isLoadingId && (
                                    <button
                                        onClick={() => handleAiSummary(user.email)}
                                        style={{
                                            width: '100%', padding: '9px 0',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                            background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(168,85,247,0.08))',
                                            border: '1px solid rgba(168,85,247,0.3)',
                                            borderRadius: '8px', cursor: 'pointer',
                                            color: '#7e22ce', fontSize: '13px', fontWeight: 600,
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15))'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(168,85,247,0.08))'}
                                    >
                                        <i className="fa-solid fa-sparkles"></i> Generate AI Profiling
                                    </button>
                                )}

                                {/* Loading state */}
                                {isLoadingId && (
                                    <div style={{
                                        textAlign: 'center', padding: '10px 0',
                                        color: 'var(--primary)', fontSize: '13px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}>
                                        <i className="fa-solid fa-spinner fa-spin"></i> Analyzing student history...
                                    </div>
                                )}

                                {/* AI Summary — scrollable if very long */}
                                {hasSummary && (
                                    <div style={{
                                        background: 'rgba(59,130,246,0.04)',
                                        border: '1px solid rgba(59,130,246,0.18)',
                                        borderLeft: '3px solid #3b82f6',
                                        borderRadius: '0 8px 8px 0',
                                        padding: '12px 14px',
                                        maxHeight: '160px',       /* ← cap height */
                                        overflowY: 'auto',         /* ← scroll when long */
                                        animation: 'fadeIn 0.4s ease-out',
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: '#bfdbfe transparent'
                                    }}>
                                        <div style={{
                                            color: '#3b82f6', fontWeight: 700,
                                            marginBottom: '6px', fontSize: '10px',
                                            textTransform: 'uppercase', letterSpacing: '0.06em',
                                            display: 'flex', alignItems: 'center', gap: '5px'
                                        }}>
                                            <i className="fa-solid fa-robot"></i> Gemini Insight
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.65, color: 'var(--text-main)' }}>
                                            {summaries[user.email]}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
