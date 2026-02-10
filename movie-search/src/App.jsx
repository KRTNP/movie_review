import { useState, useEffect, useCallback } from "react";
import { FaStar } from "react-icons/fa6";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import MovieDetailModal from "./components/MovieDetailModal";

function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedMovie, setSelectedMovie] = useState(null);

  const apiBase =
    import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") ||
    "http://localhost:8080";

  const fetchMovies = useCallback(
    async (searchTerm, pageNum = 1) => {
      if (!searchTerm) return;
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `${apiBase}/search?q=${encodeURIComponent(
            searchTerm
          )}&page=${pageNum}`
        );
        if (!res.ok) throw new Error("Server Error");

        const data = await res.json();
        setMovies(data.results || []);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        // แก้ไข 1: ข้อความ Error
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [apiBase]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      setPage((current) => {
        if (newPage < 1 || newPage > totalPages) return current;
        return newPage;
      });
      fetchMovies(query || "Marvel", newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [fetchMovies, query, totalPages]
  );

  const handleSelectMovie = useCallback((movie) => {
    setSelectedMovie(movie);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMovie(null);
  }, []);

  useEffect(() => {
    fetchMovies("Marvel", 1);
  }, [fetchMovies]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        setPage(1);
        fetchMovies(query, 1);
      } else if (query === "") {
        setPage(1);
        fetchMovies("Marvel", 1);
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [query, fetchMovies]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar onSearch={setQuery} searchValue={query} />

      <main className="w-full px-6 py-8">
        <div className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              {query ? (
                <>
                  {/* แก้ไข 2: หัวข้อผลการค้นหา */}
                  <span>ผลการค้นหาสำหรับ:</span>
                  <span className="text-indigo-600">"{query}"</span>
                </>
              ) : (
                <>
                  <FaStar className="text-yellow-500" aria-hidden="true" />
                  {/* แก้ไข 3: หัวข้อหน้าแรก */}
                  <span>ภาพยนตร์แนะนำ</span>
                </>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {/* แก้ไข 4: เลขหน้า */}
              หน้า {page} จาก {totalPages}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-6 mb-8">
              {movies.length > 0 ? (
                movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={handleSelectMovie}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20 text-gray-400">
                  {/* แก้ไข 5: กรณีไม่พบข้อมูล */}
                  ไม่พบข้อมูลภาพยนตร์ที่คุณค้นหา
                </div>
              )}
            </div>

            {movies.length > 0 && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-6 border-t border-gray-200">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  {/* แก้ไข 6: ปุ่มย้อนกลับ */}
                  ก่อนหน้า
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  {/* แก้ไข 7: ปุ่มถัดไป */}
                  ถัดไป
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
        />
      )}
    </div>
  );
}

export default App;
