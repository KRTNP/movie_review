import { useState, useEffect, useCallback, useMemo } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import MovieDetailModal from "./components/MovieDetailModal";

function App() {
  // ... (State เดิมทั้งหมด) ...
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("movie");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [genres, setGenres] = useState([]);
  const [filters, setFilters] = useState({
    genre: "",
    year: "",
    rating: "",
    popularity: "",
    language: "en",
    actor: "",
    sort: "popularity.desc",
  });
  const [randomMovie, setRandomMovie] = useState(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomError, setRandomError] = useState("");
  const [randomOpen, setRandomOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedMovie, setSelectedMovie] = useState(null);

  const apiBase =
    import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") ||
    "http://localhost:8080";

  // ... (Functions เดิมทั้งหมด) ...
  const genreMap = useMemo(() => {
    const map = {};
    for (const g of genres) {
      map[g.id] = g.name;
    }
    return map;
  }, [genres]);

  const fetchMovies = useCallback(
    async (searchTerm, pageNum = 1) => {
      if (!searchTerm) return;
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${apiBase}/search?q=${encodeURIComponent(searchTerm)}&page=${pageNum}`
        );
        if (!res.ok) throw new Error("Server Error");

        const data = await res.json();
        const raw = data.results || [];

        const minRating = filters.rating ? Number(filters.rating) : null;
        const minPopularity = filters.popularity ? Number(filters.popularity) : null;
        const year = filters.year ? String(filters.year) : null;
        const genreId = filters.genre ? Number(filters.genre) : null;
        const lang = filters.language || null;

        const filtered = raw.filter((m) => {
          if (minRating !== null && Number(m.vote_average || 0) < minRating) return false;
          if (minPopularity !== null && Number(m.popularity || 0) < minPopularity) return false;
          if (year && m.release_date && !m.release_date.startsWith(year)) return false;
          if (genreId && Array.isArray(m.genre_ids) && !m.genre_ids.includes(genreId)) return false;
          if (lang && m.original_language && m.original_language !== lang) return false;
          return true;
        });

        const sorted = [...filtered];
        switch (filters.sort) {
          case "vote_average.desc":
            sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
            break;
          case "vote_average.asc":
            sorted.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
            break;
          case "release_date.desc":
            sorted.sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
            break;
          case "release_date.asc":
            sorted.sort((a, b) => (a.release_date || "").localeCompare(b.release_date || ""));
            break;
          case "popularity.asc":
            sorted.sort((a, b) => (a.popularity || 0) - (b.popularity || 0));
            break;
          case "popularity.desc":
          default:
            sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            break;
        }

        setMovies(sorted);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [apiBase, filters]
  );

  const fetchDiscover = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        if (filters.genre) params.set("genre", filters.genre);
        if (filters.year) params.set("year", filters.year);
        if (filters.rating) params.set("rating", filters.rating);
        if (filters.popularity) params.set("popularity", filters.popularity);
        if (filters.language) params.set("language", filters.language);
        if (filters.actor) params.set("actor", filters.actor);
        if (filters.sort) params.set("sort", filters.sort);

        const res = await fetch(`${apiBase}/discover?${params.toString()}`);
        if (!res.ok) throw new Error("Server Error");
        const data = await res.json();
        setMovies(data.results || []);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [apiBase, filters]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      setPage((current) => {
        if (newPage < 1 || newPage > totalPages) return current;
        return newPage;
      });
      if (query) {
        if (searchMode === "movie") {
          fetchMovies(query, newPage);
        } else {
          fetchDiscover(newPage);
        }
      } else {
        fetchDiscover(newPage);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [fetchMovies, fetchDiscover, query, totalPages, searchMode]
  );

  const handleSelectMovie = useCallback((movie) => {
    setSelectedMovie(movie);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMovie(null);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setFiltersOpen((v) => !v);
  }, []);

  const loadRandomMovie = useCallback(async () => {
    setRandomLoading(true);
    setRandomError("");
    try {
      const page = Math.floor(Math.random() * 20) + 1;
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (filters.language) params.set("language", filters.language);

      const res = await fetch(`${apiBase}/discover?${params.toString()}`);
      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      const list = data.results || [];
      if (list.length === 0) {
        setRandomMovie(null);
        setRandomError("ไม่พบข้อมูล");
        return null;
      }
      const pick = list[Math.floor(Math.random() * list.length)];
      setRandomMovie(pick || null);
      return pick || null;
    } catch (err) {
      setRandomMovie(null);
      setRandomError("ไม่สามารถสุ่มได้");
      console.error(err);
      return null;
    } finally {
      setRandomLoading(false);
    }
  }, [apiBase, filters.language]);

  const handleRandomClick = useCallback(async () => {
    const pick = await loadRandomMovie();
    if (pick) setRandomOpen(true);
  }, [loadRandomMovie]);

  const handleRandomClose = useCallback(() => {
    setRandomOpen(false);
  }, []);

  useEffect(() => {
    fetchDiscover(1);
  }, [fetchDiscover]);

  useEffect(() => {
    loadRandomMovie();
  }, [loadRandomMovie]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        setPage(1);
        if (searchMode === "movie") {
          fetchMovies(query, 1);
        } else {
          setFilters((f) => ({ ...f, actor: query }));
        }
      } else if (query === "") {
        setPage(1);
        fetchDiscover(1);
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [query, fetchMovies, fetchDiscover, searchMode]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(
          `${apiBase}/genres?language=${encodeURIComponent(filters.language || "en")}`
        );
        if (!res.ok) throw new Error("Server Error");
        const data = await res.json();
        setGenres(data.genres || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGenres();
  }, [apiBase, filters.language]);

  useEffect(() => {
    if (query.trim()) return;
    const delay = setTimeout(() => {
      setPage(1);
      fetchDiscover(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [filters, fetchDiscover, query]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }
    let isActive = true;
    const delay = setTimeout(async () => {
      setSearchLoading(true);
      try {
        if (searchMode === "movie") {
          const res = await fetch(
            `${apiBase}/search?q=${encodeURIComponent(query)}&page=1`
          );
          if (!res.ok) throw new Error("Server Error");
          const data = await res.json();
          if (isActive) {
            setSearchSuggestions(
              (data.results || []).slice(0, 6).map((m) => ({
                id: m.id,
                title: m.title,
                subtitle: m.release_date || "",
              }))
            );
          }
        } else {
          const res = await fetch(
            `${apiBase}/actors?query=${encodeURIComponent(query)}&page=1`
          );
          if (!res.ok) throw new Error("Server Error");
          const data = await res.json();
          if (isActive) {
            setSearchSuggestions(
              (data.results || []).slice(0, 6).map((p) => ({
                id: p.id,
                title: p.name,
                subtitle: p.known_for_department || "",
                profile_path: p.profile_path || null,
              }))
            );
          }
        }
      } catch (err) {
        if (isActive) setSearchSuggestions([]);
        console.error(err);
      } finally {
        if (isActive) setSearchLoading(false);
      }
    }, 350);
    return () => {
      isActive = false;
      clearTimeout(delay);
    };
  }, [apiBase, query, searchMode]);

  const handlePickSuggestion = useCallback(
    (item) => {
      if (searchMode === "movie") {
        setQuery(item.title);
        fetchMovies(item.title, 1);
      } else {
        setQuery(item.title);
        setFilters((f) => ({ ...f, actor: item.title }));
      }
      setSearchSuggestions([]);
    },
    [fetchMovies, searchMode]
  );

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-black selection:text-white">
      <Navbar
        onSearch={setQuery}
        searchValue={query}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        searchSuggestions={searchSuggestions}
        searchLoading={searchLoading}
        onPickSuggestion={handlePickSuggestion}
        genres={genres}
        filters={filters}
        setFilters={setFilters}
        onRandom={handleRandomClick}
        filtersOpen={filtersOpen}
        onToggleFilters={handleToggleFilters}
      />

      <main className="w-full max-w-[1600px] mx-auto px-6 py-10">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-black tracking-tight flex items-center gap-3">
              {query ? (
                <>
                  <span className="text-gray-400 font-light">ผลลัพธ์สำหรับ</span>
                  <span className="border-b-2 border-black pb-1">"{query}"</span>
                </>
              ) : (
                <>
                  <span>ภาพยนตร์</span>
                  <span className="text-gray-300">แนะนำ</span>
                </>
              )}
            </h1>
            <p className="text-sm font-medium text-gray-400 mt-3 uppercase tracking-widest">
              หน้า {page} จาก {totalPages}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="border border-red-100 bg-red-50 text-red-600 p-6 rounded-xl text-center">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10 mb-12">
              {movies.length > 0 ? (
                movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={handleSelectMovie}
                    genreMap={genreMap}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-32 text-gray-400">
                  <span className="text-6xl mb-4 opacity-20">?</span>
                  <span className="text-lg">ไม่พบข้อมูลภาพยนตร์</span>
                </div>
              )}
            </div>

            {movies.length > 0 && totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 py-10 border-t border-gray-100">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full hover:border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-900 disabled:hover:border-gray-200 transition-all duration-300"
                >
                  <FaArrowLeft className="text-xs" />
                  <span className="text-sm font-bold">ก่อนหน้า</span>
                </button>
                <span className="text-sm font-mono text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full hover:border-black hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-900 disabled:hover:border-gray-200 transition-all duration-300"
                >
                  <span className="text-sm font-bold">ถัดไป</span>
                  <FaArrowRight className="text-xs" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={handleCloseModal}
          genreMap={genreMap}
        />
      )}

      {randomOpen && randomMovie && (
        <MovieDetailModal
          movie={randomMovie}
          onClose={handleRandomClose}
          showRandomActions
          onRandomNext={loadRandomMovie}
          genreMap={genreMap}
        />
      )}
    </div>
  );
}

export default App;
