import React, { useState } from 'react'
import logo from "../assets/logo.jpg"
import { IoMdPerson } from "react-icons/io";
import { GiHamburgerMenu, GiSplitCross } from "react-icons/gi";
import { FaTachometerAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice';

function Nav() {
  const [showHam, setShowHam] = useState(false)
  const [showPro, setShowPro] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)

  const handleLogout = async () => {
    try {
      const result = await axios.get(serverUrl + "/api/auth/logout", { withCredentials: true })
      await dispatch(setUserData(null))
      toast.success("LogOut Successfully")
      navigate("/")
    } catch (error) {
      console.log(error.response?.data?.message)
    }
  }

  return (
    <div>
      {/* Main Navigation Bar */}
      <div className='w-full h-[80px] fixed top-0 px-4 md:px-8 py-3 flex items-center justify-between bg-black bg-opacity-95 backdrop-blur-sm z-50 border-b-2 border-[#FFD700] shadow-lg'>
        {/* Logo Section */}
        <div className='flex items-center gap-3 cursor-pointer' onClick={() => navigate("/")}>
          <img src={logo} className='w-14 h-14 rounded-lg border-2 border-[#FFD700] shadow-lg' alt="RCR Logo" />
          <div className='hidden md:block'>
            <span className='text-[#FFD700] text-2xl font-bold block'>RCR</span>
            <span className='text-white text-xs'>RAJ CHEM REACTOR</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className='hidden lg:flex items-center justify-center gap-4'>
          {!userData ? (
            <IoMdPerson className='w-12 h-12 fill-[#FFD700] cursor-pointer border-2 border-[#FFD700] bg-black rounded-full p-2 hover:bg-[#FFD700] hover:fill-black transition-all' onClick={() => setShowPro(prev => !prev)} />
          ) : (
            <div className='w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold border-2 border-[#FFD700] bg-black cursor-pointer hover:border-[#FFC107] transition-all' onClick={() => setShowPro(prev => !prev)}>
              {userData.photoUrl ? (
                <img src={userData.photoUrl} className='w-full h-full rounded-full object-cover' alt="" />
              ) : (
                <span className='text-[#FFD700]'>{userData?.name?.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
          )}

          {userData?.role === "educator" && (
            <button
              className='px-6 py-2 bg-[#FFD700] text-black font-semibold rounded-xl hover:bg-[#FFC107] transition-all shadow-md'
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
          )}
          {userData?.role === "admin" && (
            <button
              className='px-6 py-2 bg-[#FFD700] text-black font-semibold rounded-xl hover:bg-[#FFC107] transition-all shadow-md'
              onClick={() => navigate("/admin/users")}
            >
              Admin Panel
            </button>
          )}
          {userData?.role === "student" && (
            <button
              className='px-6 py-2 bg-[#FFD700] text-black font-semibold rounded-xl hover:bg-[#FFC107] transition-all shadow-md'
              onClick={() => navigate("/student-dashboard")}
            >
              Dashboard
            </button>
          )}

          {!userData && (
            <button
              className='px-6 py-2 border-2 border-[#FFD700] text-[#FFD700] font-semibold rounded-xl hover:bg-[#FFD700] hover:text-black transition-all'
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
          {userData && (
            <button
              className='px-6 py-2 bg-[#FFD700] text-black font-semibold rounded-xl hover:bg-[#FFC107] transition-all shadow-md'
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <GiHamburgerMenu
          className='w-8 h-8 lg:hidden fill-[#FFD700] cursor-pointer hover:fill-[#FFC107] transition-colors'
          onClick={() => setShowHam(prev => !prev)}
        />
      </div>


      {/* Profile Dropdown (Desktop) - Only My Profile */}
      {showPro && userData && (
        <div className='absolute top-[90px] right-4 lg:right-8 z-50 bg-white rounded-2xl shadow-2xl border-2 border-[#FFD700] p-4 min-w-[200px]'>
          <div className='space-y-2'>
            <button
              className='w-full text-left px-4 py-3 bg-black text-[#FFD700] rounded-xl hover:bg-[#FFD700] hover:text-black transition-all font-semibold flex items-center gap-2'
              onClick={() => { navigate("/profile"); setShowPro(false); }}
            >
              <IoMdPerson className='w-5 h-5' />
              My Profile
            </button>
          </div>
        </div>
      )}

     {/* Mobile Menu Overlay */}
<div
  className={`fixed inset-0 bg-black bg-opacity-95 z-[9999] flex flex-col items-center justify-center gap-6
  transition-all duration-300
  ${showHam ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
`}
>
  {/* Close Button */}
  <GiSplitCross
    className="fixed top-6 right-6 w-10 h-10 fill-[#FFD700] cursor-pointer hover:fill-[#FFC107] z-[10000]"
    onClick={() => setShowHam(false)}
  />

  {/* User Avatar */}
  {!userData ? (
    <IoMdPerson className="w-16 h-16 fill-[#FFD700] border-2 border-[#FFD700] rounded-full p-3" />
  ) : (
    <div className="w-16 h-16 rounded-full text-white flex items-center justify-center text-2xl font-bold border-2 border-[#FFD700] bg-black">
      {userData.photoUrl ? (
        <img
          src={userData.photoUrl}
          className="w-full h-full rounded-full object-cover"
          alt=""
        />
      ) : (
        <span className="text-[#FFD700]">
          {userData?.name?.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  )}

{userData && (
  <button
    className="w-full px-6 py-4 bg-[#FFD700] text-black font-bold rounded-xl hover:bg-[#FFC107] transition-all text-lg flex items-center justify-center gap-2"
    onClick={() => {
      navigate("/dashboard");   // 👈 yahin dashboard route
      setShowHam(false);
    }}
  >
     <IoMdPerson className="w-5 h-5" />
    Dashboard
  </button>
)}


  {/* Menu Buttons */}
  <div className="flex flex-col gap-4 w-full max-w-sm px-8">
    {userData && (
      <button
        className="w-full px-6 py-4 bg-[#FFD700] text-black font-bold rounded-xl hover:bg-[#FFC107] transition-all text-lg flex items-center justify-center gap-2"
        onClick={() => {
          navigate("/profile");
          setShowHam(false);
        }}
      >
        <IoMdPerson className="w-5 h-5" />
        My Profile
      </button>
    )}

    {!userData ? (
      <button
        className="w-full px-6 py-4 border-2 border-[#FFD700] text-[#FFD700] font-bold rounded-xl hover:bg-[#FFD700] hover:text-black transition-all text-lg"
        onClick={() => {
          navigate("/login");
          setShowHam(false);
        }}
      >
        Login
      </button>
    ) : (
      <button
        className="w-full px-6 py-4 bg-[#FFD700] text-black font-bold rounded-xl hover:bg-[#FFC107] transition-all text-lg"
        onClick={() => {
          handleLogout();
          setShowHam(false);
        }}
      >
        Logout
      </button>
    )}
  </div>
</div>
    </div>
  )
}

export default Nav
