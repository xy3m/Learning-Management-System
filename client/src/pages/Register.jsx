import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'learner' // Default role
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert("Registration Successful! Please Login.");
      navigate('/login');
    } catch (err) {
      alert("Registration Failed. Try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="bg-dark-800 p-8 rounded-2xl shadow-glow w-96 border border-gray-800">
        <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          Join LMS.SIM
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Full Name" 
            className="input-field"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            className="input-field"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
         
          <button type="submit" className="btn-primary w-full mt-4">Register</button>
        </form>

        <p className="mt-4 text-center text-gray-500 text-sm">
          Already have an account? <Link to="/login" className="text-accent-500 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;