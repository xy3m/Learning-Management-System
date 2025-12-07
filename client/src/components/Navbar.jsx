import { Link, useNavigate, useLocation } from 'react-router-dom';

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
    <nav className="p-4 bg-dark-800 shadow-lg border-b border-gray-800 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-2xl font-bold tracking-wider hover:text-white transition">
        LMS<span className="text-accent-500">.SIM</span>
      </Link>
      
      <div className="flex gap-6 items-center">
         {user ? (
           <>
             <span className="text-gray-400 text-sm hidden md:block">
               Signed in as <span className="text-accent-500 font-bold uppercase">{user.role}</span>
             </span>
             <button 
               onClick={handleLogout} 
               className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition text-sm font-bold"
             >
               Logout
             </button>
           </>
         ) : (
           <>
             <Link to="/login" className="text-gray-300 hover:text-accent-500 transition font-medium">Login</Link>
             <Link to="/register" className="bg-accent-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-600 transition shadow-glow text-sm">
               Register
             </Link>
           </>
         )}
      </div>
    </nav>
  );
};

export default Navbar;