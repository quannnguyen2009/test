import { useNavigate, Link } from "react-router-dom"
import { api } from "../api"
import CompetitionForm from "../components/CompetitionForm"

export default function CreateCompetition() {
    const nav = useNavigate()
    const token = localStorage.getItem("token")

    const handleSubmit = async (formData) => {
        await api.createCompetition(formData, token)
        nav("/")
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-10">
            <Link to="/" className="text-sm text-gray-500 hover:text-black mb-6 block">← Back to Dashboard</Link>
            <h1 className="text-3xl font-bold mb-8">Create Competition</h1>
            <CompetitionForm onSubmit={handleSubmit} />
        </div>
    )
}
