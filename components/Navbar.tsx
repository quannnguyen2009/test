import Link from "next/link"
import { logout } from "@/app/actions"
import { Trophy, LogOut, Shield } from "lucide-react"

export default function Navbar({ user }: { user: any }) {
    return (
        <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 font-semibold text-xl tracking-tight group">
                    <div className="bg-black text-white p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Shield size={20} />
                    </div>
                    <span className="font-outfit uppercase tracking-widest text-sm">AI Judge</span>
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold border border-neutral-200">
                                    {user.name?.[0].toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-neutral-600 group-hover:text-black transition-colors">{user.name}</span>
                            </div>
                            <form action={logout}>
                                <button className="text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-red-600 flex items-center gap-2 transition-colors">
                                    <LogOut size={14} /> Logout
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
                            <Link href="/auth?mode=login" className="hover:text-black text-neutral-400 transition-colors">Login</Link>
                            <Link href="/auth?mode=register" className="px-5 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition-all shadow-sm active:scale-95">
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
