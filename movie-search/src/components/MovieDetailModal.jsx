import React, { useState, useEffect } from "react";
import {
    FaCalendarDays,
    FaStar,
    FaChartPie,
    FaComments,
    FaXmark,
} from "react-icons/fa6";

const MovieDetailModal = ({ movie, onClose }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ytComments, setYtComments] = useState([]);
    const [ytLoading, setYtLoading] = useState(false);
    const [ytError, setYtError] = useState("");

    const apiBase =
        import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") ||
        "http://localhost:8080";

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!movie) return;
            setLoading(true);
            try {
                const res = await fetch(`${apiBase}/analyze/${movie.id}`);
                if (!res.ok) throw new Error("Failed to analyze");
                const data = await res.json();
                setAnalysis(data);
            } catch (err) {
                console.error("Analysis Error:", err);
                setAnalysis(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [movie]);

    useEffect(() => {
        const fetchYoutubeComments = async () => {
            if (!movie?.title) return;
            setYtLoading(true);
            setYtError("");
            setYtComments([]);
            try {
                const query = `${movie.title} official trailer`;
                const searchRes = await fetch(
                    `${apiBase}/api/youtube/search?query=${encodeURIComponent(
                        query
                    )}&max=1`
                );
                if (!searchRes.ok) throw new Error("Failed to search youtube");
                const searchData = await searchRes.json();
                const first = searchData.results?.[0];
                if (!first?.videoId) {
                    setYtError("ไม่พบวิดีโอตัวอย่างที่เกี่ยวข้อง");
                    return;
                }

                const commentsRes = await fetch(
                    `${apiBase}/api/youtube/comments?videoId=${encodeURIComponent(
                        first.videoId
                    )}&limit=15`
                );
                if (!commentsRes.ok) throw new Error("Failed to fetch comments");
                const commentsData = await commentsRes.json();
                setYtComments(commentsData.comments || []);
            } catch (err) {
                console.error("YouTube Error:", err);
                setYtError("เกิดข้อผิดพลาดในการดึงข้อมูล YouTube");
            } finally {
                setYtLoading(false);
            }
        };

        fetchYoutubeComments();
    }, [movie]);

    if (!movie) return null;

    const getSentimentColor = (summary) => {
        if (summary === "positive")
            return "text-green-700 bg-green-100 border-green-200";
        if (summary === "negative")
            return "text-red-700 bg-red-100 border-red-200";
        return "text-yellow-700 bg-yellow-100 border-yellow-200";
    };

    const sentimentBadge = (sentiment) => {
        if (sentiment === "positive") return "text-green-600 bg-green-100";
        if (sentiment === "negative") return "text-red-600 bg-red-100";
        return "text-yellow-600 bg-yellow-100";
    };

    const sentimentBorder = (sentiment) => {
        if (sentiment === "positive") return "border-green-400";
        if (sentiment === "negative") return "border-red-400";
        return "border-yellow-400";
    };

    const sentimentLabel = (sentiment) => {
        if (sentiment === "positive") return "เชิงบวก";
        if (sentiment === "negative") return "เชิงลบ";
        if (sentiment === "neutral") return "เป็นกลาง";
        return sentiment || "-";
    };

    const rating =
        typeof movie?.rating === "number"
            ? movie.rating
            : typeof movie?.vote_average === "number"
                ? movie.vote_average
                : null;

    const voteCount =
        typeof movie?.vote_count === "number" ? movie.vote_count : null;
    const popularity =
        typeof movie?.popularity === "number" ? movie.popularity : null;

    const summaryLabel =
        {
            positive: "เชิงบวก",
            negative: "เชิงลบ",
            neutral: "เป็นกลาง",
            mixed: "ผสมผสาน",
        }[analysis?.summary] ||
        analysis?.summary ||
        "-";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                    aria-label="ปิด"
                >
                    <FaXmark />
                </button>

                <div className="w-full md:w-2/5 h-64 md:h-auto bg-gray-100">
                    <img
                        src={
                            movie.poster_path
                                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                : "https://via.placeholder.com/500x750"
                        }
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col overflow-y-auto">
                    <h2 className="text-3xl font-bold text-gray-900">{movie.title}</h2>

                    <p className="text-gray-500 text-sm mt-1 mb-2 flex items-center gap-2 flex-wrap">
                        <FaCalendarDays className="text-gray-400" aria-hidden="true" />
                        <span>ฉายเมื่อ {movie.release_date || "-"}</span>
                        <span className="text-gray-400">|</span>
                        <FaStar className="text-yellow-500" aria-hidden="true" />
                        <span>
                            คะแนน {typeof rating === "number" ? rating.toFixed(1) : "-"}
                        </span>
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                        จำนวนโหวต {voteCount ?? "-"} | ความนิยม{" "}
                        {typeof popularity === "number" ? popularity.toFixed(0) : "-"}
                    </p>

                    <p className="text-gray-700 leading-relaxed mb-6 border-l-4 border-indigo-500 pl-4 bg-gray-50 py-3 rounded-r-lg">
                        {movie.overview || "ไม่มีรายละเอียดเนื้อเรื่องย่อ"}
                    </p>

                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FaChartPie className="text-indigo-600" aria-hidden="true" />
                        ผลการวิเคราะห์กระแสตอบรับ
                    </h3>

                    {loading ? (
                        <div className="py-8 text-center text-gray-500">
                            กำลังวิเคราะห์ข้อมูล...
                        </div>
                    ) : analysis ? (
                        <div className="space-y-6">
                            <div
                                className={`flex justify-between items-center p-4 rounded-xl border ${getSentimentColor(
                                    analysis.summary
                                )}`}
                            >
                                <span className="font-semibold">สรุปภาพรวม</span>
                                <span className="font-bold uppercase">{summaryLabel}</span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-green-600">เชิงบวก</span>
                                        <span>{analysis.stats?.positivePercent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className="bg-green-500 h-2.5 rounded-full transition-all"
                                            style={{
                                                width: `${analysis.stats?.positivePercent}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-red-600">เชิงลบ</span>
                                        <span>{analysis.stats?.negativePercent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className="bg-red-500 h-2.5 rounded-full transition-all"
                                            style={{
                                                width: `${analysis.stats?.negativePercent}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {analysis.reviews && analysis.reviews.length > 0 && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-semibold text-gray-900 mb-2">
                                        ตัวอย่างความคิดเห็น
                                    </h4>

                                    <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                        {analysis.reviews.slice(0, 3).map((r, i) => (
                                            <li
                                                key={i}
                                                className={`bg-gray-50 p-4 rounded-xl border-l-4 ${sentimentBorder(
                                                    r.sentiment
                                                )}`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-semibold text-gray-700 text-sm">
                                                        {r.author || "ไม่ระบุชื่อ"}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${sentimentBadge(
                                                            r.sentiment
                                                        )}`}
                                                    >
                                                        {sentimentLabel(r.sentiment)}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {r.content}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FaComments className="text-red-600" aria-hidden="true" />
                                    ความคิดเห็นจาก YouTube
                                </h4>
                                {ytLoading ? (
                                    <div className="text-sm text-gray-500">
                                        กำลังโหลดความคิดเห็น...
                                    </div>
                                ) : ytError ? (
                                    <div className="text-sm text-red-600">{ytError}</div>
                                ) : ytComments.length > 0 ? (
                                    <ul className="space-y-3 max-h-56 overflow-y-auto pr-2">
                                        {ytComments.slice(0, 10).map((c) => (
                                            <li
                                                key={c.commentId}
                                                className="bg-gray-50 p-3 rounded-lg border"
                                            >
                                                <div className="text-xs text-gray-500 mb-1">
                                                    {c.author}
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {c.text}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-sm text-gray-500">
                                        ไม่มีความคิดเห็น
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieDetailModal;
