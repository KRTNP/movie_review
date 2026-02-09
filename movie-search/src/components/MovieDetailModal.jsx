import React, { useState, useEffect } from 'react';

const MovieDetailModal = ({ movie, onClose }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    // ดึงข้อมูลวิเคราะห์ทันทีที่ Modal ถูกเปิด
    useEffect(() => {
        const fetchAnalysis = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8080/api/analyze?movieId=${movie.id}`);
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

        if (movie) {
            fetchAnalysis();
        }
    }, [movie]);

    if (!movie) return null;

    // ฟังก์ชันเลือกสีธีมตามผลสรุป Sentiment
    const getSentimentColor = (summary) => {
        if (summary === 'positive') return 'text-green-600 bg-green-100 border-green-200';
        if (summary === 'negative') return 'text-red-600 bg-red-100 border-red-200';
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
                onClick={e => e.stopPropagation()}
            >

                {/* ปุ่มปิด (Mobile) */}
                <button onClick={onClose} className="absolute top-2 right-2 z-10 md:hidden bg-black/50 text-white p-2 rounded-full">✕</button>

                {/* ฝั่งซ้าย: รูปโปสเตอร์ */}
                <div className="w-full md:w-2/5 h-64 md:h-auto bg-gray-100 relative">
                    <img
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750'}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* ฝั่งขวา: ข้อมูลและการวิเคราะห์ */}
                <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 leading-tight">{movie.title}</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                📅 {movie.release_date} • ⭐ {movie.rating || '-'}
                            </p>
                        </div>
                        <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-gray-900 text-2xl transition">✕</button>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-8 border-l-4 border-indigo-500 pl-4 bg-gray-50 py-2 rounded-r-lg">
                        {movie.overview || "ไม่มีข้อมูลเรื่องย่อ"}
                    </p>

                    {/* ส่วนแสดงผลการวิเคราะห์ AI */}
                    <div className="mt-auto">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            📊 AI Sentiment Analysis
                        </h3>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                                <p className="text-gray-500 text-sm animate-pulse">กำลังอ่านรีวิวและวิเคราะห์ความรู้สึก...</p>
                            </div>
                        ) : analysis ? (
                            <div className="space-y-5 animate-slide-up">

                                {/* 1. สรุปผล (Verdict Badge) */}
                                <div className={`flex items-center justify-between p-4 rounded-xl border ${getSentimentColor(analysis.summary)}`}>
                                    <span className="font-semibold">ผลตอบรับโดยรวม:</span>
                                    <span className="text-lg font-bold uppercase tracking-wider">
                                        {analysis.summary}
                                    </span>
                                </div>

                                {/* 2. Progress Bars */}
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 font-medium">
                                            <span className="text-green-600">Positive (ชอบ)</span>
                                            <span>{analysis.stats?.positivePercent}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-green-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${analysis.stats?.positivePercent}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 font-medium">
                                            <span className="text-red-600">Negative (ไม่ชอบ)</span>
                                            <span>{analysis.stats?.negativePercent}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-red-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${analysis.stats?.negativePercent}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. ตัวอย่างรีวิว */}
                                {analysis.reviews && analysis.reviews.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="font-semibold text-sm text-gray-900 mb-3">💬 ตัวอย่างความคิดเห็น:</h4>
                                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {analysis.reviews.slice(0, 3).map((r, i) => (
                                                <li key={i} className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                    "{r}"
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400">
                                ⚠️ ไม่สามารถดึงข้อมูลวิเคราะห์ได้
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieDetailModal;