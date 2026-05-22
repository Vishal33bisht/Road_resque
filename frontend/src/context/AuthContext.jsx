import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./auth-context";

const getStoredUser = () => {
    const token = localStorage.getItem("token");
    if (token) {
        try {
            return jwtDecode(token);
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
        }
    }

    return null;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);

    const login = (token) => {
        localStorage.setItem("token", token);
        try {
            const decoded = jwtDecode(token);
            localStorage.setItem("role", decoded.role);
            setUser(decoded);
        } catch (error) {
            console.error("Invalid token during login", error);
            logout();
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
