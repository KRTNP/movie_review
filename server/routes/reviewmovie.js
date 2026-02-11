const express = require("express")
const router = express.Router()
const axios = require("axios")
const { searchYoutubeVideos, fetchYoutubeComments } = require("../services/youtube.service")
const SENTIMENT_URL = process.env.SENTIMENT_API_URL || "https://mini-project-afyj.onrender.com/predict_batch"

const ANALYSIS_TTL_MS = Number(process.env.ANALYSIS_TTL_MS || 30 * 60 * 1000)
const analysisCache = new Map()
const ANALYSIS_MAX_ITEMS = Number(process.env.ANALYSIS_MAX_ITEMS || 200)
const ANALYSIS_MAX_CHARS = Number(process.env.ANALYSIS_MAX_CHARS || 500)
const MODEL_META_TTL_MS = Number(process.env.MODEL_META_TTL_MS || 5 * 60 * 1000)
let modelMetaCache = { at: 0, data: null }

function getCachedAnalysis(key) {
    const cached = analysisCache.get(key)
    if (!cached) return null
    if (cached.expiresAt < Date.now()) {
        analysisCache.delete(key)
        return null
    }
    return cached.data
}

function setCachedAnalysis(key, data) {
    analysisCache.set(key, {
        data,
        expiresAt: Date.now() + ANALYSIS_TTL_MS
    })
}

function trimText(text) {
    if (!text) return ""
    if (text.length <= ANALYSIS_MAX_CHARS) return text
    return text.slice(0, ANALYSIS_MAX_CHARS)
}

function getSentimentBaseUrl() {
    return SENTIMENT_URL.replace(/\/predict_batch$/i, "").replace(/\/predict\/batch$/i, "").replace(/\/predict$/i, "")
}

async function getModelMeta() {
    if (modelMetaCache.data && Date.now() - modelMetaCache.at < MODEL_META_TTL_MS) {
        return modelMetaCache.data
    }
    try {
        const base = getSentimentBaseUrl()
        const { data } = await axios.get(`${base}/health`, { timeout: 8_000 })
        const meta = {
            modelVersion: data?.version || data?.model_source || data?.model_dir || "unknown",
            modelLoaded: data?.model_loaded ?? null
        }
        modelMetaCache = { at: Date.now(), data: meta }
        return meta
    } catch (err) {
        return { modelVersion: "unknown", modelLoaded: null }
    }
}

async function analyzeSentiments(texts) {
    if (!texts.length) return []
    const isBatch = /predict_batch|\/predict\/batch$/i.test(SENTIMENT_URL)

    if (isBatch) {
        const res = await axios.post(
            SENTIMENT_URL,
            { texts },
            { timeout: 60_000 }
        )
        if (Array.isArray(res.data)) return res.data
        if (Array.isArray(res.data?.results)) return res.data.results
        return []
    }

    // Single-item API fallback: send one by one and normalize to batch shape
    const results = await Promise.all(
        texts.map(async (text) => {
            const res = await axios.post(
                SENTIMENT_URL,
                { text },
                { timeout: 60_000 }
            )
            return res.data
        })
    )

    return results.map((item, idx) => ({
        text: item.text ?? texts[idx],
        label: item.label ?? item.sentiment ?? "neutral",
        max_prob: item.confidence ?? item.max_prob ?? 0,
        probs: item.probabilities ?? item.probs ?? undefined
    }))
}

const MIN_TMDB_LENGTH = 60
const MIN_YT_LENGTH = 40
const YT_MIN_LIKES = 1

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

    return reviews.filter(r => r.content && r.content.length >= MIN_TMDB_LENGTH)
}

async function fetchTmdbTitle(movieId) {
    const { data } = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}`,
        { params: { api_key: process.env.TMDB_API_KEY, language: "en-US" } }
    )
    return data?.title || data?.original_title || ""
}

async function fetchRandomTmdbReviews(targetCount = 5) {
    const reviews = []
    const seen = new Set()
    let attempts = 0
    const maxAttempts = 8

    while (reviews.length < targetCount && attempts < maxAttempts) {
        attempts++
        const randomPage = Math.floor(Math.random() * 50) + 1
        const listRes = await axios.get(
            "https://api.themoviedb.org/3/movie/popular",
            {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    language: "en-US",
                    page: randomPage
                }
            }
        )

        const movies = listRes.data?.results || []
        for (const m of movies) {
            if (reviews.length >= targetCount) break
            if (!m?.id) continue
            if (seen.has(m.id)) continue
            seen.add(m.id)

            const movieReviews = await fetchTmdbReviews(m.id)
            if (!movieReviews.length) continue

            const picked = movieReviews
                .filter(r => isLikelyEnglish(r.content))
                .filter(r => r.content.length >= MIN_TMDB_LENGTH)
                .slice(0, 1)

            if (!picked.length) continue

            reviews.push({
                movieId: m.id,
                movieTitle: m.title || m.original_title || "",
                author: picked[0].author,
                content: picked[0].content
            })
        }
    }

    return reviews.slice(0, targetCount)
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

        const cacheKey = `movie:${movieId}`
        const cached = getCachedAnalysis(cacheKey)
        if (cached) {
            return res.json(cached)
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
                youtubeQuery = `${title} movie`
                const results = await searchYoutubeVideos(youtubeQuery, 5)
                const seen = new Set()
                const maxTotal = 400
                for (const video of results) {
                    if (!video?.videoId) continue
                    if (!youtubeVideoId) youtubeVideoId = video.videoId
                    const remaining = maxTotal - youtubeComments.length
                    if (remaining <= 0) break
                    const batch = await fetchYoutubeComments(video.videoId, Math.min(200, remaining))
                    batch.forEach(c => {
                        if (!seen.has(c.commentId)) {
                            seen.add(c.commentId)
                            youtubeComments.push(c)
                        }
                    })
                }
            } catch (err) {
                console.error("YOUTUBE ERROR:", err.message)
            }
        }

        const source = youtubeComments.length > 0 ? "TMDB+YouTube" : "TMDB"

        if (reviews.length === 0 && youtubeComments.length === 0) {
            const emptyResponse = {
                source,
                totalReviews: 0,
                summary: "no data",
                stats: {},
                reviews: []
            }
            setCachedAnalysis(cacheKey, emptyResponse)
            return res.json(emptyResponse)
        }

        const tmdbItems = reviews.map(r => ({
            source: "TMDB",
            author: r.author,
            content: trimText(r.content),
        })).filter(r => isLikelyEnglish(r.content))

        const youtubeItems = youtubeComments.map(c => ({
            source: "YouTube",
            author: c.author,
            content: trimText(c.text),
            likeCount: c.likeCount || 0,
        }))
            .filter(r => isLikelyEnglish(r.content))
            .filter(r => r.content.length >= MIN_YT_LENGTH)
            .filter(r => r.likeCount >= YT_MIN_LIKES)

        const allItems = [...tmdbItems, ...youtubeItems].slice(0, ANALYSIS_MAX_ITEMS)

        if (allItems.length === 0) {
            const emptyResponse = {
                source,
                totalReviews: 0,
                summary: "no data",
                stats: {},
                reviews: []
            }
            setCachedAnalysis(cacheKey, emptyResponse)
            return res.json(emptyResponse)
        }

        // 2) sentiment model
        const sentiments = await analyzeSentiments(allItems.map(r => r.content))
        if (!Array.isArray(sentiments) || sentiments.length === 0) {
            const e = new Error("Sentiment service returned no results")
            e.code = "SENTIMENT_EMPTY"
            throw e
        }
        if (sentiments.length !== allItems.length) {
            const e = new Error("Sentiment results length mismatch")
            e.code = "SENTIMENT_MISMATCH"
            throw e
        }

        // 3) merge + count
        let positive = 0
        let negative = 0
        let neutral = 0

        const merged = allItems.map((r, i) => {
            const label = (sentiments[i].label || "neutral").toLowerCase()

            if (label === "positive") positive++
            else if (label === "negative") negative++
            else neutral++

            return {
                source: r.source,
                author: r.author,
                content: r.content,
                sentiment: label,
                confidence: sentiments[i].max_prob,
                likeCount: r.likeCount || 0
            }
        })

        const tmdbLabeled = merged
            .filter(r => r.source === "TMDB")
            .sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0))

        const youtubeLabeled = merged
            .filter(r => r.source === "YouTube")
            .sort((a, b) => {
                const likeDiff = (b.likeCount || 0) - (a.likeCount || 0)
                if (likeDiff !== 0) return likeDiff
                return (b.content?.length || 0) - (a.content?.length || 0)
            })

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
        const payload = {
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
        }

        setCachedAnalysis(cacheKey, payload)
        res.json(payload)

    } catch (err) {
        console.error("ANALYZE ERROR:", err.message)
        if (err.response) {
            console.error("Response data:", err.response.data)
        }
        const upstreamStatus = err.response?.status
        const isSentimentFailure =
            err.code === "ECONNREFUSED" ||
            err.code === "ECONNABORTED" ||
            err.code === "SENTIMENT_EMPTY" ||
            err.code === "SENTIMENT_MISMATCH" ||
            [502, 503, 504].includes(upstreamStatus) ||
            String(err.config?.url || "").includes("predict")

        if (isSentimentFailure) {
            return res.status(502).json({ error: "Sentiment service unavailable" })
        }

        res.status(500).json({ error: "Analyze failed" })
    }
})

router.post("/sentiment/test", async (req, res) => {
    try {
        const text = String(req.body?.text || "").trim()
        if (!text) {
            return res.status(400).json({ error: "Missing text" })
        }

        const startedAt = Date.now()
        const results = await analyzeSentiments([trimText(text)])
        if (!Array.isArray(results) || results.length === 0) {
            return res.status(502).json({ error: "Sentiment service unavailable" })
        }
        const modelMeta = await getModelMeta()

        const item = results[0]
        return res.json({
            text,
            label: item.label,
            probabilities: item.probabilities || item.probs || null,
            confidence: item.confidence ?? item.max_prob ?? null,
            latencyMs: Date.now() - startedAt,
            modelVersion: modelMeta.modelVersion,
            modelLoaded: modelMeta.modelLoaded
        })
    } catch (err) {
        console.error("SENTIMENT TEST ERROR:", err.message)
        return res.status(500).json({ error: "Sentiment test failed" })
    }
})

router.get("/reviews/random", async (req, res) => {
    try {
        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ error: "Missing TMDB_API_KEY" })
        }
        const count = Math.min(Math.max(Number(req.query.count) || 5, 3), 5)
        const data = await fetchRandomTmdbReviews(count)
        res.json({ count: data.length, reviews: data })
    } catch (err) {
        console.error("RANDOM REVIEWS ERROR:", err.message)
        res.status(500).json({ error: "Random reviews failed" })
    }
})

module.exports = router
