"use client"

import { useState, useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { login, register } from "@/app/actions"
import Link from "next/link"
import { Shield, ArrowRight } from "lucide-react"

export default function AuthPage() {
    const searchParams = useSearchParams()
    const initialMode = searchParams.get("mode") === "register" ? "register" : "login"
    const [mode, setMode] = useState(initialMode)

    const action = mode === "login" ? login : register
    const [state, formAction] = useActionState(action, { message: "" })

    return (
        <div className="min-h-[90vh] flex items-center justify-center px-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-4 bg-black text-white rounded-3xl mb-8">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-3xl font-black font-outfit tracking-tighter uppercase">Protocol {mode === "login" ? "Entry" : "Enrollment"}</h1>
                    <p className="text-neutral-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">AI JUDGE ARENA CLUSTER</p>
                </div>

                <form action={formAction} className="space-y-6">
                    {mode === "register" && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Identity Name</label>
                            <input name="name" required className="w-full bg-neutral-50 border-none p-4 rounded-2xl font-bold focus:ring-2 focus:ring-black transition-all outline-none" placeholder="e.g. ARCHITECT 01" />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Secure Access Email</label>
                        <input name="email" type="email" required className="w-full bg-neutral-50 border-none p-4 rounded-2xl font-bold focus:ring-2 focus:ring-black transition-all outline-none" placeholder="architect@cluster.io" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Encrypted Passkey</label>
                        <input name="password" type="password" required className="w-full bg-neutral-50 border-none p-4 rounded-2xl font-bold focus:ring-2 focus:ring-black transition-all outline-none" placeholder="••••••••" />
                    </div>

                    {state?.message && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{state.message}</p>}

                    <button className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-neutral-800 transition-all active:scale-95 flex items-center justify-center gap-3">
                        {mode === "login" ? "Initialize Session" : "Deploy Persona"}
                        <ArrowRight size={14} />
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => setMode(mode === "login" ? "register" : "login")}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition-colors"
                    >
                        {mode === "login" ? "Awaiting clearance? Request Access" : "Existing clearance? Signal Cluster"}
                    </button>
                </div>
            </div>
        </div>
    )
}
