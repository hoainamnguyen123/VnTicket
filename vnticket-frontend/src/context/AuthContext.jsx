import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 < Date.now()) {
                        // Token expired, let's try to get a new one silently using our HttpOnly cookie
                        const rs = await axiosClient.post('/auth/refreshtoken');
                        const newToken = rs.data.token;
                        localStorage.setItem('token', newToken);
                        setUser(JSON.parse(localStorage.getItem('user')));
                    } else {
                        setUser(JSON.parse(localStorage.getItem('user')));
                    }
                } catch (error) {
                    // If refreshing fails or token is completely unreadable
                    logoutLocally();
                }
            }
            setLoading(false);
        };
        verifyToken();
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    };

    const logoutLocally = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const logout = async () => {
        try {
            await axiosClient.post('/auth/logout');
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            logoutLocally();
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
