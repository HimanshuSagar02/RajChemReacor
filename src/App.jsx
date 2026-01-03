import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import { ToastContainer} from 'react-toastify';
import ForgotPassword from './pages/ForgotPassword'
import { useSelector } from 'react-redux'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Dashboard from './pages/admin/Dashboard'
import EducatorDashboard from './pages/admin/EducatorDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import Courses from './pages/admin/Courses'
import AllCouses from './pages/AllCouses'
import AddCourses from './pages/admin/AddCourses'
import CreateCourse from './pages/admin/CreateCourse'
import CreateLecture from './pages/admin/CreateLecture'
import EditLecture from './pages/admin/EditLecture'
import ViewCourse from './pages/ViewCourse'
import ScrollToTop from './components/ScrollToTop'
import DataLoader from './components/DataLoader'
import EnrolledCourse from './pages/EnrolledCourse'
import ViewLecture from './pages/ViewLecture'
import SearchWithAi from './pages/SearchWithAi'
import StudentDashboard from './pages/StudentDashboard'
import Assignments from './pages/admin/Assignments'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPortal from './pages/admin/AdminPortal'
import MyStudents from './pages/admin/MyStudents'
import Attendance from './pages/admin/Attendance'
import Notifications from './pages/admin/Notifications'
import LiveClasses from './pages/admin/LiveClasses'
import Grades from './pages/admin/Grades'
import Doubts from './pages/Doubts'
import Feedback from './pages/Feedback'
import AdminFeedback from './pages/admin/AdminFeedback'
import VerifyCertificate from './pages/VerifyCertificate'
import MyCertificates from './pages/MyCertificates'
import AIAssistant from './components/AIAssistant'
import axios from 'axios'

// Use environment variable for server URL, fallback to localhost for development
// If VITE_SERVER_URL is not set, use localhost backend for local development
// Use environment variable for server URL, with fallbacks
export const serverUrl = import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.MODE === 'production' 
    ? "https://rajchemreactor.onrender.com" 
    : "http://localhost:8000")


// Log server URL for debugging
if (typeof window !== 'undefined') {
    console.log("[App] Backend Server URL:", serverUrl);
    console.log("[App] Environment:", import.meta.env.MODE);
    console.log("[App] VITE_SERVER_URL:", import.meta.env.VITE_SERVER_URL || "Not set (using localhost:8000)");
}

// Configure axios defaults to always send credentials (cookies)
axios.defaults.withCredentials = true;

function App() {
  
  let {userData} = useSelector(state=>state.user)

  return (
    <>
      <DataLoader />
      <ToastContainer />
      <ScrollToTop/>
      {userData && <AIAssistant />}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/signup' element={!userData?<SignUp/>:<Navigate to={"/"}/>}/>
        <Route path='/profile' element={userData?<Profile/>:<Navigate to={"/signup"}/>}/>
        <Route path='/allcourses' element={userData?<AllCouses/>:<Navigate to={"/signup"}/>}/>
        <Route path='/viewcourse/:courseId' element={userData?<ViewCourse/>:<Navigate to={"/signup"}/>}/>
        <Route path='/editprofile' element={userData?<EditProfile/>:<Navigate to={"/signup"}/>}/>
        <Route path='/enrolledcourses' element={userData?<EnrolledCourse/>:<Navigate to={"/signup"}/>}/>
         <Route path='/viewlecture/:courseId' element={userData?<ViewLecture/>:<Navigate to={"/signup"}/>}/>
         <Route path='/searchwithai' element={userData?<SearchWithAi/>:<Navigate to={"/signup"}/>}/>
         <Route path='/student-dashboard' element={userData?<StudentDashboard/>:<Navigate to={"/signup"}/>}/>
        
        
        <Route path='/dashboard' element={
          userData?.role === "admin"
            ? <AdminDashboard/>
            : userData?.role === "educator"
              ? <EducatorDashboard/>
              : userData 
                ? <Navigate to={"/student-dashboard"}/> 
                : <Navigate to={"/signup"}/>
        }/>
        <Route path='/dashboard-old' element={userData?.role === "educator"?<Dashboard/>:<Navigate to={"/signup"}/>}/>
        <Route path='/courses' element={(userData?.role === "educator" || userData?.role === "admin")?<Courses/>:<Navigate to={"/signup"}/>}/>
        <Route path='/addcourses/:courseId' element={(userData?.role === "educator" || userData?.role === "admin")?<AddCourses/>:<Navigate to={"/signup"}/>}/>
        <Route path='/createcourses' element={(userData?.role === "educator" || userData?.role === "admin")?<CreateCourse/>:<Navigate to={"/signup"}/>}/>
        <Route path='/createlecture/:courseId' element={(userData?.role === "educator" || userData?.role === "admin")?<CreateLecture/>:<Navigate to={"/signup"}/>}/>
        <Route path='/editlecture/:courseId/:lectureId' element={(userData?.role === "educator" || userData?.role === "admin")?<EditLecture/>:<Navigate to={"/signup"}/>}/>
        <Route path='/assignments' element={(userData?.role === "educator" || userData?.role === "admin")?<Assignments/>:<Navigate to={"/signup"}/>}/>
        <Route path='/my-students' element={(userData?.role === "educator" || userData?.role === "admin")?<MyStudents/>:<Navigate to={"/signup"}/>}/>
        <Route path='/attendance' element={(userData?.role === "educator" || userData?.role==="admin")?<Attendance/>:<Navigate to={"/signup"}/>}/>
        <Route path='/notifications' element={(userData?.role === "educator" || userData?.role==="admin")?<Notifications/>:<Navigate to={"/signup"}/>}/>
        <Route path='/liveclasses' element={(userData?.role === "educator" || userData?.role==="admin")?<LiveClasses/>:<Navigate to={"/signup"}/>}/>
        <Route path='/grades' element={(userData?.role === "educator" || userData?.role==="admin")?<Grades/>:<Navigate to={"/signup"}/>}/>
        <Route path='/doubts' element={userData?<Doubts/>:<Navigate to={"/signup"}/>}/>
        <Route path='/feedback' element={userData?.role === "student"?<Feedback/>:<Navigate to={"/signup"}/>}/>
        <Route path='/admin/dashboard' element={userData?.role === "admin"?<AdminDashboard/>:<Navigate to={"/signup"}/>}/>
        <Route path='/admin/users' element={userData?.role === "admin"?<AdminUsers/>:<Navigate to={"/signup"}/>}/>
        <Route path='/admin/portal' element={userData?.role === "admin"?<AdminPortal/>:<Navigate to={"/signup"}/>}/>
        <Route path='/admin/feedback' element={userData?.role === "admin"?<AdminFeedback/>:<Navigate to={"/signup"}/>}/>
        <Route path='/certificate/verify/:certificateId?' element={<VerifyCertificate/>}/>
        <Route path='/my-certificates' element={userData?<MyCertificates/>:<Navigate to={"/signup"}/>}/>
        <Route path='/forgotpassword' element={<ForgotPassword/>}/>
         </Routes>

         </>
   
  )
}

export default App
