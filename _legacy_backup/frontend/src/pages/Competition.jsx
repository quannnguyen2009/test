import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { api } from "../api"
import Latex from "../components/Latex"
import { Download, Upload, Clock, User as UserIcon } from "lucide-react"

import { Edit2 } from "lucide-react"

export default function Competition() {
    const { id } = useParams()
    const [data, setData] = useState(null) // { competition, host }
    const [user, setUser] = useState(null)
    const [tab, setTab] = useState("overview")

    useEffect(() => {
        api.getCompetition(id).then(setData)
        const token = localStorage.getItem("token")
        if (token) api.getMe(token).then(setUser)
    }, [id])

    if (!data) return <div className="p-10 text-center">Loading...</div>

    const { competition: c, host } = data
    const isHost = user && c.host_id === user.id

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "data", label: "Data" },
        { id: "leaderboard", label: "Leaderboard" },
        { id: "submissions", label: "My Submissions" },
    ]

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Header Banner */}
            <div className="bg-black text-white pt-24 pb-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-start">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">{c.title}</h1>
                    </div>
                    <p className="text-lg text-gray-300 max-w-2xl text-balance">{c.subtitle}</p>

                    <div className="flex gap-6 mt-8 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <UserIcon size={16} /> Hosted by {host}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            {c.start_date && c.end_date ? (
                                <Timeline start={c.start_date} end={c.end_date} text={c.timeline} />
                            ) : (
                                <span>{c.timeline || "Ongoing"}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="border-b bg-white sticky top-16 z-40">
                <div className="max-w-6xl mx-auto px-6 overflow-x-auto">
                    <div className="flex gap-6">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.id ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {tab === "overview" && <OverviewTab c={c} />}
                    {tab === "data" && <DataTab c={c} />}
                    {tab === "leaderboard" && <LeaderboardTab cid={c.id} />}
                    {tab === "submissions" && <SubmissionsTab cid={c.id} />}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Submission</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Make sure your file matches the submission format.
                            Limit: {c.submission_limit} per day.
                        </p>
                        <SubmitWidget cid={c.id} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function OverviewTab({ c }) {
    const [content, setContent] = useState("Loading description...")

    useEffect(() => {
        if (c.description_path) {
            fetch(api.getFileUrl(c.description_path)).then(r => r.text()).then(setContent)
        } else {
            setContent("No description provided.")
        }
    }, [c])

    return (
        <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <Latex content={content} />
        </div>
    )
}

function DataTab({ c }) {
    const [content, setContent] = useState("Loading data description...")
    const [files, setFiles] = useState([])

    useEffect(() => {
        if (c.data_description_path) {
            fetch(api.getFileUrl(c.data_description_path)).then(r => r.text()).then(setContent)
        } else {
            setContent("No data description.")
        }

        // Fetch file list
        api.getCompetitionFiles(c.id)
            .then(res => {
                if (Array.isArray(res)) setFiles(res)
                else console.error("Invalid files response", res)
            })
            .catch(err => console.error("Failed to load files", err))
    }, [c])

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Data Description</h2>
                <Latex content={content} />
            </div>

            <div>
                <h3 className="font-semibold mb-4">Dataset Files</h3>
                <div className="space-y-3">
                    {files.map(f => (
                        <div key={f.name || f.path} className="bg-gray-50 p-4 rounded-lg border flex items-center justify-between">
                            <span className="text-sm font-medium">{f.name}</span>
                            <a href={api.getFileUrl(f.path)} download className="p-2 hover:bg-gray-200 rounded transition text-black">
                                <Download size={18} />
                            </a>
                        </div>
                    ))}
                    {files.length === 0 && <p className="text-sm text-gray-500">No data files uploaded.</p>}
                </div>
            </div>
        </div>
    )
}

function LeaderboardTab({ cid }) {
    const [lb, setLb] = useState([])
    useEffect(() => { api.leaderboard(cid).then(setLb) }, [cid])

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Rank</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Score</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {lb.map((s, i) => (
                            <tr key={s.id} className="bg-white hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-gray-500">#{i + 1}</td>
                                <td className="px-6 py-4 font-medium">{s.user}</td>
                                <td className="px-6 py-4">{s.score}</td>
                                <td className="px-6 py-4 text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {lb.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No submissions yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function SubmissionsTab({ cid }) {
    const [subs, setSubs] = useState([])
    const token = localStorage.getItem("token")

    useEffect(() => {
        if (token) api.getMySubmissions(cid, token).then(setSubs)
    }, [cid, token])

    if (!token) return <p className="text-gray-500">Please login to view your submissions.</p>

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">My Submissions</h2>
            <div className="space-y-3">
                {subs.map(s => (
                    <div key={s.id} className="border p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <div className="font-medium">Score: {s.score}</div>
                            <div className="text-xs text-gray-500">{new Date(s.created_at).toLocaleString()}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${s.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                            {s.status}
                        </span>
                    </div>
                ))}
                {subs.length === 0 && <p className="text-gray-500">You haven't submitted yet.</p>}
            </div>
        </div>
    )
}

function SubmitWidget({ cid }) {
    const token = localStorage.getItem("token")
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [msg, setMsg] = useState("")

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)
        try {
            const res = await api.submit(cid, file, token)
            setMsg(`Submitted! Score: ${res.score}`)
            window.location.reload() // lazy refresh to show in leaderboard
        } catch {
            setMsg("Failed to submit.")
        } finally {
            setUploading(false)
        }
    }

    if (!token) return <Link to="/login" className="btn w-full text-center block">Login to Submit</Link>

    return (
        <div className="space-y-4">
            <div className="file-drop p-4 relative">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload size={20} className="text-gray-400" />
                <span className="text-xs text-gray-600 block max-w-full truncate px-2">{file ? file.name : "Upload Submission"}</span>
            </div>
            {msg && <p className="text-xs text-center font-medium">{msg}</p>}
            <button onClick={handleUpload} disabled={!file || uploading} className="btn btn-primary w-full">
                {uploading ? "Uploading..." : "Submit Predictions"}
            </button>
        </div>
    )
}

function Timeline({ start, end, text }) {
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const now = Date.now()

    // Calculate progress percentage
    let progress = 0
    if (now > s) {
        progress = Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100))
    }

    const isEnded = now > e
    const isUpcoming = now < s

    return (
        <div className="flex flex-col min-w-[200px] md:min-w-[300px]">
            <span className="text-xs text-gray-400 mb-1">
                {isUpcoming ? "Starts: " : (isEnded ? "Ended: " : "Ends: ")}
                {isUpcoming ? new Date(start).toLocaleString() : new Date(end).toLocaleString()}
            </span>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden relative border border-gray-700">
                <div
                    className={`h-full ${isEnded ? 'bg-red-500' : (isUpcoming ? 'bg-gray-600' : 'bg-green-500')} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>{new Date(start).toLocaleDateString()}</span>
                <span>{new Date(end).toLocaleDateString()}</span>
            </div>
        </div>
    )
}
