import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Cpu } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Dismiss any previous toasts
    toast.dismiss();

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      
      toast.success(`Welcome back, ${res.data.user.name || 'User'}!`);

      // Small delay to let the toast show before redirecting
      setTimeout(() => {
          // --- REDIRECT LOGIC ---
          if (res.data.user.role === 'learner') {
            navigate('/courses');
          } else {
            // Admin & Instructor are handled by Home.jsx or their specific routes
            navigate('/'); 
          }
      }, 800);

    } catch (err) {
      toast.error(err.response?.data?.message || "Login Failed. Check credentials.");
      setIsLoading(false);
    }
  };

  return (
    // FIX: Updated layout to 'min-h-screen' with 'pt-32' padding.
    // This ensures the card is centered but pushed down enough to clear the fixed Navbar.
    <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center pt-32 pb-20 px-6 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' }}}/>

      {/* --- Background Effects --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000 pointer-events-none" />

      {/* --- Login Card --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-[#0f1116] border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)]"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Cpu className="text-indigo-400 w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h2>
          <p className="text-gray-400 text-sm">Enter your credentials to access the terminal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input 
                type="email" 
                placeholder="name@example.com" 
                className="w-full bg-[#18181b] border border-gray-800 text-white text-base rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-[#18181b] border border-gray-800 text-white text-base rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
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
              w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
              ${isLoading 
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Login
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-all">
              Initialize Protocol
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;