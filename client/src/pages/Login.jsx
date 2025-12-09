import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      
      // --- UPDATED REDIRECT LOGIC ---
      if (res.data.user.role === 'learner') {
          navigate('/courses');
      } else {
          // Admin & Instructor are handled by Home.jsx or their specific routes
          navigate('/'); 
      }
    } catch (err) {
      alert("Login Failed: " + (err.response?.data?.message || "Check credentials"));
    }
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="bg-dark-800 p-8 rounded-2xl shadow-glow w-96 border border-gray-800">
        <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="input-field"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <button type="submit" className="btn-primary w-full">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;