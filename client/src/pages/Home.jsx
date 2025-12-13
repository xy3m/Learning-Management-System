import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowRight, ShieldCheck, CreditCard, LayoutDashboard } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

// --- VISUAL COMPONENTS ---

const BackgroundChart = () => {
  const data = [
    { v: 10 }, { v: 25 }, { v: 20 }, { v: 40 }, { v: 35 }, { v: 60 }, { v: 80 }
  ];
  return (
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, 100]} />
          <Area type="monotone" dataKey="v" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorV)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const GlassCard = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, rotateX: 2, rotateY: 2 }}
    transition={{ duration: 0.5, type: "spring" }}
    className={`
      relative overflow-hidden
      bg-gray-900/40 backdrop-blur-xl 
      shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
      rounded-2xl p-8 
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bankData, setBankData] = useState({ accountNumber: '', secret: '' });

  // --- LOGIC SECTION ---
  useEffect(() => {
    const storedUserStr = sessionStorage.getItem('user');
    
    if (storedUserStr) {
      const parsedUser = JSON.parse(storedUserStr);
      setUser(parsedUser);

      if (parsedUser.role === 'lms-admin') {
        navigate('/admin');
        return;
      }
      if (parsedUser.role === 'instructor') {
        navigate('/instructor');
        return;
      }
      if (parsedUser.role === 'learner') {
        navigate('/courses');
        return;
      }
    }
  }, [navigate]);

  const handleBankSetup = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Securely linking simulated bank...");
    
    try {
      const res = await axios.post('http://localhost:5000/api/bank/setup', {
        userId: user.id,
        accountNumber: bankData.accountNumber,
        secret: bankData.secret
      });
      
      const updatedUser = { ...user, bankAccountId: res.data._id };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success("Bank Setup Complete! ৳5000 bonus received.", { id: loadingToast });
      
      setTimeout(() => {
        if (updatedUser.role === 'instructor') {
            navigate('/instructor');
        } else {
            navigate('/courses'); 
        }
      }, 1000);

    } catch (err) {
      toast.error("Error: " + (err.response?.data?.message || "Setup failed"), { id: loadingToast });
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
    toast('Logged out successfully', { icon: '👋' });
  };

  // --- RENDER SECTION ---
  
  // 1. Guest View (Landing)
  if (!user) {
    return (
      // FIX: Use 'fixed inset-0' to force background to cover the ENTIRE viewport absolutely
      <div className="fixed inset-0 w-full h-full bg-[#030712] text-white overflow-hidden">
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1f2937', color: '#fff' }}}/>
        
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
            {/* Ambient Glow Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000" />
            <BackgroundChart />
        </div>

        {/* Content Layer - Centered with Flex */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center overflow-y-auto">
          <div className="container mx-auto px-4 text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-indigo-300 mb-6 backdrop-blur-md"
                whileHover={{ scale: 1.05 }}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                System Online v2.0
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">
                  Future of Learning
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Simulating the entire ecosystem of <span className="text-white font-semibold">Knowledge & Commerce</span>. 
                Master skills while managing a virtual economy.
              </p>

              <motion.div 
                className="flex flex-col sm:flex-row justify-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link to="/login">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    <LayoutDashboard size={20} className="text-gray-400 group-hover:text-white transition-colors"/>
                    Access Terminal
                  </motion.button>
                </Link>
                
                <Link to="/register">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                  >
                    Initialize Protocol
                    <ArrowRight size={20} />
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Logged In View (Setup Form) - Also using Fixed Inset
  if (!user.bankAccountId && user.role !== 'lms-admin') {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#030712] flex items-center justify-center p-4 overflow-hidden">
         <Toaster position="top-center" />
         
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <GlassCard className="max-w-lg w-full relative z-10 shadow-[0_0_50px_-12px_rgba(220,38,38,0.2)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Action Required</h2>
              <p className="text-gray-400 text-sm">Link Simulated Finance API</p>
            </div>
          </div>

          <p className="text-gray-300 mb-8 leading-relaxed pl-1">
            To participate in the ecosystem, you must initialize your banking node. 
            <span className="block mt-2 text-xs text-gray-500 font-mono">ENCRYPTION: AES-256-GCM // SIMULATION MODE</span>
          </p>
          
          <form onSubmit={handleBankSetup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Account Identifier</label>
              <div className="relative group">
                <CreditCard className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="e.g. 123-456-789"
                  className="w-full bg-black/40 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                  onChange={e => setBankData({...bankData, accountNumber: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Secret PIN</label>
              <div className="relative group">
                <span className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-indigo-400 font-mono text-sm">***</span>
                <input
                  type="password"
                  placeholder="Secret PIN"
                  className="w-full bg-black/40 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                  onChange={e => setBankData({...bankData, secret: e.target.value})}
                  required
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/25 transition-all mt-4"
            >
              Initialize Banking Node
            </motion.button>
          </form>
          
          <div className="mt-8 pt-6 text-center">
             <button 
                onClick={handleLogout} 
                className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest hover:underline"
              >
               Terminate Session
             </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 3. Fallback
  return null;
};

export default Home;