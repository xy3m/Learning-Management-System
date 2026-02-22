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
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center pt-32 pb-20 px-6 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' }}}/>

      {/* --- Background Effects --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0B6E4F]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#0B6E4F]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000 pointer-events-none" />

      {/* --- Register Card --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-[#0f1116] border border-[#50C878]/30 rounded-3xl p-8 md:p-10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)]"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-[#50C878]/10 rounded-2xl border border-[#50C878]/20 mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Cpu className="text-[#50C878] w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-[#D1F2EB] tracking-tight mb-2">Join the Network</h2>
          <p className="text-[#D1F2EB]/70 text-sm">Create your learner access credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Name Input */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-yellow-400 group-focus-within:text-[#50C878] transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full bg-[#18181b] border border-yellow-500/20 text-[#D1F2EB] text-sm rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#50C878] focus:ring-1 focus:ring-[#50C878] transition-all placeholder:text-yellow-100/40"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-yellow-400 group-focus-within:text-[#50C878] transition-colors" />
              </div>
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full bg-[#18181b] border border-yellow-500/20 text-[#D1F2EB] text-sm rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#50C878] focus:ring-1 focus:ring-[#50C878] transition-all placeholder:text-yellow-100/40"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-yellow-400 group-focus-within:text-[#50C878] transition-colors" />
              </div>
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full bg-[#18181b] border border-yellow-500/20 text-[#D1F2EB] text-sm rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#50C878] focus:ring-1 focus:ring-[#50C878] transition-all placeholder:text-yellow-100/40"
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
                ? 'bg-[#0B6E4F] text-[#D1F2EB]/70 cursor-not-allowed border border-yellow-500/30' 
                : 'bg-gradient-to-r from-[#0B6E4F] to-[#0B6E4F] hover:from-[#50C878] hover:to-[#0B6E4F] text-[#D1F2EB] shadow-[#50C878]/25'
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
        <div className="mt-8 text-center border-t border-[#50C878]/20 pt-6">
          <p className="text-yellow-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#50C878] hover:text-[#D1F2EB] font-bold hover:underline transition-all">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;