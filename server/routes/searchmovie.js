const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/search", async (req, res) => {
    try {
        const { q, page = 1 } = req.query;

        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ error: "Missing TMDB_API_KEY" });
        }

        if (!q) {
            return res.status(400).json({ error: "missing query" });
        }

        const safePage = Math.max(1, Number(page) || 1);

        const tmdbRes = await axios.get(
            "https://api.themoviedb.org/3/search/movie",
            {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    query: q,
                    page: safePage,
                    language: "en-US",
                    include_adult: false
                }
            }
        );

        const data = tmdbRes.data;

        res.json({
            query: q,
            page: data.page,
            totalPages: data.total_pages,
            totalResults: data.total_results,

            hasNext: data.page < data.total_pages,
            hasPrev: data.page > 1,

            results: data.results.map(m => ({
                id: m.id,
                title: m.title,
                original_title: m.original_title,
                overview: m.overview,
                release_date: m.release_date,
                poster_path: m.poster_path,
                backdrop_path: m.backdrop_path,
                vote_average: m.vote_average,
                vote_count: m.vote_count,
                popularity: m.popularity,
                genre_ids: m.genre_ids
            }))
        });

    } catch (err) {
        console.error("TMDB SEARCH ERROR:", err.message);
        res.status(500).json({ error: "tmdb error" });
    }
});

module.exports = router;
