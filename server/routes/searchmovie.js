const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/search", async (req, res) => {
    try {
        const { q, page = 1, featured } = req.query;

        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ error: "Missing TMDB_API_KEY" });
        }

        if (!q && featured !== "1") {
            return res.status(400).json({ error: "missing query" });
        }

        const safePage = Math.max(1, Number(page) || 1);

        const endpoint = featured === "1"
            ? "https://api.themoviedb.org/3/movie/popular"
            : "https://api.themoviedb.org/3/search/movie";

        const params = {
            api_key: process.env.TMDB_API_KEY,
            page: safePage,
            language: "en-US",
            include_adult: false
        };

        if (featured !== "1") {
            params.query = q;
        }

        const tmdbRes = await axios.get(endpoint, { params });

        const data = tmdbRes.data;

        res.json({
            query: q || "",
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

router.get("/discover", async (req, res) => {
    try {
        const { page = 1, genre, year, rating, popularity, language, actor, sort } = req.query;

        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ error: "Missing TMDB_API_KEY" });
        }

        const safePage = Math.max(1, Number(page) || 1);
        const params = {
            api_key: process.env.TMDB_API_KEY,
            page: safePage,
            language: "en-US",
            include_adult: false,
            sort_by: sort || "popularity.desc"
        };

        if (genre) params.with_genres = genre;
        if (year) params.primary_release_year = year;
        if (rating) params["vote_average.gte"] = rating;
        if (popularity) params["popularity.gte"] = popularity;
        if (language) params.with_original_language = language;

        if (actor) {
            try {
                const personRes = await axios.get(
                    "https://api.themoviedb.org/3/search/person",
                    {
                        params: {
                            api_key: process.env.TMDB_API_KEY,
                            query: actor,
                            page: 1,
                            include_adult: false,
                            language: "en-US"
                        }
                    }
                );
                const person = personRes.data?.results?.[0];
                if (person?.id) {
                    params.with_cast = String(person.id);
                }
            } catch (err) {
                console.error("TMDB PERSON SEARCH ERROR:", err.message);
            }
        }

        const tmdbRes = await axios.get(
            "https://api.themoviedb.org/3/discover/movie",
            { params }
        );

        const data = tmdbRes.data;

        res.json({
            query: "",
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
        console.error("TMDB DISCOVER ERROR:", err.message);
        res.status(500).json({ error: "tmdb error" });
    }
});

router.get("/genres", async (req, res) => {
    try {
        const { language = "en" } = req.query;
        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ error: "Missing TMDB_API_KEY" });
        }
        const lang = language.length === 2 ? `${language}-US` : language;
        const tmdbRes = await axios.get(
            "https://api.themoviedb.org/3/genre/movie/list",
            { params: { api_key: process.env.TMDB_API_KEY, language: lang } }
        );

        res.json({ genres: tmdbRes.data.genres || [] });
    } catch (err) {
        console.error("TMDB GENRES ERROR:", err.message);
        res.status(500).json({ error: "tmdb error" });
    }
});

router.get("/actors", async (req, res) => {
    try {
        const { query, page = 1 } = req.query;
        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ error: "Missing TMDB_API_KEY" });
        }
        if (!query) {
            return res.status(400).json({ error: "missing query" });
        }
        const safePage = Math.max(1, Number(page) || 1);
        const tmdbRes = await axios.get(
            "https://api.themoviedb.org/3/search/person",
            {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    query,
                    page: safePage,
                    include_adult: false,
                    language: "en-US"
                }
            }
        );

        const data = tmdbRes.data;
        res.json({
            query,
            page: data.page,
            totalPages: data.total_pages,
            totalResults: data.total_results,
            results: (data.results || []).map(p => ({
                id: p.id,
                name: p.name,
                known_for_department: p.known_for_department,
                profile_path: p.profile_path
            }))
        });
    } catch (err) {
        console.error("TMDB ACTORS ERROR:", err.message);
        res.status(500).json({ error: "tmdb error" });
    }
});

module.exports = router;
