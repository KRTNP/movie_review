"use client"; // จำเป็นสำหรับ Next.js App Router เมื่อใช้ useState/useEffect

import { useState, useEffect } from 'react';
import MovieCard from './Components/MovieCard'; // สมมติว่าแยก Component การ์ดไว้ตามข้อก่อนหน้า

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // ใส่ API Key 
  const API_KEY = '0c29bab2ad22f3957b2f454ea9722d4d';
  const API_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`;

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setMovies(data.results); // TMDB เก็บข้อมูลหนังไว้ใน array ชื่อ results
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []); // [] ว่างเพื่อให้รันแค่ครั้งเดียวตอนเปิดหน้าเว็บ

  return (
    <div className="bg-black text-white font-sans antialiased min-h-screen">

      {/* Navbar (ย่อไว้) */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-600">
          Nhang Dee Mai?
        </h1>
        {/* ...ส่วนเมนูอื่นๆ... */}
      </nav>

      <main className="pl-6 py-8 md:pl-12">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-6 w-1 bg-yellow-500 rounded-full"></div>
            <h2 className="text-2xl font-bold">Top picks</h2>
          </div>
          <p className="text-gray-400 text-sm">Popular movies just for you</p>
        </div>

        {/* Container การแสดงผล */}
        <div className="flex overflow-x-auto gap-4 pb-8 no-scrollbar pr-6">

          {loading ? (
            <div className="text-gray-500 p-4">Loading movies...</div>
          ) : (
            // ✅ จุดที่ทำการวนลูป (Loop)
            movies.length > 0 ? (
              movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))
            ) : (
              <div>No movies found</div>
            )
          )}

        </div>
      </main>
    </div>
  );
}

export default App;