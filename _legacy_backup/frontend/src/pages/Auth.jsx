import { useState } from "react"
import { api } from "../api"
import { useNavigate, Link } from "react-router-dom"

export function Login({ setUser }) {
    const nav = useNavigate()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        const data = new FormData(e.target)

        try {
            const res = await api.login(data.get("email"), data.get("password"))
            localStorage.setItem("token", res.access_token)
            setUser({ email: data.get("email") }) // Optimistic update, ideally fetch /me
            nav("/")
        } catch (err) {
            setError("Invalid email or password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-gray-500 mt-2">Enter your details to access your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="email" type="email" required placeholder="Email" className="input" />
                    <input name="password" type="password" required placeholder="Password" className="input" />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500">
                    Don't have an account? <Link to="/register" className="font-semibold text-black underline">Register</Link>
                </p>
            </div>
        </div>
    )
}

export function Register() {
    const nav = useNavigate()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        const data = new FormData(e.target)

        try {
            await api.register(data.get("email"), data.get("name"), data.get("password"))
            nav("/login")
        } catch (err) {
            setError("Registration failed. Email might be taken.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
                    <p className="text-gray-500 mt-2">Join the competition platform</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" required placeholder="Full Name" className="input" />
                    <input name="email" type="email" required placeholder="Email" className="input" />
                    <input name="password" type="password" required placeholder="Password" className="input" />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
                        {loading ? "Creating account..." : "Register"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="font-semibold text-black underline">Login</Link>
                </p>
            </div>
        </div>
    )
}
