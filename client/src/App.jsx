import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import LearnerCourses from './pages/LearnerCourses';
import CourseLearning from './pages/CourseLearning';

function App() {
  return (
    <Router>
      {/* 1. Removed 'p-8' so dashboards can go full width.
          2. Added 'w-full' to ensure the app container fills the screen.
          3. Pages now control their own padding (e.g., pt-28 for Navbar clearance).
      */}
      <div className="w-full min-h-screen bg-[#0a0a0a] text-gray-100 font-sans">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/courses" element={<LearnerCourses />} />
          <Route path="/learning/:courseId" element={<CourseLearning />} />
          
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;