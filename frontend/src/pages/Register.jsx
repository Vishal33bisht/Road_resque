import {useState} from 'react';
import api from '../api';
import {useNavigate} from 'react-router-dom';

export default function Register(){
    const[formData,setFormData]=useState({
        name: "",email: "", phone:"",password: "" ,role:"user"
    });
    const navigate=useNavigate();

    const handleSubmit=async(e)=>{
        e.preventDefault();
        try{
            await api.post("/register", formData);
        alert("Registration successful! please login.");
        navigate('/login');
    } catch(error){
        alert("Error: " + (error.response?.data?.detail || "Unknown error"));
    }
};

return(
    <div className="flex justify-center items-center h-screen bg-gray-100">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
            <h2 className="text-2xl mb-6 text-center">Register</h2>


        <div className="flex justify-center mb-4">
           <button type="button"
            className={`p-2 w-1/2 ${formData.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setFormData({...formData, role: 'user'})}>Driver</button> 
            <button type="button" 
                className={`p-2 w-1/2 ${formData.role === 'mechanic' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setFormData({...formData, role: 'mechanic'})}>Mechanic</button>
        </div>
         <input type="text" placeholder="Name" className="w-full p-2 mb-3 border rounded"
          onChange={(e) => setFormData({...formData, name: e.target.value})} />
        
        <input type="email" placeholder="Email" className="w-full p-2 mb-3 border rounded"
          onChange={(e) => setFormData({...formData, email: e.target.value})} />

        <input type="text" placeholder="Phone" className="w-full p-2 mb-3 border rounded"
          onChange={(e) => setFormData({...formData, phone: e.target.value})} />

        <input type="password" placeholder="Password" className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Sign Up
        </button>
      </form>
    </div>
  );
}