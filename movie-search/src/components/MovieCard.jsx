import React, { memo } from "react";
import { FaStar } from "react-icons/fa6";

const MovieCard = ({ movie, onClick, genreMap = {} }) => {
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
        ? new Date(movie.release_date).getFullYear()
        : "-";

    const genreNames = (movie.genre_ids || [])
        .map((id) => genreMap[id])
        .filter(Boolean)
        .slice(0, 2);

    return (
        <div
            onClick={() => onClick(movie)}
            className="group cursor-pointer flex flex-col h-full"
        >
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-100 mb-4">
                <img
                    src={imageUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
                />

                {typeof rating === "number" && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                        <FaStar className="text-black" size={10} />
                        {rating.toFixed(1)}
                    </div>
                )}

                {/* AI Overlay - Thai Text */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-white text-black px-5 py-2 rounded-full text-xs font-bold tracking-wide transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        ดูบทวิเคราะห์
                    </span>
                </div>
            </div>

            <div className="flex flex-col flex-1 gap-1">
                <h3
                    className="font-bold text-gray-900 text-base leading-tight line-clamp-1 group-hover:text-gray-600 transition-colors"
                    title={movie.title}
                >
                    {movie.title}
                </h3>

                <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-400 text-xs font-medium font-mono">
                        {formattedDate}
                    </p>

                    {genreNames.length > 0 && (
                        <div className="flex gap-1">
                            {genreNames.map((g) => (
                                <span
                                    key={g}
                                    className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 uppercase tracking-wider"
                                >
                                    {g}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(MovieCard);
