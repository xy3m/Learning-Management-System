import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import LearnerCourses from './pages/LearnerCourses';
import CourseLearning from './pages/CourseLearning'; // <--- IMPORT

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900 text-gray-100">
       <Navbar />
        
        <div className="p-8">
          <Routes>
            <Route path="/courses" element={<LearnerCourses />} />
            <Route path="/learning/:courseId" element={<CourseLearning />} /> {/* <--- NEW ROUTE */}
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;