const axios = require("axios")

const BASE_URL = "https://www.googleapis.com/youtube/v3"
const getApiKey = () => process.env.YOUTUBE_API_KEY

function buildYoutubeError(err, context) {
    const status = err.response?.status
    const reason = err.response?.data?.error?.errors?.[0]?.reason
    const message = err.response?.data?.error?.message || err.message
    const detail = `[YouTube ${context}] ${status || "no-status"}${reason ? ` ${reason}` : ""} - ${message}`
    const e = new Error(detail)
    e.status = status
    e.reason = reason
    e.details = err.response?.data
    return e
}


async function searchYoutubeVideos(query, maxResults = 1) {
    const API_KEY = getApiKey()
    if (!API_KEY) {
        throw new Error("Missing YOUTUBE_API_KEY")
    }
    if (!query) {
        return []
    }

    let res
    try {
        res = await axios.get(`${BASE_URL}/search`, {
            params: {
                part: "snippet",
                q: query,
                type: "video",
                maxResults: Math.min(Math.max(Number(maxResults) || 1, 1), 5),
                key: API_KEY,
            },
            timeout: 10_000,
        })
    } catch (err) {
        throw buildYoutubeError(err, "search")
    }

    return (res.data.items || []).map(item => ({
        videoId: item.id?.videoId,
        title: item.snippet?.title,
        channelTitle: item.snippet?.channelTitle,
        publishedAt: item.snippet?.publishedAt,
        thumbnails: item.snippet?.thumbnails,
    })).filter(v => v.videoId)
}

async function fetchYoutubeComments(videoId, limit = 200) {
    const API_KEY = getApiKey()
    if (!API_KEY) {
        throw new Error("Missing YOUTUBE_API_KEY")
    }
    let comments = []
    let nextPageToken = null

    while (comments.length < limit) {
        let res
        try {
            res = await axios.get(`${BASE_URL}/commentThreads`, {
                params: {
                    part: "snippet",
                    videoId,
                    maxResults: 100,
                    pageToken: nextPageToken,
                    key: API_KEY,
                },
                timeout: 10_000,
            })
        } catch (err) {
            throw buildYoutubeError(err, "commentThreads")
        }

        res.data.items.forEach(item => {
            const c = item.snippet.topLevelComment.snippet
            comments.push({
                source: "youtube",
                videoId,
                commentId: item.id,
                text: c.textOriginal,
                author: c.authorDisplayName,
                likeCount: c.likeCount,
                publishedAt: c.publishedAt,
                replyCount: item.snippet.totalReplyCount,
            })
        })

        nextPageToken = res.data.nextPageToken
        if (!nextPageToken) break
    }

    return comments.slice(0, limit)
}

module.exports = {
    fetchYoutubeComments,
    searchYoutubeVideos,
    checkYoutubeApi: async function checkYoutubeApi(videoId) {
        const API_KEY = getApiKey()
        if (!API_KEY) {
            throw new Error("Missing YOUTUBE_API_KEY")
        }
        if (!videoId) {
            return { ok: true, note: "No videoId provided; API key present" }
        }

        try {
            const res = await axios.get(`${BASE_URL}/videos`, {
                params: {
                    part: "snippet",
                    id: videoId,
                    key: API_KEY,
                },
                timeout: 10_000,
            })

            const found = Array.isArray(res.data?.items) && res.data.items.length > 0
            return {
                ok: true,
                found,
                status: res.status,
            }
        } catch (err) {
            return {
                ok: false,
                status: err.response?.status,
                error: err.response?.data || err.message,
            }
        }
    },
}
