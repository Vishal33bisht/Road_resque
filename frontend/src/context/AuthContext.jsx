import { createContext, useState, useEffect } from "react";
import {jwtDecode} from "jwt-decode";

export const AuthContext=createContext();

export const AuthProvider=({children})=>{
    const [user,setUser]=useState(null);

useEffect(()=>{
    const token =localStorage.getItem("token");
    if (token) {
        try {
            const decoded = jwtDecode(token);
            setUser(decoded);
        } catch (error) {
            localStorage.removeItem("token");
        }
    }
    },[]);

    const login = (token) => {
        localStorage.setItem("token", token);
        try {
            const decoded = jwtDecode(token);
            localStorage.setItem("role", decoded.role);
        setUser(decoded);
    }
    catch (error) {
            console.error("Invalid token during login", error);
            logout();
        }
    };
    const logout=()=>{
        localStorage.removeItem("token");
        setUser(null);
    };

    return(
        <AuthContext.Provider value={{user,login,logout}}>
            {children}
        </AuthContext.Provider>
    );
};