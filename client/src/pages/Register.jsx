import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Loader2, Cpu } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'learner' // Defaulting to learner strictly
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    toast.dismiss();

    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      toast.success("Account created! Redirecting to login...");
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      toast.error(err.response?.data?.message || "Registration Failed. Try again.");
      setIsLoading(false);
    }
  };

  return (
    // FIX: Used 'min-h-screen' with 'pt-32' to ensure card sits BELOW the Navbar
    <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center pt-32 pb-20 px-6 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' }}}/>

      {/* --- Background Effects --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000 pointer-events-none" />

      {/* --- Register Card --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-[#0f1116] border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)]"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Cpu className="text-indigo-400 w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Join the Network</h2>
          <p className="text-gray-400 text-sm">Create your learner access credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Name Input */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full bg-[#18181b] border border-gray-800 text-white text-sm rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full bg-[#18181b] border border-gray-800 text-white text-sm rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full bg-[#18181b] border border-gray-800 text-white text-sm rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            type="submit" 
            className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4
              ${isLoading 
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Initialize Account
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-all">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;