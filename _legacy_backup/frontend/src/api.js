const API = "http://localhost:8000"

export const api = {
    getMe: (token) =>
        fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : null),

    getCompetitions: () =>
        fetch(`${API}/competitions`).then(r => r.json()),

    getMyCompetitions: (token) =>
        fetch(`${API}/competitions/my`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),

    getCompetition: id =>
        fetch(`${API}/competitions/${id}`).then(r => r.json()),

    login: (email, password) =>
        fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ username: email, password })
        }).then(async r => {
            if (!r.ok) {
                const err = await r.json().catch(() => ({}))
                throw new Error(err.detail || "Login failed")
            }
            return r.json()
        }),


    register: (email, name, password) =>
        fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name, password })
        }).then(async r => {
            if (!r.ok) {
                const err = await r.json().catch(() => ({}))
                throw new Error(err.detail || "Register failed")
            }
            return r.json()
        }),

    createCompetition: (formData, token) =>
        fetch(`${API}/competitions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                // Content-Type is auto-set for FormData
            },
            body: formData
        }).then(r => r.json()),

    submit: (cid, file, token) => {
        const f = new FormData()
        f.append("file", file)
        return fetch(`${API}/competitions/${cid}/submit`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: f
        }).then(r => r.json())
    },

    leaderboard: cid =>
        fetch(`${API}/competitions/${cid}/leaderboard`).then(r => r.json()),

    getMySubmissions: (cid, token) =>
        fetch(`${API}/competitions/${cid}/my_submissions`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),

    getFileUrl: path => `${API}/${path}`,

    updateCompetition: (id, formData, token) =>
        fetch(`${API}/competitions/${id}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        }).then(r => r.json()),

    deleteCompetition: (id, token) =>
        fetch(`${API}/competitions/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()),

    getCompetitionFiles: id =>
        fetch(`${API}/competitions/${id}/files`).then(r => r.json()),
}