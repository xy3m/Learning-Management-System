import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User, LogIn, Sparkles, Cpu } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Triggers re-render on route change
  
  // Check if user exists in session
  const user = JSON.parse(sessionStorage.getItem('user'));

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "circOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/5 bg-[#030712]/70 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* --- LOGO SECTION --- */}
        <Link to="/" className="group flex items-center gap-2">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.6 }}
            className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors"
          >
            <Cpu size={20} className="text-indigo-400" />
          </motion.div>
          <span className="text-2xl font-black tracking-tighter text-white">
            LMS
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              .SIM
            </span>
          </span>
        </Link>
        
        {/* --- ACTIONS SECTION --- */}
        <div className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <>
              {/* User Role Badge (Glass Effect) */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
              >
                <div className="p-1 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                   <User size={12} className="text-white" />
                </div>
                <span className="text-xs text-gray-400">
                  Operative: <span className="text-indigo-300 font-mono font-bold uppercase tracking-wider">{user.role}</span>
                </span>
              </motion.div>

              {/* Logout Button */}
              <motion.button 
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/60 transition-all duration-300"
              >
                <span className="text-sm font-bold text-red-400 group-hover:text-red-300">Logout</span>
                <LogOut size={16} className="text-red-400 group-hover:text-red-300 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </>
          ) : (
            <>
              {/* Login Link */}
              <Link to="/login">
                <motion.div 
                  className="text-gray-400 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"
                  whileHover={{ x: -2 }}
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </motion.div>
              </Link>

              {/* Register Button (Primary CTA) */}
              <Link to="/register">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg font-bold text-sm flex items-center gap-2"
                >
                  <span className="relative z-10">Get Access</span>
                  <Sparkles size={16} className="relative z-10 text-purple-200" />
                  
                  {/* Subtle shine effect overlay */}
                  <div className="absolute inset-0 bg-white/20 blur-lg opacity-0 hover:opacity-100 transition-opacity" />
                </motion.button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;