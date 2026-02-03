"use client"

import { useEffect, useState } from "react"

export default function Timeline({ start, end, variant = "light" }: { start: any, end: any, variant?: "light" | "dark" }) {
    const [progress, setProgress] = useState(0)
    const [now, setNow] = useState<number | null>(null)

    useEffect(() => {
        setNow(Date.now())
        const timer = setInterval(() => setNow(Date.now()), 1000 * 60) // Update every minute

        if (start && end) {
            const s = new Date(start).getTime()
            const e = new Date(end).getTime()
            const currentNow = Date.now()

            if (currentNow <= s) setProgress(0)
            else if (currentNow >= e) setProgress(100)
            else {
                const total = e - s
                if (total > 0) setProgress(((currentNow - s) / total) * 100)
            }
        }

        return () => clearInterval(timer)
    }, [start, end])

    if (!start || !end) {
        return (
            <div className="py-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${variant === 'dark' ? 'text-white/20' : 'text-neutral-300'}`}>Schedule Pending</span>
            </div>
        )
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    // Status logic (server-safe default)
    const currentNow = now || startDate.getTime()
    const isEnded = currentNow > endDate.getTime()
    const isUpcoming = currentNow < startDate.getTime()
    const isActive = !isEnded && !isUpcoming

    const statusLabel = isUpcoming ? "Upcoming" : (isEnded ? "Concluded" : "Live")
    const statusColor = isUpcoming
        ? (variant === 'dark' ? 'bg-white/10' : 'bg-neutral-200')
        : (isEnded ? (variant === 'dark' ? 'bg-white/30' : 'bg-neutral-400') : (variant === 'dark' ? 'bg-white' : 'bg-black'))

    const textColor = variant === 'dark' ? 'text-white' : 'text-black'
    const mutedColor = variant === 'dark' ? 'text-white/40' : 'text-neutral-400'
    const bgColor = variant === 'dark' ? 'bg-white/5' : 'bg-neutral-50'
    const borderColor = variant === 'dark' ? 'border-white/10' : 'border-neutral-100'

    return (
        <div className="w-full space-y-6">
            {/* Status & Bar */}
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ${isActive ? 'animate-pulse' : ''}`} />
                        <span className={`text-sm font-black uppercase tracking-[0.2em] ${textColor}`}>{statusLabel}</span>
                    </div>
                    <span className={`text-sm font-black ${textColor}`}>{Math.floor(progress)}%</span>
                </div>

                <div className={`w-full h-4 ${variant === 'dark' ? 'bg-white/5' : 'bg-neutral-100'} rounded-full overflow-hidden border ${borderColor} shadow-inner relative`}>
                    <div
                        className={`absolute top-0 left-0 h-full ${statusColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${mutedColor}`}>Commencement</p>
                    <div className={`p-4 ${bgColor} rounded-2xl border ${borderColor} shadow-sm`}>
                        <p className={`text-sm font-bold ${textColor}`}>{startDate.toLocaleDateString()}</p>
                        <p className={`text-xs font-bold ${mutedColor} mt-1`}>{startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${mutedColor}`}>Termination</p>
                    <div className={`p-4 ${bgColor} rounded-2xl border ${borderColor} shadow-sm`}>
                        <p className={`text-sm font-bold ${textColor}`}>{endDate.toLocaleDateString()}</p>
                        <p className={`text-xs font-bold ${mutedColor} mt-1`}>{endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}


