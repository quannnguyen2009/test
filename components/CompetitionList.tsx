"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Trophy, Clock, Edit2, Trash2, Plus, ArrowUpRight, Search } from "lucide-react"

export default function CompetitionList({ competitions, user, onDelete }: { competitions: any[], user: any, onDelete: any }) {
    const [tab, setTab] = useState("all")

    const myCompetitions = competitions.filter(c => user && c.hostId === user.id)
    const displayList = tab === "all" ? competitions : myCompetitions

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Minimalist Hero */}
            <div className="mb-16">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                        <h1 className="text-5xl font-bold font-outfit tracking-tighter mb-4 text-black">
                            THE ARENA.
                        </h1>
                        <p className="text-neutral-500 max-w-md font-medium leading-relaxed">
                            A curated platform for high-stakes AI competitions. Solve the unsolvable, rank among the elite.
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-8 justify-between items-center mb-12 border-b border-neutral-100 pb-4">
                <div className="flex gap-10">
                    <button onClick={() => setTab("all")}
                        className={`text-xs font-bold uppercase tracking-[0.2em] transition-all relative py-2 ${tab === "all" ? "text-black" : "text-neutral-400 hover:text-black"}`}>
                        All Challenges
                        {tab === "all" && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-black" />}
                    </button>
                    {user && (
                        <button onClick={() => setTab("my")}
                            className={`text-xs font-bold uppercase tracking-[0.2em] transition-all relative py-2 ${tab === "my" ? "text-black" : "text-neutral-400 hover:text-black"}`}>
                            Your Domain
                            {tab === "my" && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-black" />}
                        </button>
                    )}
                </div>

                <div className="flex gap-4">
                    {user && (
                        <Link href="/create" className="px-5 py-2 rounded-full border border-black text-black font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2">
                            <Plus size={14} /> New Challenge
                        </Link>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayList.map(c => (
                    <CompetitionCard
                        key={c.id}
                        c={c}
                        user={user}
                        onDelete={onDelete}
                        showActions={tab === "my"}
                    />
                ))}
            </div>

            {displayList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-neutral-300">
                    <Trophy size={48} className="mb-4 opacity-10" />
                    <p className="text-xs font-bold uppercase tracking-widest italic text-neutral-400">The arena awaits its first host.</p>
                </div>
            )}
        </div>
    )
}

function CompetitionCard({ c, user, onDelete, showActions }: { c: any, user: any, onDelete: any, showActions?: boolean }) {
    const [mounted, setMounted] = useState(false)
    const [isEnded, setIsEnded] = useState(false)
    const isHost = user && c.hostId === user.id

    useEffect(() => {
        setMounted(true)
        if (c.endDate) {
            setIsEnded(new Date() > new Date(c.endDate))
        }
    }, [c.endDate])

    return (
        <div key={c.id} className="group relative bg-white border border-neutral-100 p-8 rounded-2xl hover:border-black transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            <Link href={`/competition/${c.id}`} className="flex flex-col h-full">
                <div className="mb-6 flex justify-between items-start">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-black transition-colors pt-1.5">
                        {c.metric} RANKING
                    </div>

                    <div className="flex items-center gap-2">
                        {isHost && showActions && (
                            <div className="flex gap-1.5" onClick={(e) => e.preventDefault()}>
                                <Link href={`/competition/${c.id}/edit`} className="p-2 bg-neutral-50 hover:bg-black rounded-full text-neutral-400 hover:text-white transition-all shadow-sm">
                                    <Edit2 size={12} />
                                </Link>
                                <button className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-red-600 transition-all shadow-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("ARCHIVE THIS CHALLENGE?")) onDelete(c.id)
                                    }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                        <div className="p-2 border border-neutral-100 rounded-full group-hover:bg-black group-hover:text-white transition-all">
                            <ArrowUpRight size={14} />
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-bold font-outfit tracking-tight mb-2 leading-tight">
                    {c.title}
                </h3>
                <p className="text-sm text-neutral-400 line-clamp-2 font-medium leading-relaxed mb-8">
                    {c.subtitle}
                </p>

                <div className="mt-auto pt-6 border-t border-neutral-50 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className={`${mounted && isEnded ? 'text-neutral-400' : 'text-neutral-900 flex items-center gap-2'}`}>
                        {!mounted ? '...' : (isEnded ? 'Closed' : <><div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> Active</>)}
                    </span>
                    <span className="text-neutral-400">
                        {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Infinite'}
                    </span>
                </div>
            </Link>
        </div>
    )
}

