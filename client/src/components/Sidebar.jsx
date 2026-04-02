import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { isLibrarian, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                <i className="fas fa-book-reader"></i>
                <span>Libra</span>
            </Link>
            <nav className="nav-menu">
                <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <i className="fas fa-home"></i>
                    <span>Dashboard</span>
                </NavLink>

                {!isLibrarian && (
                    <>
                        <NavLink to="/my-books" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-book"></i>
                            <span>My Books</span>
                        </NavLink>
                        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-history"></i>
                            <span>Reading History</span>
                        </NavLink>
                        <NavLink to="/fines" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-money-bill-wave"></i>
                            <span>Fines & Payments</span>
                        </NavLink>
                        <NavLink to="/wishlist" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-heart"></i>
                            <span>Wishlist</span>
                        </NavLink>
                    </>
                )}

                {isLibrarian && (
                    <>
                        <NavLink to="/manage-books" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-book-open"></i>
                            <span>Manage Books</span>
                        </NavLink>
                        <NavLink to="/return-books" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-undo"></i>
                            <span>Process Returns</span>
                        </NavLink>
                        <NavLink to="/manage-users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-users"></i>
                            <span>Manage Users</span>
                        </NavLink>
                        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-list-alt"></i>
                            <span>Transaction Log</span>
                        </NavLink>
                    </>
                )}

                <div className="divider"></div>
                
                <a href="#" className="nav-item logout" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Log Out</span>
                </a>
            </nav>
        </aside>
    );
}
