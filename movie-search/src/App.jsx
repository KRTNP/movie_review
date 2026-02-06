import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";

function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMovies = async (searchTerm) => {
    if (!searchTerm) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:8080/search?q=${encodeURIComponent(searchTerm)}`
      );
      if (!res.ok) throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      const data = await res.json();
      setMovies(data.results || []);
    } catch (err) {
      setError("ไม่สามารถดึงข้อมูลได้ (ตรวจสอบว่า Server เปิดอยู่หรือไม่)");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies("Marvel"); 
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        fetchMovies(query);
      } else if (query === "") {
        fetchMovies("Marvel");
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      <Navbar onSearch={setQuery} searchValue={query} />

      {/* แก้ตรงนี้: เปลี่ยน max-w-7xl mx-auto เป็น w-full และเพิ่ม px-6 */}
      <main className="w-full px-6 py-8">
        
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            {query ? (
              <>
                <span>🔍 ผลการค้นหา:</span>
                <span className="text-indigo-600">"{query}"</span>
              </>
            ) : (
              <>
                <span className="text-yellow-500">★</span>
                <span>Recommended Movies</span>
                <span className="text-gray-400 text-lg font-normal ml-2">
                  (หนังแนะนำ)
                </span>
              </>
            )}
          </h1>
        </div>

        {loading && (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center mb-6">
                {error}
            </div>
        )}

        {!loading && !error && (
            /* ปรับ Grid ให้ยืดหยุ่นขึ้น สำหรับจอใหญ่มากๆ */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-6">
                {movies.length > 0 ? (
                    movies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        ไม่พบข้อมูลภาพยนตร์
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
}

export default App;