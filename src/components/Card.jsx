import React from "react";
import { FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const CourseCard = ({ thumbnail, title, category, price ,id , reviews, class: courseClass, subject }) => {
  const navigate = useNavigate()
   const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1); // rounded to 1 decimal
};

// Usage:
const avgRating = calculateAverageRating(reviews);
console.log("Average Rating:", avgRating);
  return (
    <div className="max-w-sm w-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-[#FFD700] cursor-pointer" onClick={()=>navigate(`/viewcourse/${id}`)}>
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-[#FFD700] px-3 py-1 rounded-full text-xs font-bold">
          ₹{price}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 hover:text-[#FFD700] transition-colors">{title}</h2>

        {/* Class and Subject */}
        <div className="flex flex-wrap gap-2">
          {courseClass && (
            <span className="px-3 py-1 bg-[#FFD700] text-black text-xs font-bold rounded-full border border-black">
              {courseClass}
            </span>
          )}
          {subject && (
            <span className="px-3 py-1 bg-black text-[#FFD700] text-xs font-bold rounded-full">
              {subject}
            </span>
          )}
          <span className="px-3 py-1 bg-gray-100 text-gray-700 capitalize text-xs font-semibold rounded-full border border-gray-300">
            {category}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="font-bold text-black text-lg">₹{price}</span>
          <span className="flex items-center gap-1 bg-[#FFD700] bg-opacity-20 px-3 py-1 rounded-full">
            <FaStar className="text-[#FFD700]" /> 
            <span className="font-semibold text-gray-800">{avgRating}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
