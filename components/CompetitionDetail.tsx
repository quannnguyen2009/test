"use client"

import { useState } from "react"
import Link from "next/link"
import { Trophy, Clock, User, Download, Upload, Trash2, ArrowLeft, ChevronRight, FileText, Database, BarChart3, ListChecks } from "lucide-react"
import Timeline from "@/components/Timeline"
import { submitSubmission, deleteCompetition } from "@/app/actions"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

export default function CompetitionDetail({
    competition: c,
    files,
    leaderboard,
    mySubmissions,
    user,
    descriptionContent,
    dataDescContent
}: any) {
    const [tab, setTab] = useState("overview")
    const [uploading, setUploading] = useState(false)
    const [msg, setMsg] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const isHost = user && c.hostId === user.id

    const normalizeMath = (content: string | null) => {
        if (!content) return null
        return content
            .replace(/\\\[/g, () => "$$")
            .replace(/\\\]/g, () => "$$")
            .replace(/\\\(/g, () => "$")
            .replace(/\\\)/g, () => "$")
    }

    const normalizedDescription = normalizeMath(descriptionContent)
    const normalizedDataDesc = normalizeMath(dataDescContent)

    async function handleUpload(formData: FormData) {
        setUploading(true)
        const res = await submitSubmission(c.id, formData)
        setUploading(false)
        if (res.message) setMsg(res.score ? `Score: ${res.score}` : res.message)
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Simple Navigation */}
            <div className="bg-black text-white/50 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                    <Link href="/" className="hover:text-white flex items-center gap-1 transition-colors">
                        <ArrowLeft size={12} /> Back
                    </Link>
                    <ChevronRight size={10} className="opacity-20" />
                    <span className="text-white/30 truncate">Arena Protocol #{c.id}</span>
                </div>
            </div>

            {/* Header / Banner */}
            <div className="bg-black text-white pt-10 pb-20 overflow-hidden relative border-b border-white/10">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-end gap-12 relative z-10">
                    <div className="flex-1">
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 mb-6 flex items-center gap-3">
                            <div className="w-8 h-px bg-neutral-800" /> {c.metric} PROTOCOL
                        </div>
                        <h1 className="text-7xl font-black font-outfit tracking-tighter mb-8 text-white leading-none">
                            {c.title}
                        </h1>
                        <p className="text-neutral-400 max-w-xl text-lg font-medium leading-relaxed">
                            {c.subtitle}
                        </p>
                    </div>
                    <div className="w-full md:w-[450px]">
                        <div className="text-[12px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-white/40">
                            <Clock size={16} /> Timeline
                        </div>
                        <Timeline start={c.startDate} end={c.endDate} variant="dark" />

                        <div className="mt-10 pt-8 border-t border-white/10 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-sm">
                                <User size={24} className="text-white" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5">PROTOCOL HOST</div>
                                <div className="text-xl font-black font-outfit uppercase tracking-tight text-white">{c.host.name}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-6 pb-32">
                <div className="flex gap-12 border-b border-neutral-100 mb-12 overflow-x-auto scroller-hide">
                    {[
                        { id: "overview", label: "Overview", icon: FileText },
                        { id: "data", label: "Datasets", icon: Database },
                        { id: "leaderboard", label: "Rankings", icon: BarChart3 },
                        { id: "submissions", label: "Submissions", icon: ListChecks }
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 py-4 text-xs font-bold uppercase tracking-[0.2em] border-b-2 transition-all duration-300 ${tab === t.id ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-black"}`}>
                            <t.icon size={14} /> {t.label}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2">
                        {tab === "overview" && (
                            <div className="prose max-w-none">
                                <h2 className="text-2xl font-bold font-outfit mb-6 tracking-tight">Challenge Guidelines</h2>
                                {descriptionContent ? (
                                    <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 mb-8 font-medium text-neutral-600 leading-relaxed shadow-inner overflow-x-auto">
                                        <div className="markdown-content prose max-w-none prose-neutral prose-table:border prose-table:border-neutral-200 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath, remarkGfm]}
                                                rehypePlugins={[rehypeKatex]}
                                            >
                                                {normalizedDescription}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : null}
                                {c.descriptionPath ? (
                                    <div className="flex flex-col gap-4">
                                        <p className="text-neutral-500 font-medium leading-relaxed">Refer to the documentation below for detailed rules and expectations.</p>
                                        <a href={`/api/file/${c.descriptionPath}`} target="_blank" className="inline-flex items-center gap-2 font-bold text-xs uppercase tracking-widest underline decoration-2 underline-offset-4 hover:text-neutral-600 transition-colors">
                                            <Download size={14} /> Documentation [{c.descriptionPath.split('/').pop()}]
                                        </a>
                                    </div>
                                ) : (!descriptionContent && <div className="p-12 border-2 border-dashed border-neutral-100 rounded-3xl text-center text-neutral-300 font-bold uppercase text-[10px] tracking-widest">Awaiting Guidelines</div>)}
                            </div>
                        )}

                        {tab === "data" && (
                            <div className="space-y-12">
                                <div>
                                    <h2 className="text-2xl font-bold font-outfit mb-6 tracking-tight">Dataset Description</h2>
                                    {dataDescContent ? (
                                        <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100 mb-8 font-medium text-neutral-600 leading-relaxed shadow-inner overflow-x-auto">
                                            <div className="markdown-content prose max-w-none prose-neutral prose-table:border prose-table:border-neutral-200 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkMath, remarkGfm]}
                                                    rehypePlugins={[rehypeKatex]}
                                                >
                                                    {normalizedDataDesc}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    ) : null}
                                    {c.dataDescPath ? ( // Fixed typo from dataDescriptionPath
                                        <a href={`/api/file/${c.dataDescPath}`} target="_blank" className="bg-neutral-50 px-6 py-4 rounded-2xl border border-neutral-100 flex items-center justify-between group hover:border-black transition-all font-bold text-xs uppercase tracking-widest">
                                            {c.dataDescPath.split('/').pop()}
                                            <Download size={16} className="text-neutral-300 group-hover:text-black transition-colors" />
                                        </a>
                                    ) : (!dataDescContent && <p className="text-neutral-400 font-medium">No extended description available.</p>)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-4">Training Sets</h3>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {files.length > 0 ? files.map((f: any) => (
                                            <div key={f.name} className="flex items-center justify-between p-6 rounded-2xl border border-neutral-100 hover:border-black transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-black group-hover:text-white transition-all">
                                                        <Database size={14} />
                                                    </div>
                                                    <span className="text-xs font-bold truncate max-w-[150px]">{f.name}</span>
                                                </div>
                                                <a href={`/api/file/${c.dataDir}/${f.name}`} download className="p-2 text-neutral-300 hover:text-black transition-colors">
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        )) : <div className="p-12 border border-neutral-100 rounded-2xl text-center text-neutral-300 font-bold uppercase text-[8px] tracking-[0.2em] col-span-2">Private Dataset</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === "leaderboard" && (
                            <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-[10px_10px_0px_0px_rgba(0,0,0,0.03)]">
                                <table className="w-full text-xs font-bold uppercase tracking-widest">
                                    <thead className="bg-neutral-50 text-neutral-400 border-b border-black">
                                        <tr>
                                            <th className="px-8 py-4 text-left">RANK</th>
                                            <th className="px-8 py-4 text-left">ARCHITECT</th>
                                            <th className="px-8 py-4 text-right">SCORE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {leaderboard.map((s: any, i: number) => (
                                            <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-8 py-6 text-black">#{i + 1}</td>
                                                <td className="px-8 py-6 text-black">{s.user.name}</td>
                                                <td className="px-8 py-6 text-right font-black">{s.score}</td>
                                            </tr>
                                        ))}
                                        {leaderboard.length === 0 && <tr><td colSpan={3} className="p-20 text-center text-neutral-300 font-black italic">The board is silent.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {tab === "submissions" && (
                            <div className="space-y-4">
                                {mySubmissions.map((s: any) => (
                                    <div key={s.id} className="p-6 rounded-2xl border border-neutral-100 hover:border-black transition-all flex justify-between items-center group bg-white shadow-sm hover:shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{c.metric} Score</div>
                                                <div className="text-xl font-black font-outfit">{s.score.toFixed(4)}</div>
                                            </div>
                                            <div className="w-px h-8 bg-neutral-100 mx-2" />
                                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">{new Date(s.createdAt).toLocaleString()}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-50 border border-neutral-100">
                                                {s.status === "graded" && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                                {s.status === "pending" && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                                {s.status === "error" && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{s.status}</span>
                                            </div>
                                            <a href={`/${s.filePath}`} download className="p-2.5 rounded-xl bg-neutral-50 text-neutral-400 hover:bg-black hover:text-white transition-all border border-neutral-100">
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                                {!user && <div className="p-20 text-center border-2 border-dashed border-neutral-100 rounded-3xl font-black uppercase text-[10px] tracking-widest text-neutral-300">Identity Verfication Required</div>}
                                {user && mySubmissions.length === 0 && <div className="p-20 text-center border-2 border-dashed border-neutral-100 rounded-3xl font-black uppercase text-[10px] tracking-widest text-neutral-300">No Trials Found.</div>}
                            </div>
                        )}
                    </div>

                    <div className="space-y-10">
                        <div className="p-8 border-2 border-black rounded-3xl bg-black text-white shadow-xl">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6">Submit Entry</h3>
                            {user ? (
                                <form action={handleUpload} className="space-y-6">
                                    <div className="border-2 border-dashed border-neutral-800 rounded-2xl p-10 text-center relative hover:border-neutral-500 transition-colors cursor-pointer group">
                                        <input
                                            type="file"
                                            name="file"
                                            required
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        />
                                        <Upload className={`mx-auto mb-2 transition-colors ${selectedFile ? 'text-white' : 'text-neutral-700 group-hover:text-neutral-300'}`} size={24} />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedFile ? 'text-white' : 'text-neutral-500'}`}>
                                            {selectedFile ? selectedFile.name : "Drop Submission"}
                                        </span>
                                    </div>
                                    {msg && <div className="text-center p-3 bg-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-neutral-800 animate-in fade-in slide-in-from-bottom-2">{msg}</div>}
                                    <button disabled={uploading} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-50">
                                        {uploading ? "Analyzing..." : "Deploy"}
                                    </button>
                                </form>
                            ) : (
                                <Link href="/auth?mode=login" className="w-full py-4 border border-white/20 hover:border-white rounded-xl font-black uppercase text-xs tracking-[0.2em] text-center block transition-all">Authenticate</Link>
                            )}
                            <p className="mt-6 text-[10px] font-medium text-neutral-500 text-center leading-relaxed">By submitting, you agree to the Arena's protocol and daily limit of {c.submissionLimit}.</p>
                        </div>

                        {isHost && (
                            <div className="p-8 border border-neutral-100 rounded-3xl">
                                <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-neutral-400">Owner Controls</h3>
                                <button
                                    onClick={() => { if (confirm("ABORT CHALLENGE?")) deleteCompetition(c.id) }}
                                    className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all text-xs uppercase tracking-widest">
                                    Terminate Arena
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
