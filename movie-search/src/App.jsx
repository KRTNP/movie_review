import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import MovieDetailModal from "./components/MovieDetailModal"; // Import มาใช้

function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Modal State (เก็บแค่หนังที่เลือกก็พอ)
  const [selectedMovie, setSelectedMovie] = useState(null);

  const fetchMovies = async (searchTerm, pageNum = 1) => {
    if (!searchTerm) return;
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(
        `http://localhost:8080/search?q=${encodeURIComponent(searchTerm)}&page=${pageNum}`
      );
      if (!res.ok) throw new Error("Server Error");
      
      const data = await res.json();
      setMovies(data.results || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError("ไม่สามารถดึงข้อมูลได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination Logic
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchMovies(query || "Marvel", newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchMovies("Marvel", 1);
  }, []);

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
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      <Navbar onSearch={setQuery} searchValue={query} />

      <main className="w-full px-6 py-8">
        
        <div className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {query ? (
                <><span>🔍 ผลการค้นหา:</span><span className="text-indigo-600">"{query}"</span></>
                ) : (
                <><span>★</span><span>Recommended Movies</span></>
                )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                หน้า {page} จาก {totalPages}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">{error}</div>
        ) : (
            <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-6 mb-8">
                    {movies.length > 0 ? (
                        movies.map((movie) => (
                            <MovieCard 
                                key={movie.id} 
                                movie={movie} 
                                onClick={(m) => setSelectedMovie(m)} // คลิกแล้วส่งหนังไปเก็บใน State
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-400">ไม่พบข้อมูล</div>
                    )}
                </div>

                {/* ปุ่มเลื่อนหน้า (Pagination) */}
                {movies.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 py-6 border-t border-gray-200">
                        <button 
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            ← ก่อนหน้า
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                            {page} / {totalPages}
                        </span>
                        <button 
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            ถัดไป →
                        </button>
                    </div>
                )}
            </>
        )}
      </main>

      {/* เรียกใช้ Modal (ถ้ามี selectedMovie) */}
      {selectedMovie && (
        <MovieDetailModal 
            movie={selectedMovie} 
            onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  );
}

export default App;