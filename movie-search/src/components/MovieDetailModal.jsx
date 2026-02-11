import React, { useState, useEffect, memo } from "react";
import {
    FaCalendarDays,
    FaStar,
    FaChartPie,
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

    // ใช้ URL จาก Env หรือ Default เป็น /api
    const apiBase =
        import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") ||
        "/api";

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

    // ฟังก์ชันช่วยแปลงและเลือกสีของ Badge สรุปผล
    const getSummaryConfig = (summary) => {
        if (!summary) return { label: "-", color: "bg-gray-500" };
        const s = summary.toLowerCase();

        if (s.includes("positive")) return { label: "เชิงบวก (Positive)", color: "bg-green-600" };
        if (s.includes("negative")) return { label: "เชิงลบ (Negative)", color: "bg-red-600" };
        if (s.includes("neutral")) return { label: "เป็นกลาง (Neutral)", color: "bg-yellow-500" };

        return { label: summary, color: "bg-black" }; // กรณีอื่นๆ
    };

    const summaryConfig = hasAnalysisData ? getSummaryConfig(analysis.summary) : {};

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
                    className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-black hover:text-white text-black p-2 rounded-full transition-all duration-300 shadow-sm"
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
                                    {/* Sentiment Summary Badge */}
                                    <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                            สรุปผล (Summary)
                                        </span>
                                        <span className={`text-xs font-black uppercase tracking-wider text-white px-3 py-1 rounded-full ${summaryConfig.color}`}>
                                            {summaryConfig.label}
                                        </span>
                                    </div>

                                    {/* Sentiment Bar Graph */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                                            <span>เชิงบวก (Positive)</span>
                                            <span>เชิงลบ (Negative)</span>
                                        </div>
                                        <div className="h-4 w-full bg-gray-100 flex overflow-hidden rounded-full relative">
                                            <div
                                                style={{ width: `${analysis.stats.positivePercent}%` }}
                                                className="bg-green-500 h-full flex items-center justify-start transition-all duration-1000 ease-out"
                                            />
                                            <div
                                                style={{ width: `${analysis.stats.negativePercent}%` }}
                                                className="bg-red-500 h-full flex items-center justify-end transition-all duration-1000 ease-out absolute right-0 top-0"
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs font-mono text-gray-400">
                                            <span>{analysis.stats.positivePercent}%</span>
                                            <span>{analysis.stats.negativePercent}%</span>
                                        </div>
                                    </div>

                                    {/* TMDB Reviews */}
                                    {analysis.tmdbReviews && analysis.tmdbReviews.length > 0 && (
                                        <div className={`grid grid-cols-1 gap-4 ${analysis.tmdbReviews.length > 2
                                            ? "max-h-60 overflow-y-auto pr-2" // เพิ่ม Scrollbar หากมีรีวิวมากกว่า 2
                                            : ""
                                            }`}>
                                            {analysis.tmdbReviews.map((r, i) => (
                                                <div key={i} className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                                                    <p className="text-sm text-gray-700 italic mb-2 line-clamp-3 hover:line-clamp-none transition-all">
                                                        "{r.content}"
                                                    </p>
                                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider text-right">
                                                        — {r.author || "User"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* YouTube Comments */}
                                    {analysis.youtubeComments?.length > 0 && (
                                        <div className="mt-6 border-t border-gray-50 pt-6">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <FaYoutube className="text-black" size={16} /> ความคิดเห็นจาก YouTube
                                            </h4>
                                            <ul className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                                                {analysis.youtubeComments.slice(0, 10).map((c, i) => (
                                                    <li key={i} className="text-sm text-gray-600 border-b border-gray-100 pb-2 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-bold text-xs text-gray-900">{c.author}:</span>
                                                            <span className="text-gray-600">{c.text || c.content || ""}</span>
                                                        </div>
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
