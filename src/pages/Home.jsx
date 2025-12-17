import React from 'react'
import home from "../assets/home1.jpg"
import Nav from '../components/Nav'
import { SiViaplay } from "react-icons/si";
import Logos from '../components/Logos';
import Cardspage from '../components/Cardspage';
import ExploreCourses from '../components/ExploreCourses';
import About from '../components/About';
import ai from '../assets/ai.png'
import ai1 from '../assets/SearchAi.png'
import ReviewPage from '../components/ReviewPage';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
function Home() {
      const navigate = useNavigate()

  return (

    
    
    <div className='w-[100%] overflow-hidden'>
      
      <div className='w-[100%] lg:h-[140vh] md:h-[90vh] h-[70vh] relative'>
        <Nav/>
        <img src={home} className='object-cover md:object-fill w-[100%] lg:h-[100%] md:h-[90vh] h-[50vh]' alt="" />
        <span className='lg:text-[70px] md:text-[50px] sm:text-[30px] text-[18px] absolute lg:top-[10%] md:top-[12%] top-[10%] w-[100%] px-4 flex items-center justify-center text-[#FFD700] font-bold drop-shadow-2xl text-center'>
          Grow Your Skills to Advance 
        </span>
        <span className='lg:text-[70px] md:text-[50px] sm:text-[30px] text-[18px] absolute lg:top-[18%] md:top-[20%] top-[18%] w-[100%] px-4 flex items-center justify-center text-white font-bold drop-shadow-2xl text-center'>
          Your Career path
        </span>
        <div className='absolute lg:top-[30%] md:top-[35%] top-[60%] w-[100%] flex items-center justify-center gap-3 sm:gap-4 flex-wrap px-4'>
          <button 
            className='px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-[#FFD700] text-black font-bold rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg flex gap-2 cursor-pointer items-center justify-center hover:bg-[#FFC107] transition-all shadow-lg hover:shadow-xl' 
            onClick={()=>navigate("/allcourses")}
          >
            View all Courses <SiViaplay className='w-[20px] h-[20px] sm:w-[25px] sm:h-[25px] md:w-[30px] md:h-[30px] fill-black' />
          </button>
          <button 
            className='px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-2 border-[#FFD700] bg-black bg-opacity-50 text-[#FFD700] font-bold rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg flex gap-2 cursor-pointer items-center justify-center hover:bg-[#FFD700] hover:text-black transition-all shadow-lg hover:shadow-xl backdrop-blur-sm' 
            onClick={()=>navigate("/searchwithai")}
          >
            Search with AI <img src={ai} className='w-[20px] h-[20px] sm:w-[25px] sm:h-[25px] md:w-[30px] md:h-[30px] rounded-full hidden lg:block' alt="" /><img src={ai1} className='w-[25px] h-[25px] sm:w-[30px] sm:h-[30px] rounded-full lg:hidden' alt="" />
          </button>
        </div>
      </div>
      <Logos/>
      <ExploreCourses/>
      <Cardspage/>
      <About/>
      <ReviewPage/>
      <Footer/>

      
      
      
    </div>

  ) 
}

export default Home
