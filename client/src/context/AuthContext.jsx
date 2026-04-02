import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithGoogle } from '../firebase';
import { syncGoogleAuth, devStudentLogin, librarianLogin } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLibrarian, setIsLibrarian] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('libra_token');
        const storedUserstr = localStorage.getItem('libra_user');
        
        if (storedToken && storedUserstr) {
            try {
                const parsedUser = JSON.parse(storedUserstr);
                setToken(storedToken);
                setUser(parsedUser);
                setIsLibrarian(parsedUser.role === 'librarian');
            } catch (e) {
                console.error("Error parsing user from localStorage", e);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithGoogle();
            const firebaseUser = result.user;
            const data = await syncGoogleAuth({
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL
            });
            handleLoginSuccess(data);
            return data;
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    };

    const loginWithEmail = async (email, password) => {
        const data = await librarianLogin(email, password);
        handleLoginSuccess(data);
        return data;
    };

    const loginDevStudent = async () => {
        const data = await devStudentLogin();
        handleLoginSuccess(data);
        return data;
    };

    const handleLoginSuccess = (data) => {
        if (data.success && data.token) {
            localStorage.setItem('libra_token', data.token);
            localStorage.setItem('libra_user', JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);
            setIsLibrarian(data.user.role === 'librarian');
        } else {
            throw new Error(data.message || 'Login failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('libra_token');
        localStorage.removeItem('libra_user');
        setToken(null);
        setUser(null);
        setIsLibrarian(false);
    };

    return (
        <AuthContext.Provider value={{
            user, token, isLibrarian, loading,
            loginWithGoogle, loginWithEmail, loginDevStudent, logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
