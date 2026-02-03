import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../api"
import { Plus, Search, Trophy, Edit2, Trash2 } from "lucide-react"

export default function Home({ user }) {
    const [competitions, setCompetitions] = useState([])
    const [myCompetitions, setMyCompetitions] = useState([])
    const [activeTab, setActiveTab] = useState("all") // all, my

    const fetchCompetitions = async () => {
        api.getCompetitions().then(setCompetitions)
        if (user) {
            const token = localStorage.getItem("token")
            api.getMyCompetitions(token).then(setMyCompetitions)
        }
    }

    useEffect(() => {
        fetchCompetitions()
    }, [user])

    const handleDelete = async (e, id) => {
        e.preventDefault() // Prevent Link navigation
        if (confirm("Are you sure you want to delete this competition? This cannot be undone.")) {
            try {
                await api.deleteCompetition(id, localStorage.getItem("token"))
                // Refresh lists after deletion
                fetchCompetitions()
            } catch (err) {
                alert("Failed to delete")
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-black text-white pt-24 pb-12 px-6">
                <div className="max-w-6xl mx-auto flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold mb-4">Competitions</h1>
                        <p className="text-gray-400 max-w-xl">
                            Join elite data science challenges, submit your models, and climb the global leaderboard.
                        </p>
                    </div>
                    {user && (
                        <Link to="/create" className="btn btn-primary flex items-center gap-2">
                            <Plus size={18} /> New Competition
                        </Link>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Tabs */}
                <div className="flex gap-8 border-b mb-8">
                    <button onClick={() => setActiveTab("all")} className={`pb-4 font-medium transition ${activeTab === "all" ? "border-b-2 border-black" : "text-gray-500"}`}>
                        All Competitions
                    </button>
                    {user && (
                        <button onClick={() => setActiveTab("my")} className={`pb-4 font-medium transition ${activeTab === "my" ? "border-b-2 border-black" : "text-gray-500"}`}>
                            Hosted by Me
                        </button>
                    )}
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {(activeTab === "all" ? competitions : myCompetitions).map(c => {
                        const isHost = user && c.host_id === user.id
                        return (
                            <Link key={c.id} to={`/competition/${c.id}`} className="group relative block p-6 border rounded-lg hover:shadow-md transition bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold group-hover:underline transition-colors w-full pr-16">{c.title}</h3>
                                    {isHost && (
                                        <div className="absolute top-6 right-6 flex gap-2 z-10">
                                            <object>
                                                <Link to={`/competition/${c.id}/edit`} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition block">
                                                    <Edit2 size={16} />
                                                </Link>
                                            </object>
                                            <object>
                                                <button onClick={(e) => handleDelete(e, c.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition block">
                                                    <Trash2 size={16} />
                                                </button>
                                            </object>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{c.subtitle}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                                    <span className="flex items-center gap-1">
                                        <Trophy size={12} /> {c.metric.toUpperCase()}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {c.end_date ? (
                                            new Date() > new Date(c.end_date)
                                                ? `Ended on ${new Date(c.end_date).toLocaleDateString()}`
                                                : `Ongoing (Ends ${new Date(c.end_date).toLocaleDateString()})`
                                        ) : (c.timeline || "Ongoing")}
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {(activeTab === "all" ? competitions : myCompetitions).length === 0 && <p className="text-center text-gray-500 py-20">No competitions found.</p>}
            </div>
        </div>
    )
}
