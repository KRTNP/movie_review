const express = require("express")
const router = express.Router()
const axios = require("axios")
const { searchYoutubeVideos, fetchYoutubeComments } = require("../services/youtube.service")

async function fetchTmdbReviews(movieId) {
    let page = 1
    let totalPages = 1
    let reviews = []

    do {
        const r = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}/reviews`,
            {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    language: "en-US",
                    page
                }
            }
        )

        reviews.push(...r.data.results)
        totalPages = r.data.total_pages
        page++
    } while (page <= totalPages)

    return reviews.filter(r => r.content && r.content.length > 20)
}

async function fetchTmdbTitle(movieId) {
    const { data } = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}`,
        { params: { api_key: process.env.TMDB_API_KEY, language: "en-US" } }
    )
    return data?.title || data?.original_title || ""
}

function isLikelyEnglish(text) {
    if (!text) return false
    const letters = (text.match(/[A-Za-z]/g) || []).length
    const nonLatin = (text.match(/[^\x00-\x7F]/g) || []).length
    const total = text.length || 1
    const letterRatio = letters / total
    const nonLatinRatio = nonLatin / total
    return letterRatio >= 0.3 && nonLatinRatio <= 0.2
}

router.get("/analyze/:movieId", async (req, res) => {
    try {
        const { movieId } = req.params
        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ error: "Missing TMDB_API_KEY" })
        }

        // 1) fetch TMDB data
        const [reviews, title] = await Promise.all([
            fetchTmdbReviews(movieId),
            fetchTmdbTitle(movieId),
        ])

        let youtubeComments = []
        let youtubeVideoId = null
        let youtubeQuery = null

        if (process.env.YOUTUBE_API_KEY && title) {
            try {
                youtubeQuery = `${title} official trailer`
                const results = await searchYoutubeVideos(youtubeQuery, 1)
                const first = results[0]
                if (first?.videoId) {
                    youtubeVideoId = first.videoId
                    youtubeComments = await fetchYoutubeComments(first.videoId, 200)
                }
            } catch (err) {
                console.error("YOUTUBE ERROR:", err.message)
            }
        }

        const source = youtubeComments.length > 0 ? "TMDB+YouTube" : "TMDB"

        if (reviews.length === 0 && youtubeComments.length === 0) {
            return res.json({
                source,
                totalReviews: 0,
                summary: "no data",
                stats: {},
                reviews: []
            })
        }

        const tmdbItems = reviews.map(r => ({
            source: "TMDB",
            author: r.author,
            content: r.content,
        })).filter(r => isLikelyEnglish(r.content))

        const youtubeItems = youtubeComments.map(c => ({
            source: "YouTube",
            author: c.author,
            content: c.text,
        })).filter(r => isLikelyEnglish(r.content))

        const allItems = [...tmdbItems, ...youtubeItems]

        if (allItems.length === 0) {
            return res.json({
                source,
                totalReviews: 0,
                summary: "no data",
                stats: {},
                reviews: []
            })
        }

        // 2) sentiment model
        const sentimentRes = await axios.post(
            "http://127.0.0.1:8000/predict_batch",
            {
                texts: allItems.map(r => r.content)
            },
            { timeout: 60_000 }
        )

        const sentiments = sentimentRes.data

        // 3) merge + count
        let positive = 0
        let negative = 0
        let neutral = 0

        const merged = allItems.map((r, i) => {
            const label = sentiments[i].label.toLowerCase()

            if (label === "positive") positive++
            else if (label === "negative") negative++
            else neutral++

            return {
                source: r.source,
                author: r.author,
                content: r.content,
                sentiment: label,
                confidence: sentiments[i].max_prob
            }
        })

        const tmdbLabeled = merged.filter(r => r.source === "TMDB")
        const youtubeLabeled = merged.filter(r => r.source === "YouTube")

        const total = merged.length

        const stats = {
            positive,
            negative,
            neutral,
            positivePercent: +(positive / total * 100).toFixed(2),
            negativePercent: +(negative / total * 100).toFixed(2),
            neutralPercent: +(neutral / total * 100).toFixed(2)
        }

        // 4) summary
        let summary = "mixed"

        if (
            stats.positive > stats.negative &&
            stats.positive > stats.neutral
        ) {
            summary = "positive";
        }

        if (
            stats.negative > stats.positive &&
            stats.negative > stats.neutral
        ) {
            summary = "negative";
        }

        if (
            stats.neutral > stats.positive &&
            stats.neutral > stats.negative
        ) {
            summary = "neutral";
        }

        if (stats.positivePercent >= 60) summary = "positive";
        else if (stats.negativePercent >= 60) summary = "negative";

        // 5) response
        res.json({
            source,
            totalReviews: total,
            summary,
            stats,
            sources: {
                tmdbCount: tmdbItems.length,
                youtubeCount: youtubeItems.length,
                youtubeVideoId,
                youtubeQuery,
            },
            reviews: merged,
            tmdbReviews: tmdbLabeled,
            youtubeComments: youtubeLabeled
        })

    } catch (err) {
        console.error("ANALYZE ERROR:", err.message)
        if (err.response) {
            console.error("Response data:", err.response.data)
        }
        if (err.code == "ECONNREFUSED") {
            return res.status(502).json({ error: "Sentiment service unavailable" })
        }
        res.status(500).json({ error: "Analyze failed" })
    }
})

module.exports = router
