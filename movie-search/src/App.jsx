import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    FaArrowLeft,
    FaArrowRight,
    FaBolt,
    FaCheck,
    FaCopy,
    FaFlask,
    FaRotate,
    FaTriangleExclamation,
} from "react-icons/fa6";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import MovieDetailModal from "./components/MovieDetailModal";

const API_BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/+$/, "");
const SUGGEST_LIMIT = 7;

const INITIAL_FILTERS = {
    genre: "",
    year: "",
    rating: "",
    popularity: "",
    language: "en",
    actor: "",
    sort: "popularity.desc",
};

const SAMPLE_TEXTS = [
    {
        id: "positive",
        label: "เชิงบวก (Positive)",
        text: "A smart, emotional blockbuster with great pacing, memorable characters, and an ending that really lands.",
    },
    {
        id: "neutral",
        label: "เป็นกลาง (Neutral)",
        text: "The movie has a few strong scenes and decent performances, but overall it feels average and predictable.",
    },
    {
        id: "negative",
        label: "เชิงลบ (Negative)",
        text: "Despite the hype, the script is weak, the editing is messy, and the characters are hard to care about.",
    },
];

function buildUrl(path, params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
            qs.set(key, String(value));
        }
    });
    const query = qs.toString();
    return `${API_BASE}${path}${query ? `?${query}` : ""}`;
}

function normalizeMovie(m) {
    return {
        ...m,
        rating: typeof m.vote_average === "number" ? m.vote_average : m.rating,
    };
}

function formatPercent(v) {
    const n = Number(v);
    if (Number.isNaN(n)) return "0.00";
    return n.toFixed(2);
}

function sentimentTone(label) {
    const l = String(label || "").toLowerCase();
    if (l === "positive") return "bg-green-100 text-green-700 border-green-200";
    if (l === "negative") return "bg-red-100 text-red-700 border-red-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
}

function getThaiLabel(label) {
    const l = String(label || "").toLowerCase();
    if (l === "positive") return "เชิงบวก (POSITIVE)";
    if (l === "negative") return "เชิงลบ (NEGATIVE)";
    if (l === "neutral") return "เป็นกลาง (NEUTRAL)";
    return label || "-";
}

function App() {
    const [view, setView] = useState("home");

    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedMovie, setSelectedMovie] = useState(null);
    const [showRandomActions, setShowRandomActions] = useState(false);

    const [searchMode, setSearchMode] = useState("movie");
    const [searchValue, setSearchValue] = useState("");
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const suggestTimerRef = useRef(null);

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState(INITIAL_FILTERS);

    const [genres, setGenres] = useState([]);

    const [testerMode, setTesterMode] = useState("text");
    const [testText, setTestText] = useState("");
    const [headline, setHeadline] = useState("");
    const [body, setBody] = useState("");
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState("");

    const [randomReviews, setRandomReviews] = useState([]);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [copiedId, setCopiedId] = useState("");

    const genreMap = useMemo(() => {
        const map = {};
        genres.forEach((g) => {
            map[g.id] = g.name;
        });
        return map;
    }, [genres]);

    const fetchGenres = useCallback(async () => {
        try {
            const res = await fetch(buildUrl("/genres", { language: filters.language || "en" }));
            if (!res.ok) throw new Error("Failed to fetch genres");
            const data = await res.json();
            setGenres(Array.isArray(data.genres) ? data.genres : []);
        } catch {
            setGenres([]);
        }
    }, [filters.language]);

    const fetchMovies = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const keyword = searchValue.trim();
            const actorSearch = searchMode === "actor" && keyword;
            const movieSearch = searchMode === "movie" && keyword;

            let url;
            if (movieSearch) {
                url = buildUrl("/search", { q: keyword, page });
            } else {
                url = buildUrl("/discover", {
                    page,
                    genre: filters.genre,
                    year: filters.year,
                    rating: filters.rating,
                    popularity: filters.popularity,
                    language: filters.language,
                    actor: actorSearch ? keyword : filters.actor,
                    sort: filters.sort,
                });
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error("Server Error");

            const data = await res.json();
            const results = Array.isArray(data.results) ? data.results.map(normalizeMovie) : [];

            setMovies(results);
            setTotalPages(Math.max(1, Number(data.totalPages) || 1));
        } catch (err) {
            setMovies([]);
            setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        } finally {
            setLoading(false);
        }
    }, [filters, page, searchMode, searchValue]);

    const fetchSuggestions = useCallback(
        async (term, mode) => {
            const q = term.trim();
            if (!q) {
                setSearchSuggestions([]);
                return;
            }
            setSearchLoading(true);
            try {
                const url =
                    mode === "actor"
                        ? buildUrl("/actors", { query: q, page: 1 })
                        : buildUrl("/search", { q, page: 1 });
                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed suggestion");
                const data = await res.json();
                const items = Array.isArray(data.results) ? data.results : [];

                if (mode === "actor") {
                    setSearchSuggestions(
                        items.slice(0, SUGGEST_LIMIT).map((a) => ({
                            id: `actor-${a.id}`,
                            rawId: a.id,
                            title: a.name,
                            subtitle: a.known_for_department || "นักแสดง",
                            profile_path: a.profile_path,
                            value: a.name,
                            type: "actor",
                        }))
                    );
                } else {
                    setSearchSuggestions(
                        items.slice(0, SUGGEST_LIMIT).map((m) => ({
                            id: `movie-${m.id}`,
                            rawId: m.id,
                            title: m.title,
                            subtitle: m.release_date ? String(m.release_date).slice(0, 4) : "ภาพยนตร์",
                            poster_path: m.poster_path,
                            value: m.title,
                            type: "movie",
                        }))
                    );
                }
            } catch {
                setSearchSuggestions([]);
            } finally {
                setSearchLoading(false);
            }
        },
        []
    );

    const fetchRandomReviews = useCallback(async () => {
        setReviewLoading(true);
        setReviewError("");
        try {
            const res = await fetch(buildUrl("/reviews/random", { count: 5 }));
            if (!res.ok) throw new Error("Failed to fetch random reviews");
            const data = await res.json();
            setRandomReviews(Array.isArray(data.reviews) ? data.reviews : []);
        } catch (err) {
            setRandomReviews([]);
            setReviewError(err.message || "ไม่สามารถโหลดรีวิวได้");
        } finally {
            setReviewLoading(false);
        }
    }, []);

    const handleSearch = useCallback((value) => {
        setSearchValue(value);
        setPage(1);
    }, []);

    const handlePickSuggestion = useCallback(
        (item) => {
            setSearchValue(item.value || item.title || "");
            if (item.type === "actor") {
                setSearchMode("actor");
            } else {
                setSearchMode("movie");
            }
            setPage(1);
        },
        []
    );

    const handlePageChange = useCallback(
        (nextPage) => {
            if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
            setPage(nextPage);
        },
        [page, totalPages]
    );

    const openMovie = useCallback((movie) => {
        setSelectedMovie(movie);
        setShowRandomActions(false);
    }, []);

    const handleRandomMovie = useCallback(async () => {
        try {
            const randomPage = Math.floor(Math.random() * 100) + 1;
            const url = buildUrl("/discover", {
                page: randomPage,
                genre: filters.genre,
                year: filters.year,
                rating: filters.rating,
                popularity: filters.popularity,
                language: filters.language,
                sort: filters.sort,
            });
            const res = await fetch(url);
            if (!res.ok) throw new Error("Random failed");
            const data = await res.json();
            const list = Array.isArray(data.results) ? data.results.map(normalizeMovie) : [];
            if (!list.length) return;
            const pick = list[Math.floor(Math.random() * list.length)];
            setSelectedMovie(pick);
            setShowRandomActions(true);
        } catch {
            // intentionally silent to avoid blocking normal browsing
        }
    }, [filters]);

    const runPredict = useCallback(async () => {
        const payloadText =
            testerMode === "headline"
                ? [headline.trim(), body.trim()].filter(Boolean).join("\n\n")
                : testText.trim();

        if (!payloadText) {
            setTestError("กรุณากรอกข้อความก่อนทำการวิเคราะห์");
            setTestResult(null);
            return;
        }

        setTestLoading(true);
        setTestError("");
        setTestResult(null);

        try {
            const res = await fetch(buildUrl("/sentiment/test"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: payloadText }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "การวิเคราะห์ล้มเหลว");
            }

            setTestResult(data);
        } catch (err) {
            setTestError(err.message || "การวิเคราะห์ล้มเหลว");
        } finally {
            setTestLoading(false);
        }
    }, [body, headline, testText, testerMode]);

    const applySample = useCallback(
        (sample) => {
            if (testerMode === "headline") {
                setHeadline(`${sample.label} headline`);
                setBody(sample.text);
            } else {
                setTestText(sample.text);
            }
            setTestError("");
            setTestResult(null);
        },
        [testerMode]
    );

    const copyReview = useCallback(async (id, text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            window.setTimeout(() => setCopiedId(""), 1200);
        } catch {
            setCopiedId("");
        }
    }, []);

    useEffect(() => {
        fetchGenres();
    }, [fetchGenres]);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    useEffect(() => {
        if (view === "model" && randomReviews.length === 0 && !reviewLoading) {
            fetchRandomReviews();
        }
    }, [fetchRandomReviews, randomReviews.length, reviewLoading, view]);

    useEffect(() => {
        if (suggestTimerRef.current) {
            clearTimeout(suggestTimerRef.current);
        }
        suggestTimerRef.current = setTimeout(() => {
            fetchSuggestions(searchValue, searchMode);
        }, 300);

        return () => {
            if (suggestTimerRef.current) {
                clearTimeout(suggestTimerRef.current);
            }
        };
    }, [fetchSuggestions, searchMode, searchValue]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
            <Navbar
                onSearch={handleSearch}
                searchValue={searchValue}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                searchSuggestions={searchSuggestions}
                searchLoading={searchLoading}
                onPickSuggestion={handlePickSuggestion}
                genres={genres}
                filters={filters}
                setFilters={(next) => {
                    setPage(1);
                    setFilters(next);
                }}
                onRandom={handleRandomMovie}
                filtersOpen={filtersOpen}
                onToggleFilters={() => setFiltersOpen((v) => !v)}
                view={view}
                onChangeView={setView}
            />

            {view === "home" ? (
                <main className="w-full max-w-[1600px] mx-auto px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">ค้นหาภาพยนตร์</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {searchValue.trim()
                                    ? `ผลลัพธ์สำหรับ "${searchValue.trim()}"`
                                    : "ค้นหาหนังตามตัวกรอง นักแสดง และการเรียงลำดับ"}
                            </p>
                        </div>
                        <div className="text-xs text-gray-400 font-semibold">หน้า {page} / {totalPages}</div>
                    </div>

                    {loading ? (
                        <div className="py-24 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
                    ) : error ? (
                        <div className="py-16 border rounded-xl bg-red-50 text-red-700 border-red-200 text-center">
                            {error}
                        </div>
                    ) : movies.length === 0 ? (
                        <div className="py-16 border rounded-xl bg-gray-50 text-gray-500 border-gray-200 text-center">
                            ไม่พบภาพยนตร์ตามเงื่อนไขที่กำหนด
                        </div>
                    ) : (
                        <>
                            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {movies.map((movie) => (
                                    <MovieCard
                                        key={movie.id}
                                        movie={movie}
                                        genreMap={genreMap}
                                        onClick={openMovie}
                                    />
                                ))}
                            </section>

                            <div className="flex justify-center items-center gap-4 py-10 border-t border-gray-100 mt-8">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <FaArrowLeft className="text-xs" /> ก่อนหน้า
                                </button>

                                <span className="text-sm font-semibold text-gray-500">{page} / {totalPages}</span>

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    ถัดไป <FaArrowRight className="text-xs" />
                                </button>
                            </div>
                        </>
                    )}
                </main>
            ) : (
                <main className="w-full max-w-[1600px] mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
                        <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                                    <FaFlask /> ทดสอบโมเดล AI (Model Test)
                                </h2>
                                <div className="inline-flex rounded-full border border-gray-200 p-1 bg-gray-50">
                                    <button
                                        onClick={() => setTesterMode("text")}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full ${testerMode === "text" ? "bg-black text-white" : "text-gray-500"}`}
                                    >
                                        ข้อความ
                                    </button>
                                    <button
                                        onClick={() => setTesterMode("headline")}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full ${testerMode === "headline" ? "bg-black text-white" : "text-gray-500"}`}
                                    >
                                        หัวข้อ + เนื้อหา
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {testerMode === "headline" ? (
                                    <>
                                        <input
                                            type="text"
                                            value={headline}
                                            onChange={(e) => setHeadline(e.target.value)}
                                            placeholder="หัวข้อเรื่อง (Headline)"
                                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                                        />
                                        <textarea
                                            value={body}
                                            onChange={(e) => setBody(e.target.value)}
                                            placeholder="เนื้อหา (Body)"
                                            rows={7}
                                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                                        />
                                    </>
                                ) : (
                                    <textarea
                                        value={testText}
                                        onChange={(e) => setTestText(e.target.value)}
                                        placeholder="วางข้อความรีวิวที่นี่ เพื่อทดสอบการวิเคราะห์..."
                                        rows={9}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                                    />
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {SAMPLE_TEXTS.map((sample) => (
                                        <button
                                            key={sample.id}
                                            onClick={() => applySample(sample)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 hover:border-gray-400"
                                        >
                                            ตัวอย่าง {sample.label}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={runPredict}
                                    disabled={testLoading}
                                    className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-black text-white font-bold text-sm disabled:opacity-50"
                                >
                                    {testLoading ? "กำลังวิเคราะห์..." : "วิเคราะห์ (Predict)"}
                                </button>
                            </div>

                            <div className="mt-8 space-y-4">
                                {testError ? (
                                    <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-4 text-sm">
                                        <div className="font-bold mb-1">เกิดข้อผิดพลาด</div>
                                        <div>{testError}</div>
                                    </div>
                                ) : null}

                                {testResult ? (
                                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${sentimentTone(testResult.label)}`}>
                                                {getThaiLabel(testResult.label)}
                                            </span>
                                            <span className="text-xs text-gray-600">ความแม่นยำ: {formatPercent((testResult.confidence || 0) * 100)}%</span>
                                            <span className="text-xs text-gray-600">เวลาตอบสนอง: {testResult.latencyMs ?? "-"} ms</span>
                                            <span className="text-xs text-gray-600">โมเดล: {testResult.modelVersion || "unknown"}</span>
                                        </div>

                                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                            {testResult.text}
                                        </div>

                                        {testResult.probabilities ? (
                                            <div className="space-y-2">
                                                {Object.entries(testResult.probabilities).map(([k, v]) => (
                                                    <div key={k}>
                                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                            <span>{k}</span>
                                                            <span>{formatPercent(Number(v) * 100)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-black" style={{ width: `${formatPercent(Number(v) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-gray-200 rounded-xl p-5 text-sm text-gray-400">
                                        ยังไม่มีผลการวิเคราะห์
                                    </div>
                                )}

                                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                                    <div className="text-sm font-bold mb-2 flex items-center gap-2">
                                        <FaTriangleExclamation className="text-amber-500" /> ตัวอย่างข้อผิดพลาดที่พบบ่อย
                                    </div>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        <li>`400 Missing text` เมื่อไม่มีข้อความนำเข้า</li>
                                        <li>`500 Sentiment test failed` เมื่อระบบโมเดลขัดข้อง</li>
                                        <li>`timeout` เมื่อการเชื่อมต่อใช้เวลานานเกินไป</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <aside className="bg-white border border-gray-200 rounded-2xl p-6 md:p-7 shadow-sm h-fit">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black tracking-tight flex items-center gap-2">
                                    <FaBolt /> ตัวอย่างรีวิวจาก TMDB
                                </h3>
                                <button
                                    onClick={fetchRandomReviews}
                                    className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400"
                                >
                                    <FaRotate /> สุ่มใหม่
                                </button>
                            </div>

                            {reviewLoading ? (
                                <div className="py-6 text-sm text-gray-500">กำลังโหลดรีวิว...</div>
                            ) : reviewError ? (
                                <div className="py-6 text-sm text-red-600">{reviewError}</div>
                            ) : randomReviews.length === 0 ? (
                                <div className="py-6 text-sm text-gray-500">ไม่พบข้อมูลรีวิว</div>
                            ) : (
                                <ul className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                                    {randomReviews.map((review) => {
                                        const id = `${review.movieId}-${review.author}`;
                                        return (
                                            <li key={id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">{review.movieTitle}</div>
                                                        <div className="text-xs text-gray-500">{review.author || "Unknown"}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => copyReview(id, review.content)}
                                                        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white hover:border-gray-400"
                                                        title="Copy review"
                                                    >
                                                        {copiedId === id ? <FaCheck className="text-green-600" /> : <FaCopy className="text-gray-600" />}
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                                    {review.content}
                                                </p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </aside>
                    </div>
                </main>
            )}

            {selectedMovie ? (
                <MovieDetailModal
                    movie={selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                    showRandomActions={showRandomActions}
                    onRandomNext={handleRandomMovie}
                    genreMap={genreMap}
                />
            ) : null}
        </div>
    );
}

export default App;
