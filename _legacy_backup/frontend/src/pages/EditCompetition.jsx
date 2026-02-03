import { useEffect, useState } from "react"
import { useNavigate, Link, useParams } from "react-router-dom"
import { api } from "../api"
import CompetitionForm from "../components/CompetitionForm"

export default function EditCompetition() {
    const { id } = useParams()
    const nav = useNavigate()
    const token = localStorage.getItem("token")
    const [comp, setComp] = useState(null)
    const [existingFiles, setExistingFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        Promise.all([
            api.getCompetition(id),
            api.getCompetitionFiles(id)
        ]).then(([compRes, filesRes]) => {
            setComp(compRes.competition)
            setExistingFiles(Array.isArray(filesRes) ? filesRes : [])
            setLoading(false)
        }).catch(err => {
            console.error("Failed to load:", err)
            setError(err.message)
            setLoading(false)
        })
    }, [id])

    const handleSubmit = async (formData) => {
        try {
            await api.updateCompetition(id, formData, token)
            nav(`/competition/${id}`)
        } catch (e) {
            alert("Update failed: " + e.message)
        }
    }

    if (loading) return <div className="p-10 text-center">Loading Competition...</div>
    if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>
    if (!comp) return <div className="p-10 text-center text-red-500">Competition not found</div>

    try {
        return (
            <div className="max-w-3xl mx-auto px-6 py-10">
                <Link to={`/competition/${id}`} className="text-sm text-gray-500 hover:text-black mb-6 block">← Back to Competition</Link>
                <h1 className="text-3xl font-bold mb-8">Edit Competition</h1>
                <CompetitionForm
                    initialData={comp}
                    existingDataFiles={existingFiles}
                    onSubmit={handleSubmit}
                />
            </div>
        )
    } catch (e) {
        return <div className="text-red-500">Render Error: {e.message}</div>
    }
}
