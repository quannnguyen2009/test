import { Link } from "react-router-dom"
import { LogOut, User as UserIcon } from "lucide-react"

export default function Header({ user, logout }) {
    return (
        <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
            <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <div className="w-6 h-6 bg-black rounded-sm" />
                    AI Judge
                </Link>

                {user ? (
                    <div className="flex items-center gap-6">
                        <span className="text-sm font-medium hidden sm:block">{user.email}</span>
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                            <UserIcon size={16} />
                        </div>
                        <button onClick={logout} className="text-sm text-gray-500 hover:text-black transition">
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <Link to="/login" className="text-sm font-medium hover:text-gray-600 transition">Login</Link>
                        <Link to="/register" className="btn bg-black text-white hover:bg-gray-800">Register</Link>
                    </div>
                )}
            </div>
        </header>
    )
}
