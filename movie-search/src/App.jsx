import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchMovie = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setMovies([]);

    try {
      const res = await fetch(
        `http://localhost:8080/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setMovies(data.results || []);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>🎬 Movie Search</h1>

      <div style={styles.searchBox}>
        <input
          type="text"
          placeholder="พิมพ์ชื่อหนัง..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchMovie()}
          style={styles.input}
        />
        <button onClick={searchMovie} style={styles.button}>
          ค้นหา
        </button>
      </div>

      {loading && <p>กำลังค้นหา...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={styles.grid}>
        {movies.map((m) => (
          <div key={m.id} style={styles.card}>
            {m.poster ? (
              <img src={m.poster} alt={m.title} style={styles.poster} />
            ) : (
              <div style={styles.noPoster}>No Image</div>
            )}
            <h3>{m.title}</h3>
            <small>{m.release_date}</small>
            <p style={styles.overview}>{m.overview}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "sans-serif",
    padding: 20,
    maxWidth: 1200,
    margin: "auto",
  },
  searchBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  button: {
    padding: "10px 20px",
    fontSize: 16,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16,
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 10,
  },
  poster: {
    width: "100%",
    borderRadius: 6,
  },
  noPoster: {
    height: 300,
    background: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  overview: {
    fontSize: 14,
    maxHeight: 80,
    overflow: "hidden",
  },
};

export default App;
