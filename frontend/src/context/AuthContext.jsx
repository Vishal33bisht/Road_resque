import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import api, { clearStoredTokens } from "../api";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = async () => {
        try {
            const response = await api.get("/me");
            setUser(response.data);
            return response.data;
        } catch {
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const login = (nextUser) => {
        setUser(nextUser);
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch {
            // Ignore logout network errors; local auth state should still clear.
            clearStoredTokens();
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: loadUser }}>
            {children}
        </AuthContext.Provider>
    );
};
