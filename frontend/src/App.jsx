import {Routes,Route,Navigate} from "react-router-dom";
import Login from './pages/Login';
import { useContext } from "react";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard"; 
import {AuthProvider,AuthContext} from "./context/AuthContext";


function App(){
  return(
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;