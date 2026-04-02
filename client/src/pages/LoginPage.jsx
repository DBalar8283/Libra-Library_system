import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const { user, token, loading, loginWithGoogle, loginWithEmail, loginDevStudent } = useAuth();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    
    const [isBookOpen, setIsBookOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [thought, setThought] = useState({ quote: '', author: '' });

    const thoughts = [
        { quote: '"A reader lives a thousand lives before he dies. The man who never reads lives only one."', author: '— George R.R. Martin' },
        { quote: '"Not all those who wander are lost — some are between the shelves."', author: '— J.R.R. Tolkien (Adapted)' },
        { quote: '"Books are a uniquely portable magic."', author: '— Stephen King' },
        { quote: '"The more that you read, the more things you will know. The more you learn, the more places you will go."', author: '— Dr. Seuss' },
        { quote: '"A library is not a luxury but one of the necessities of life."', author: '— Henry Ward Beecher' },
    ];

    // Particle effect port
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        let animationFrameId;
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() { this.reset(true); }
            reset(init = false) {
                this.x = Math.random() * canvas.width;
                this.y = init ? Math.random() * canvas.height : canvas.height + 10;
                this.size = Math.random() * 2.5 + 0.5;
                this.speed = Math.random() * 0.5 + 0.1;
                this.drift = (Math.random() - 0.5) * 0.3;
                this.life = 0;
                this.maxLife = Math.random() * 250 + 120;
                this.maxAlpha = Math.random() * 0.3 + 0.05;
                this.alpha = 0;
                const h = 210 + Math.random() * 40;
                const s = 65 + Math.random() * 30;
                this.color = `hsla(${h}, ${s}%, 45%, `;
            }
            update() {
                this.y -= this.speed; this.x += this.drift; this.life++;
                const half = this.maxLife / 2;
                this.alpha = this.life < half
                    ? (this.life / half) * this.maxAlpha
                    : ((this.maxLife - this.life) / half) * this.maxAlpha;
                if (this.life >= this.maxLife || this.y < -10) this.reset();
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `${this.color}1)`;
                ctx.shadowBlur = 12;
                ctx.shadowColor = `${this.color}0.5)`;
                ctx.fill();
                ctx.restore();
            }
        }

        const particles = [];
        for (let i = 0; i < 80; i++) particles.push(new Particle());

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Also the body background is handled in CSS, but the original project had `login-body` on <body>. 
    // We can just wrap the container instead.
    useEffect(() => {
        document.body.classList.add('login-body');
        return () => document.body.classList.remove('login-body');
    }, []);

    if (loading) return null;
    if (token && user) {
        return <Navigate to="/" replace />;
    }

    const handleOpenBook = () => {
        if (isBookOpen) return;
        setThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
        setIsBookOpen(true);
    };

    const handleCloseBook = (e) => {
        e.stopPropagation();
        setIsBookOpen(false);
    };

    const onGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                alert('Sign in failed: ' + (err.message || 'Unknown error'));
            }
        }
    };

    const onAdminLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            await loginWithEmail(email, password);
            navigate('/');
        } catch (err) {
            setErrorMsg(err.message || 'Invalid credentials.');
        }
    };

    const onDevLogin = async () => {
        try {
            await loginDevStudent();
            navigate('/');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <div className="orb orb1"></div>
            <div classNames="orb orb2"></div>
            <div className="orb orb3"></div>
            <canvas id="particle-canvas" ref={canvasRef}></canvas>
            
            <div className="bg-books" id="bg-books">
                {['fa-book', 'fa-book-open', 'fa-bookmark', 'fa-scroll', 'fa-book-atlas'].map((icon, idx) => (
                    <React.Fragment key={idx}>
                        {[0, 1, 2].map(j => (
                            <i key={`${idx}-${j}`} 
                               className={`fa-solid ${icon} bg-book`}
                               style={{
                                   left: `${5 + Math.random() * 90}%`,
                                   fontSize: `${16 + Math.random() * 28}px`,
                                   animationDuration: `${12 + Math.random() * 20}s`,
                                   animationDelay: `${-Math.random() * 28}s`
                               }}
                            ></i>
                        ))}
                    </React.Fragment>
                ))}
            </div>

            <div className="scene-wrapper">
                <div className="hero-label">
                    <h1>Libra</h1>
                    <p>Your Digital Library Portal</p>
                </div>

                <div className={`book-scene ${isBookOpen ? 'book-open' : ''}`} style={{ position: 'relative' }}>
                    <div className={`book-3d ${isBookOpen ? 'is-open' : ''}`} id="book3d">
                        <div className="book-spine"></div>
                        <div className="book-cover-back"></div>

                        <div className="book-pages">
                            <div className="page-stack">
                                <div className="login-panel">
                                    <div className="login-panel-header">
                                        <i className="fa-solid fa-book-open"></i>
                                        <h2>Welcome Back</h2>
                                        <p>Sign in to access your library</p>
                                    </div>

                                    <button onClick={onGoogleLogin} className="google-btn">
                                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" />
                                        Student Sign in with Google
                                    </button>

                                    <div className="divider">or Staff Login</div>

                                    <form onSubmit={onAdminLogin} style={{ width: '100%' }}>
                                        <div className="form-group">
                                            <div className="floating-label-group">
                                                <input 
                                                    type="email" 
                                                    id="admin-email" 
                                                    className="form-control"
                                                    placeholder="admin@library.com" 
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    required 
                                                />
                                                <label htmlFor="admin-email">Librarian Email</label>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <div className="floating-label-group">
                                                <input 
                                                    type="password" 
                                                    id="admin-password" 
                                                    className="form-control"
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    required 
                                                />
                                                <label htmlFor="admin-password">Password</label>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn-submit">
                                            <i className="fa-solid fa-lock" style={{ marginRight: '7px' }}></i> Access Dashboard
                                        </button>
                                    </form>

                                    {errorMsg && <p id="admin-error" style={{ display: 'block', color: 'red', marginTop: '10px' }}>{errorMsg}</p>}
                                </div>
                            </div>
                            <div className="page-stack"></div>
                            <div className="page-stack"></div>
                            <div className="page-stack"></div>
                        </div>

                        <div 
                            className={`book-cover-front ${isBookOpen ? 'no-hover' : ''}`} 
                            onClick={handleOpenBook}
                        >
                            <div className="cover-outside">
                                <div className="cover-glow-ring">
                                    <i className="fa-solid fa-book-open cover-icon-main"></i>
                                </div>
                                <span className="cover-title-main">Libra</span>
                                <div className="cover-divider"></div>
                                <span className="cover-subtitle-main">Library System</span>
                                <button className="btn-access" onClick={(e) => { e.stopPropagation(); handleOpenBook(); }}>
                                    <i className="fa-solid fa-door-open"></i>
                                    Access Website
                                    <i className="fa-solid fa-chevron-right chevron"></i>
                                </button>
                            </div>
                            <div className="cover-inside"></div>
                        </div>
                    </div>

                    <div className="thought-panel">
                        <i className="fa-solid fa-quote-left thought-icon"></i>
                        <p className="thought-quote">{thought.quote}</p>
                        <div className="thought-divider"></div>
                        <span className="thought-author">{thought.author}</span>
                    </div>

                    <div className="hint-arrow" style={{ opacity: isBookOpen ? 0 : 1 }}>
                        <i className="fa-solid fa-chevron-down"></i>
                    </div>

                    <button 
                        className={`btn-close-book ${isBookOpen ? 'visible' : ''}`} 
                        onClick={handleCloseBook}
                    >
                        <i className="fa-solid fa-book"></i> Close Book
                    </button>
                </div>
            </div>
        </>
    );
}
