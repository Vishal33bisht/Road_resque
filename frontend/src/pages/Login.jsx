import { useState,useContext} from "react";
import {AuthContext} from   "../context/AuthContext";
import api from "../api";
import {useNavigate} from "react-router-dom";

export default function Login(){
   const [email,setEmail]=useState("");
   const [password,setPassword]=useState("");
   const  {login} =useContext(AuthContext);
   const navigate=useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // CHANGE: Use URLSearchParams instead of FormData
    const params = new URLSearchParams();
    params.append('username', email); // API expects 'username', even if it's an email
    params.append('password', password);

    try {
      const res = await api.post("/login", params); // Axios handles headers automatically
      login(res.data.access_token);
      alert("Login Successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error); // Log exact error to console
      alert("Login failed: " + (error.response?.data?.detail || "Check console for details"));
    }
  };
   return(
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl mb-6 text-center">Login</h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

       <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
              <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                Login
                </button>
            <p className="mt-4 text-center text-gray-600 text-sm">
                Dont have an account? <a href="/register" className="text-blue-500 hover:underline">Register</a>
                </p>
                </form>
        </div>
   );
}
