import React, { useState } from 'react'
import logo from '../assets/logo.jpg'
import google from '../assets/google.jpg'
import axios from 'axios'
import { serverUrl } from '../App'
import { MdOutlineRemoveRedEye, MdRemoveRedEye } from "react-icons/md";
import { FaLock, FaEnvelope, FaGraduationCap, FaBook } from "react-icons/fa";
import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../../utils/Firebase'
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const dispatch = useDispatch()

    const handleLogin = async () => {
        if (!email.trim()) {
            toast.error("Email is required")
            return
        }
        if (!password.trim()) {
            toast.error("Password is required")
            return
        }

        setLoading(true)
        try {
            const result = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {email, password}, {withCredentials: true})
            dispatch(setUserData(result.data))
            navigate("/")
            setLoading(false)
            toast.success("Login Successfully")
        } catch (error) {
            console.log(error)
            setLoading(false)
            toast.error(error.response?.data?.message || "Login failed")
        }
    }

    const googleLogin = async () => {
        setGoogleLoading(true)
        try {
            if (!auth || !provider) {
                toast.error("Google sign-in is not configured. Please set VITE_FIREBASE_APIKEY in .env file.")
                setGoogleLoading(false)
                return
            }
            const response = await signInWithPopup(auth, provider)
            
            let user = response.user
            let name = user.displayName || "User";
            let email = user.email
            let photoUrl = user.photoURL || ""
            
            if (!email) {
                toast.error("Email not provided by Google")
                setGoogleLoading(false)
                return
            }
            
            const result = await axios.post(serverUrl + "/api/auth/googlesignup", {
                name, 
                email, 
                photoUrl
            }, {withCredentials: true})
            
            dispatch(setUserData(result.data))
            navigate("/")
            toast.success("Login Successfully")
            setGoogleLoading(false)
        } catch (error) {
            console.log("Google login error:", error)
            setGoogleLoading(false)
            if (error.code === 'auth/popup-closed-by-user') {
                toast.error("Sign-in popup was closed")
            } else if (error.code === 'auth/popup-blocked') {
                toast.error("Popup was blocked. Please allow popups for this site.")
            } else if (error.code === 'auth/cancelled-popup-request') {
                return
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message)
            } else {
                toast.error("Google sign-in failed. Please try again.")
            }
        }
    }

    return (
        <div className='min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4'>
            <div className='w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row'>
                {/* Left Side - Form */}
                <div className='w-full md:w-[60%] p-8 md:p-12 flex flex-col justify-center'>
                    {/* Header */}
                    <div className='mb-8'>
                        <div className='flex items-center gap-3 mb-2'>
                            <div className='w-12 h-12 bg-black rounded-xl flex items-center justify-center'>
                                <span className='text-[#FFD700] text-2xl font-bold'>RCR</span>
                            </div>
                            <div>
                                <h1 className='text-3xl font-bold text-gray-900'>Welcome Back</h1>
                                <p className='text-gray-600'>Login to your RCR account</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className='bg-gradient-to-r from-[#FFD700] to-yellow-100 border-2 border-[#FFD700] rounded-xl p-4 mb-6'>
                        <div className='flex items-start gap-3'>
                            <FaBook className='text-[#FFD700] text-xl mt-0.5 flex-shrink-0' />
                            <div>
                                <p className='font-bold text-gray-900 mb-1'>📚 RCR - RAJ CHEM REACTOR</p>
                                <p className='text-sm text-gray-700'>
                                    Designed for <strong>9th to 12th grade students</strong> and <strong>NEET droppers</strong>. 
                                    All courses are organized by class and subject.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className='space-y-5'>
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className='block text-sm font-semibold text-gray-700 mb-2'>
                                Email Address <span className='text-red-500'>*</span>
                            </label>
                            <div className='relative'>
                                <FaEnvelope className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                                <input 
                                    id='email' 
                                    type="email" 
                                    className='w-full h-12 pl-12 pr-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FFD700] transition-colors text-gray-900' 
                                    placeholder='your.email@example.com' 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    value={email}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className='block text-sm font-semibold text-gray-700 mb-2'>
                                Password <span className='text-red-500'>*</span>
                            </label>
                            <div className='relative'>
                                <FaLock className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                                <input 
                                    id='password' 
                                    type={show ? "text" : "password"} 
                                    className='w-full h-12 pl-12 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#FFD700] transition-colors text-gray-900' 
                                    placeholder='Enter your password' 
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
                        </div>

                        {/* Forgot Password */}
                        <div className='flex justify-end'>
                            <span 
                                className='text-sm text-gray-600 hover:text-[#FFD700] cursor-pointer font-medium transition-colors' 
                                onClick={() => navigate("/forgotpassword")}
                            >
                                Forgot your password?
                            </span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        className='w-full h-12 bg-black text-[#FFD700] font-bold rounded-xl hover:bg-gray-900 transition-all mt-6 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed' 
                        disabled={loading} 
                        onClick={handleLogin}
                    >
                        {loading ? (
                            <>
                                <ClipLoader size={20} color='#FFD700' />
                                <span>Logging in...</span>
                            </>
                        ) : (
                            "Login"
                        )}
                    </button>

                    {/* Divider */}
                    <div className='flex items-center gap-4 my-6'>
                        <div className='flex-1 h-px bg-gray-300'></div>
                        <span className='text-sm text-gray-500'>Or continue with</span>
                        <div className='flex-1 h-px bg-gray-300'></div>
                    </div>

                    {/* Google Login */}
                    <button
                        type="button"
                        className='w-full h-12 border-2 border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                        onClick={googleLogin}
                        disabled={googleLoading}
                    >
                        {googleLoading ? (
                            <ClipLoader size={20} color='gray' />
                        ) : (
                            <>
                                <img src={google} alt="Google" className='w-6 h-6' />
                                <span className='text-gray-700 font-medium'>Sign in with Google</span>
                            </>
                        )}
                    </button>

                    {/* Sign Up Link */}
                    <p className='text-center mt-6 text-gray-600'>
                        Don't have an account?{' '}
                        <span 
                            className='text-black font-semibold hover:text-[#FFD700] cursor-pointer underline underline-offset-2' 
                            onClick={() => navigate("/signup")}
                        >
                            Sign up here
                        </span>
                    </p>
                </div>

                {/* Right Side - Branding */}
                <div className='w-full md:w-[40%] bg-gradient-to-br from-black via-gray-900 to-black p-12 flex flex-col items-center justify-center text-center relative overflow-hidden'>
                    {/* Decorative Elements */}
                    <div className='absolute top-0 right-0 w-64 h-64 bg-[#FFD700] opacity-10 rounded-full blur-3xl'></div>
                    <div className='absolute bottom-0 left-0 w-64 h-64 bg-[#FFD700] opacity-10 rounded-full blur-3xl'></div>
                    
                    <div className='relative z-10'>
                        <img src={logo} className='w-32 h-32 mx-auto mb-6 rounded-2xl border-4 border-[#FFD700] shadow-2xl' alt="RCR Logo" />
                        <h2 className='text-5xl font-bold text-[#FFD700] mb-3'>RCR</h2>
                        <p className='text-xl text-white mb-6 font-semibold'>RAJ CHEM REACTOR</p>
                        <div className='bg-black bg-opacity-50 rounded-2xl p-6 border border-[#FFD700] border-opacity-30'>
                            <div className='flex items-center justify-center gap-2 mb-4'>
                                <FaGraduationCap className='text-[#FFD700] text-2xl' />
                                <p className='text-white text-lg font-semibold'>Your Learning Journey Starts Here</p>
                            </div>
                            <p className='text-white text-sm leading-relaxed mb-4'>
                                Access personalized courses for <strong className='text-[#FFD700]'>9th to 12th grade</strong> and <strong className='text-[#FFD700]'>NEET preparation</strong>
                            </p>
                            <div className='flex flex-wrap gap-2 justify-center'>
                                <span className='px-3 py-1 bg-[#FFD700] text-black rounded-full text-xs font-semibold'>Class-Based</span>
                                <span className='px-3 py-1 bg-[#FFD700] text-black rounded-full text-xs font-semibold'>Subject-Focused</span>
                                <span className='px-3 py-1 bg-[#FFD700] text-black rounded-full text-xs font-semibold'>NEET Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
