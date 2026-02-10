import React, { useState, useEffect, memo } from "react";
import {
    FaCalendarDays,
    FaStar,
    FaChartPie,
    FaQuoteRight,
    FaXmark,
    FaYoutube
} from "react-icons/fa6";

const MovieDetailModal = ({
    movie,
    onClose,
    showRandomActions = false,
    onRandomNext,
    genreMap = {},
}) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analysisError, setAnalysisError] = useState("");

    const apiBase =
        import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") ||
        "http://localhost:8080";

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!movie) return;
            setLoading(true);
            try {
                const res = await fetch(`${apiBase}/analyze/${movie.id}`);
                if (!res.ok) {
                    if (res.status === 502) throw new Error("MODEL_DOWN");
                    throw new Error("Failed to analyze");
                }
                const data = await res.json();
                setAnalysis(data);
                setAnalysisError("");
            } catch (err) {
                console.error("Analysis Error:", err);
                setAnalysis(null);
                setAnalysisError(err?.message === "MODEL_DOWN" ? "บริการไม่พร้อมใช้งานชั่วคราว" : "การวิเคราะห์ล้มเหลว");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, [movie, apiBase]);

    if (!movie) return null;

    const rating =
        typeof movie?.rating === "number"
            ? movie.rating
            : typeof movie?.vote_average === "number"
                ? movie.vote_average
                : null;

    const hasAnalysisData =
        analysis &&
        analysis.summary !== "no data" &&
        analysis.stats?.positivePercent !== undefined;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative border border-gray-200 rounded-none md:rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-black hover:text-white text-black p-2 rounded-full transition-all duration-300"
                >
                    <FaXmark size={20} />
                </button>

                {/* Image Section */}
                <div className="w-full md:w-[45%] lg:w-[40%] h-64 md:h-auto bg-black relative">
                    <img
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : "https://via.placeholder.com/500x750"}
                        alt={movie.title}
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden" />
                </div>

                {/* Content Section */}
                <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col overflow-y-auto bg-white">
                    <div className="p-8 md:p-10 lg:p-12">

                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-4xl font-black text-black mb-3 tracking-tight leading-none uppercase">
                                {movie.title}
                            </h2>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <FaCalendarDays /> {movie.release_date?.split("-")[0] || "-"}
                                </span>
                                <span className="w-px h-3 bg-gray-300"></span>
                                <span className="flex items-center gap-1.5 text-black">
                                    <FaStar /> {typeof rating === "number" ? rating.toFixed(1) : "-"}
                                </span>
                                <div className="flex gap-2 ml-auto">
                                    {movie.genre_ids?.map(id => genreMap[id]).filter(Boolean).slice(0, 3).map(g => (
                                        <span key={g} className="px-2 py-1 border border-gray-200 text-xs rounded uppercase tracking-wider">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Overview */}
                        <p className="text-gray-600 leading-relaxed mb-10 text-lg font-light">
                            {movie.overview || "ไม่พบข้อมูลเรื่องย่อ"}
                        </p>

                        {/* Analysis Section */}
                        <div className="border-t border-gray-100 pt-8">
                            <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FaChartPie /> ผลการวิเคราะห์ความรู้สึกโดย AI
                            </h3>

                            {loading ? (
                                <div className="py-10 text-center">
                                    <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                                    <p className="text-xs text-gray-400 mt-2 uppercase tracking-wide">กำลังวิเคราะห์ข้อมูล...</p>
                                </div>
                            ) : hasAnalysisData ? (
                                <div className="space-y-8">
                                    {/* Sentiment Bar - Minimalist */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                                            <span>เชิงบวก (Positive)</span>
                                            <span>เชิงลบ (Negative)</span>
                                        </div>
                                        <div className="h-4 w-full bg-gray-100 flex overflow-hidden">
                                            <div
                                                style={{ width: `${analysis.stats.positivePercent}%` }}
                                                className="bg-black h-full"
                                            />
                                            <div
                                                style={{ width: `${analysis.stats.negativePercent}%` }}
                                                className="bg-gray-300 h-full"
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs font-mono text-gray-400">
                                            <span>{analysis.stats.positivePercent}%</span>
                                            <span>{analysis.stats.negativePercent}%</span>
                                        </div>
                                    </div>

                                    {/* Comments */}
                                    <div className="grid grid-cols-1 gap-4">
                                        {analysis.reviews?.slice(0, 2).map((r, i) => (
                                            <div key={i} className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                                                <p className="text-sm text-gray-700 italic mb-2">"{r.content}"</p>
                                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider text-right">
                                                    — {r.author || "User"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* YouTube Section */}
                                    {analysis.youtubeComments?.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <FaYoutube className="text-gray-900" /> ความคิดเห็นจาก YouTube
                                            </h4>
                                            <ul className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                {analysis.youtubeComments.slice(0, 5).map((c, i) => (
                                                    <li key={i} className="text-sm text-gray-600 border-b border-gray-100 pb-2 last:border-0">
                                                        <span className="font-bold text-gray-900 mr-2">{c.author}:</span>
                                                        {c.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm">{analysisError || "ไม่พบข้อมูลการวิเคราะห์"}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    {showRandomActions && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50 mt-auto flex justify-end">
                            <button
                                onClick={onRandomNext}
                                className="px-8 py-3 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-lg"
                            >
                                สุ่มเรื่องถัดไป
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(MovieDetailModal);
