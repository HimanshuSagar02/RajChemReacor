import React, { useState } from 'react'
import logo from '../assets/logo.jpg'
import google from '../assets/google.jpg'
import axios from 'axios'
import { serverUrl } from '../App'
import { MdOutlineRemoveRedEye, MdRemoveRedEye } from "react-icons/md";
import { FaUser, FaGraduationCap, FaBook } from "react-icons/fa";
import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../../utils/Firebase'
import { ClipLoader } from 'react-spinners'
import { toast } from 'react-toastify'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

function SignUp() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [studentClass, setStudentClass] = useState("")
    const [subject, setSubject] = useState("")
    const navigate = useNavigate()
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const dispatch = useDispatch()

    const handleSignUp = async () => {
        // Validation
        if (!name.trim()) {
            toast.error("Name is required")
            return
        }
        if (!email.trim()) {
            toast.error("Email is required")
            return
        }
        if (!password || password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        if (!studentClass) {
            toast.error("Please select your class/grade (Mandatory)")
            return
        }
        
        setLoading(true)
        try {
            // Only students can sign up - role is always "student"
            const result = await axios.post(serverUrl + "/api/auth/signup", {
                name, 
                email, 
                password, 
                role: "student", // Force student role
                class: studentClass,
                subject: subject
            }, {withCredentials: true})
            dispatch(setUserData(result.data))
            navigate("/")
            toast.success("SignUp Successfully")
            setLoading(false)
        } 
        catch (error) {
            console.log(error)
            setLoading(false)
            toast.error(error.response?.data?.message || "Signup failed")
        }
    }

    const googleSignUp = async () => {
        setGoogleLoading(true)
        try {
            console.log("[GoogleSignUp] Starting Google sign-up...");
            console.log("[GoogleSignUp] Auth object:", auth ? "Available" : "Missing");
            console.log("[GoogleSignUp] Provider object:", provider ? "Available" : "Missing");
            
            if (!auth || !provider) {
                console.error("[GoogleSignUp] Firebase not initialized properly");
                toast.error("Google sign-in is not configured. Please check browser console for details.")
                setGoogleLoading(false)
                return
            }
            
            // For Google signup, class is required for students
            if (!studentClass) {
                toast.error("Please select your class/grade (Mandatory for students)")
                setGoogleLoading(false)
                return
            }
            
            console.log("[GoogleSignUp] Calling signInWithPopup...");
            const response = await signInWithPopup(auth, provider)
            console.log("[GoogleSignUp] Google sign-in successful:", response.user.email);
            
            let user = response.user
            let name = user.displayName || "User";
            let email = user.email
            let photoUrl = user.photoURL || ""
            
            if (!email) {
                console.error("[GoogleSignUp] No email provided by Google");
                toast.error("Email not provided by Google")
                setGoogleLoading(false)
                return
            }
            
            console.log("[GoogleSignUp] Sending user data to backend...");
            // Only students can sign up - role is always "student"
            const result = await axios.post(serverUrl + "/api/auth/googlesignup", {
                name, 
                email, 
                role: "student", // Force student role
                photoUrl,
                class: studentClass,
                subject: subject
            }, {withCredentials: true})
            
            console.log("[GoogleSignUp] Backend response received:", result.data ? "Success" : "Failed");
            dispatch(setUserData(result.data))
            
            // Small delay to ensure cookie is set
            setTimeout(() => {
                navigate("/")
                toast.success("SignUp Successfully")
            }, 100);
            setGoogleLoading(false)
        } catch (error) {
            console.error("[GoogleSignUp] Error details:", {
                code: error.code,
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            setGoogleLoading(false)
            
            // Firebase Auth errors
            if (error.code === 'auth/popup-closed-by-user') {
                toast.error("Sign-in popup was closed. Please try again.")
            } else if (error.code === 'auth/popup-blocked') {
                toast.error("Popup was blocked. Please allow popups for this site and try again.")
            } else if (error.code === 'auth/cancelled-popup-request') {
                console.log("[GoogleSignUp] Popup request cancelled");
                return
            } else if (error.code === 'auth/operation-not-allowed') {
                toast.error("Google sign-in is not enabled. Please enable it in Firebase Console.")
            } else if (error.code === 'auth/unauthorized-domain') {
                toast.error("This domain is not authorized. Please add it to Firebase authorized domains.")
            } else if (error.code === 'auth/invalid-api-key') {
                toast.error("Invalid Firebase API key. Please check your Firebase configuration.")
            } else if (error.code === 'auth/network-request-failed') {
                toast.error("Network error. Please check your internet connection.")
            } else if (error.code) {
                // Other Firebase errors
                console.error("[GoogleSignUp] Firebase error code:", error.code);
                toast.error(`Google sign-up error: ${error.message || error.code}`)
            } else if (error.response?.data?.message) {
                // Backend errors
                console.error("[GoogleSignUp] Backend error:", error.response.data.message);
                toast.error(error.response.data.message)
            } else {
                // Unknown errors
                console.error("[GoogleSignUp] Unknown error:", error);
                toast.error(`Google sign-up failed: ${error.message || "Please try again"}`)
            }
        }
    }

    return (
        <div className='min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-3 sm:p-4'>
            <div className='w-full max-w-6xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row'>
                {/* Left Side - Form */}
                <div className='w-full md:w-[60%] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center'>
                    {/* Header */}
                    <div className='mb-6 md:mb-8'>
                        <div className='flex items-center gap-2 sm:gap-3 mb-2'>
                            <div className='w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg sm:rounded-xl flex items-center justify-center'>
                                <span className='text-[#FFD700] text-xl sm:text-2xl font-bold'>RCR</span>
                            </div>
                            <div>
                                <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Create Account</h1>
                                <p className='text-sm sm:text-base text-gray-600'>Join RCR - RAJ CHEM REACTOR</p>
                            </div>
                        </div>
                    </div>

                    {/* Info: Only students can sign up */}
                    <div className='mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4'>
                        <div className='flex items-start gap-3'>
                            <FaGraduationCap className='text-blue-600 text-xl mt-0.5 flex-shrink-0' />
                            <div>
                                <p className='font-semibold text-blue-900 mb-1'>Student Sign Up</p>
                                <p className='text-sm text-blue-700'>
                                    Only students can create accounts here. Teachers/Educators are created by administrators. 
                                    If you are a teacher, please contact your administrator or use the login page if you already have an account.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className='space-y-5'>
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className='block text-sm font-semibold text-gray-700 mb-2'>
                                Full Name <span className='text-red-500'>*</span>
                            </label>
                            <input 
                                id='name' 
                                type="text" 
                                className='w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FFD700] transition-colors text-gray-900' 
                                placeholder='Enter your full name' 
                                onChange={(e) => setName(e.target.value)} 
                                value={name}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className='block text-sm font-semibold text-gray-700 mb-2'>
                                Email Address <span className='text-red-500'>*</span>
                            </label>
                            <input 
                                id='email' 
                                type="email" 
                                className='w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FFD700] transition-colors text-gray-900' 
                                placeholder='your.email@example.com' 
                                onChange={(e) => setEmail(e.target.value)} 
                                value={email}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className='block text-sm font-semibold text-gray-700 mb-2'>
                                Password <span className='text-red-500'>*</span>
                            </label>
                            <div className='relative'>
                                <input 
                                    id='password' 
                                    type={show ? "text" : "password"} 
                                    className='w-full h-12 px-4 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FFD700] transition-colors text-gray-900' 
                                    placeholder='Minimum 6 characters' 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    value={password}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow(prev => !prev)}
                                    className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                                >
                                    {show ? <MdRemoveRedEye className='w-5 h-5' /> : <MdOutlineRemoveRedEye className='w-5 h-5' />}
                                </button>
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>Must be at least 6 characters long</p>
                        </div>

                        {/* Student-specific fields */}
                        <>
                            {/* Class Selection */}
                            <div>
                                <label htmlFor="class" className='block text-sm font-semibold text-gray-700 mb-2'>
                                    Class/Grade <span className='text-red-500'>*</span> <span className='text-xs font-normal text-gray-500'>(Mandatory)</span>
                                </label>
                                <select 
                                    id='class' 
                                    className='w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FFD700] transition-colors text-gray-900 bg-white' 
                                    value={studentClass}
                                    onChange={(e) => setStudentClass(e.target.value)}
                                    required
                                >
                                    <option value="">Select your class</option>
                                    <option value="9th">9th Grade</option>
                                    <option value="10th">10th Grade</option>
                                    <option value="11th">11th Grade</option>
                                    <option value="12th">12th Grade</option>
                                    <option value="NEET Dropper">NEET Dropper</option>
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label htmlFor="subject" className='block text-sm font-semibold text-gray-700 mb-2'>
                                    Preferred Subject <span className='text-xs font-normal text-gray-500'>(Optional)</span>
                                </label>
                                <input 
                                    id='subject' 
                                    type="text" 
                                    className='w-full h-12 px-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FFD700] transition-colors text-gray-900' 
                                    placeholder='e.g., Physics, Chemistry, Biology, Mathematics'
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            {/* Info Box */}
                            <div className='bg-gradient-to-r from-[#FFD700] to-yellow-100 border-2 border-[#FFD700] rounded-xl p-4'>
                                <div className='flex items-start gap-3'>
                                    <FaBook className='text-[#FFD700] text-xl mt-0.5 flex-shrink-0' />
                                    <div>
                                        <p className='font-bold text-gray-900 mb-1'>About RCR - RAJ CHEM REACTOR</p>
                                        <p className='text-sm text-gray-700'>
                                            RCR is specifically designed for <strong>9th to 12th grade students</strong> and <strong>NEET droppers</strong>. 
                                            All courses are organized by class and subject to help you excel in your studies.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    </div>

                    {/* Submit Button */}
                    <button 
                        className='w-full h-12 bg-black text-[#FFD700] font-bold rounded-xl hover:bg-gray-900 transition-all mt-6 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed' 
                        disabled={loading} 
                        onClick={handleSignUp}
                    >
                        {loading ? (
                            <>
                                <ClipLoader size={20} color='#FFD700' />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>

                    {/* Divider */}
                    <div className='flex items-center gap-4 my-6'>
                        <div className='flex-1 h-px bg-gray-300'></div>
                        <span className='text-sm text-gray-500'>Or continue with</span>
                        <div className='flex-1 h-px bg-gray-300'></div>
                    </div>

                    {/* Google Sign Up */}
                    <button
                        type="button"
                        className='w-full h-12 border-2 border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                        onClick={googleSignUp}
                        disabled={googleLoading}
                    >
                        {googleLoading ? (
                            <ClipLoader size={20} color='gray' />
                        ) : (
                            <>
                                <img src={google} alt="Google" className='w-6 h-6' />
                                <span className='text-gray-700 font-medium'>Sign up with Google</span>
                            </>
                        )}
                    </button>

                    {/* Login Link */}
                    <p className='text-center mt-6 text-gray-600'>
                        Already have an account?{' '}
                        <span 
                            className='text-black font-semibold hover:text-[#FFD700] cursor-pointer underline underline-offset-2' 
                            onClick={() => navigate("/login")}
                        >
                            Login here
                        </span>
                    </p>
                </div>

                {/* Right Side - Branding */}
                <div className='w-full md:w-[40%] bg-gradient-to-br from-black via-gray-900 to-black p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden'>
                    {/* Decorative Elements */}
                    <div className='absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-[#FFD700] opacity-10 rounded-full blur-3xl'></div>
                    <div className='absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-[#FFD700] opacity-10 rounded-full blur-3xl'></div>
                    
                    <div className='relative z-10'>
                        <img src={logo} className='w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-4 md:mb-6 rounded-xl sm:rounded-2xl border-4 border-[#FFD700] shadow-2xl' alt="RCR Logo" />
                        <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-[#FFD700] mb-2 md:mb-3'>RCR</h2>
                        <p className='text-base sm:text-lg md:text-xl text-white mb-4 md:mb-6 font-semibold'>RAJ CHEM REACTOR</p>
                        <div className='bg-black bg-opacity-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-[#FFD700] border-opacity-30'>
                            <p className='text-white text-sm leading-relaxed mb-4'>
                                Your premier learning platform for <strong className='text-[#FFD700]'>9th to 12th grade</strong> students and <strong className='text-[#FFD700]'>NEET droppers</strong>
                            </p>
                            <div className='flex flex-wrap gap-2 justify-center'>
                                <span className='px-3 py-1 bg-[#FFD700] text-black rounded-full text-xs font-semibold'>9th-12th Grade</span>
                                <span className='px-3 py-1 bg-[#FFD700] text-black rounded-full text-xs font-semibold'>NEET Prep</span>
                                <span className='px-3 py-1 bg-[#FFD700] text-black rounded-full text-xs font-semibold'>Subject-Based</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignUp
