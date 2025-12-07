import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bankData, setBankData] = useState({ accountNumber: '', secret: '' });
  
  useEffect(() => {
    // 1. Get user from Session Storage
    const storedUserStr = sessionStorage.getItem('user');
    
    if (storedUserStr) {
      const parsedUser = JSON.parse(storedUserStr);
      setUser(parsedUser);

      // --- REDIRECT LOGIC ---
      // If Admin -> Go to Admin Panel
      if (parsedUser.role === 'lms-admin') {
        navigate('/admin');
        return;
      }
      // If Instructor -> Go DIRECTLY to Instructor Dashboard (Skip Home)
      if (parsedUser.role === 'instructor') {
        navigate('/instructor');
        return;
      }
    }
  }, [navigate]);

  const handleBankSetup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/bank/setup', {
        userId: user.id,
        accountNumber: bankData.accountNumber,
        secret: bankData.secret
      });
      
      const updatedUser = { ...user, bankAccountId: res.data._id };
      sessionStorage.setItem('user', JSON.stringify(updatedUser)); 
      setUser(updatedUser);
      
      // Immediate Redirect after Bank Setup
      if (updatedUser.role === 'instructor') {
          navigate('/instructor');
      } else {
          alert("Bank Setup Complete! You received $5000 bonus.");
      }

    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Setup failed"));
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  // 1. Guest View
  if (!user) {
    return (
      <div className="text-center mt-20">
        <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
          Future of Learning
        </h1>
        <p className="text-xl text-gray-400 mb-8">Simulating the ecosystem of Knowledge & Commerce.</p>
        <div className="flex justify-center gap-6">
          <Link to="/login" className="px-8 py-3 bg-dark-800 border border-gray-700 rounded-lg hover:border-accent-500 transition">Login</Link>
          <Link to="/register" className="btn-primary py-3">Get Started</Link>
        </div>
      </div>
    );
  }

  // 2. Logged In BUT No Bank Account (Show Setup Form)
  if (!user.bankAccountId && user.role !== 'lms-admin') {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-dark-800 p-8 rounded-xl shadow-glow border border-red-900/50">
          <h2 className="text-2xl font-bold text-white mb-2">⚠️ Action Required</h2>
          <p className="text-gray-400 mb-6">Before using the LMS, you must link a simulated bank account.</p>
          
          <form onSubmit={handleBankSetup} className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Create an Account Number</label>
              <input 
                type="text" 
                placeholder="e.g. 123-456-789" 
                className="input-field"
                onChange={e => setBankData({...bankData, accountNumber: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Create a Secret PIN</label>
              <input 
                type="password" 
                placeholder="Secret PIN" 
                className="input-field"
                onChange={e => setBankData({...bankData, secret: e.target.value})}
                required
              />
            </div>
            <button className="btn-primary w-full">Initialize Account</button>
          </form>
        </div>
        <button onClick={handleLogout} className="mt-4 text-sm text-gray-500 hover:text-white underline w-full text-center">Logout</button>
      </div>
    );
  }

  // 3. Learner View (Instructors are redirected, so they won't see this)
  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="bg-dark-800 p-10 rounded-2xl shadow-glow text-center border border-gray-800">
        <h1 className="text-4xl font-bold mb-4">Welcome, {user.name}</h1>
        <p className="text-gray-400 mb-8">You are logged in as <span className="text-accent-500 uppercase font-bold">{user.role}</span></p>
        
        <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
          {/* Only showing Learner Options */}
          {user.role === 'learner' && (
            <>
              <Link to="/courses" className="p-6 bg-dark-900 rounded-xl border border-gray-700 hover:border-accent-500 transition group">
                <h3 className="text-xl font-bold group-hover:text-accent-500">Browse Courses</h3>
                <p className="text-sm text-gray-500 mt-2">Buy courses and view certificates.</p>
              </Link>
              
              <div className="p-6 bg-dark-900 rounded-xl border border-gray-700 hover:border-green-500 transition group cursor-pointer" onClick={() => alert("Check Dashboard for balance")}>
                 <h3 className="text-xl font-bold group-hover:text-green-500">Bank Status</h3>
                 <p className="text-sm text-gray-500 mt-2">Account: Active</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;