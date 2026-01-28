// src/components/MovieCard.jsx
import React from 'react';

const MovieCard = ({ movie }) => {
    // Base URL ของรูปภาพจาก TMDB
    const imageBaseUrl = "https://image.tmdb.org/t/p/w500";

    // ตรวจสอบว่ามีรูปไหม ถ้าไม่มีใช้รูป Placeholder
    const posterSrc = movie.poster_path
        ? `${imageBaseUrl}${movie.poster_path}`
        : "https://via.placeholder.com/200x300?text=No+Image";

    return (
        <div className="min-w-[120px] w-[200px] group cursor-pointer">
            <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-[2/3]">
                <img
                    src={posterSrc}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Overlay Icon */}
                <div className="absolute top-0 left-0">
                    <div className="bg-black/60 backdrop-blur-sm p-2 rounded-br-lg hover:bg-black/80">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mt-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span className="text-sm font-medium text-white">
                        {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                    </span>
                </div>
                <h3 className="font-medium text-white truncate">{movie.title}</h3>

                <div className="mt-3 space-y-2">
                    <button className="w-full flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] py-1.5 rounded-full text-xs font-medium text-blue-400 transition-colors">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MovieCard;