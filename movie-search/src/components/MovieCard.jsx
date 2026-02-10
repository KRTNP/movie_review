import React, { memo } from "react";
import { FaStar } from "react-icons/fa6";

const MovieCard = ({ movie, onClick }) => {
    const imageUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://via.placeholder.com/500x750?text=No+Image";

    const rating =
        typeof movie.rating === "number"
            ? movie.rating
            : typeof movie.vote_average === "number"
                ? movie.vote_average
                : null;

    const formattedDate = movie.release_date
        ? new Date(movie.release_date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "";

    return (
        <div
            onClick={() => onClick(movie)}
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col h-full group cursor-pointer relative"
        >
            <div className="relative aspect-[2/3] overflow-hidden bg-gray-200">
                <img
                    src={imageUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {typeof rating === "number" && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded shadow-md flex items-center gap-1">
                        <FaStar className="text-black/80" aria-hidden="true" />
                        คะแนน {rating.toFixed(1)}
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white border border-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white hover:text-black transition">
                        {/* แก้ไข: เปลี่ยนข้อความให้สื่อความหมาย */}
                        วิเคราะห์ด้วย AI
                    </span>
                </div>
            </div>

            <div className="p-4 flex flex-col flex-1">
                <h3
                    className="font-bold text-gray-900 line-clamp-1 mb-1"
                    title={movie.title}
                >
                    {movie.title}
                </h3>
                <p className="text-gray-500 text-xs mb-2">{formattedDate}</p>
            </div>
        </div>
    );
};

export default memo(MovieCard);
