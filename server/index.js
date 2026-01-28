const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// 🔍 search movie by title
app.get("/search", async (req, res) => {
    try {
        const { q, page = 1 } = req.query;

        if (!q) {
            return res.status(400).json({ error: "missing query" });
        }

        const response = await axios.get(
            "https://api.themoviedb.org/3/search/movie",
            {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    query: q,
                    language: "th-TH",
                    page
                }
            }
        );

        res.json({
            total: response.data.total_results,
            page: response.data.page,
            results: response.data.results.map(m => ({
                id: m.id,
                title: m.title,
                overview: m.overview,
                release_date: m.release_date,
                poster: m.poster_path
                    ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                    : null
            }))
        });

    } catch (err) {
        res.status(500).json({ error: "tmdb error" });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
