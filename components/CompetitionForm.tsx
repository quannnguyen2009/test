"use client"

import { useState, useRef, useActionState } from "react"
import { Upload, X, Asterisk, Loader2 } from "lucide-react"
import { createCompetition, updateCompetition } from "@/app/actions"
import { formatToUTC7Input } from "@/lib/dateUtils"
import { upload } from '@vercel/blob/client'

export default function CompetitionForm({ initialData, existingDataFiles = [] }: { initialData?: any, existingDataFiles?: string[] }) {
    const isEdit = !!initialData
    const action = isEdit ? updateCompetition.bind(null, initialData.id) : createCompetition
    const [state, formAction] = useActionState(action, { message: "" })
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState("")

    // Handle form submission with client-side uploads
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setUploading(true)
        setUploadProgress("Preparing files...")

        const form = e.currentTarget
        const formData = new FormData(form)

        try {
            // Upload files to Blob first
            const folderId = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`

            // Description file
            const descFile = formData.get("description_file") as File
            if (descFile && descFile.size > 0) {
                setUploadProgress("Uploading description...")
                const blob = await upload(descFile.name, descFile, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                })
                formData.set("description_url", blob.url)
            }

            // Data description file
            const dataDescFile = formData.get("data_desc_file") as File
            if (dataDescFile && dataDescFile.size > 0) {
                setUploadProgress("Uploading data description...")
                const blob = await upload(dataDescFile.name, dataDescFile, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                })
                formData.set("data_desc_url", blob.url)
            }

            // Ground truth file
            const gtFile = formData.get("ground_truth_file") as File
            if (gtFile && gtFile.size > 0) {
                setUploadProgress("Uploading ground truth...")
                const blob = await upload(gtFile.name, gtFile, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                })
                formData.set("ground_truth_url", blob.url)
            }

            // Data files (multiple)
            const dataFiles = formData.getAll("data_files") as File[]
            const dataUrls: string[] = []
            for (let i = 0; i < dataFiles.length; i++) {
                const file = dataFiles[i]
                if (file && file.size > 0) {
                    setUploadProgress(`Uploading dataset ${i + 1}/${dataFiles.length}...`)
                    const blob = await upload(file.name, file, {
                        access: 'public',
                        handleUploadUrl: '/api/upload',
                    })
                    dataUrls.push(blob.url)
                }
            }
            if (dataUrls.length > 0) {
                formData.set("data_urls", JSON.stringify(dataUrls))
            }

            setUploadProgress("Creating competition...")

            // Remove file inputs (we've uploaded them already)
            formData.delete("description_file")
            formData.delete("data_desc_file")
            formData.delete("ground_truth_file")
            formData.delete("data_files")

            // Submit to server action
            await formAction(formData)
        } catch (error) {
            console.error("Upload error:", error)
            setUploadProgress("Upload failed. Please try again.")
        } finally {
            setUploading(false)
        }
    }


    return (
        <form onSubmit={handleSubmit} className="space-y-12 max-w-3xl mx-auto pb-32">
            {state?.message && (
                <div className={`p-6 rounded-2xl border-2 font-bold text-xs uppercase tracking-widest ${state.message === "Success" ? "border-black bg-white text-black" : "border-red-100 bg-red-50 text-red-600"}`}>
                    {state.message}
                </div>
            )}

            {uploading && (
                <div className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-3">
                    <Loader2 className="animate-spin" size={16} />
                    {uploadProgress}
                </div>
            )}

            <section className="space-y-8">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-300 flex items-center gap-4">
                    Identity & Mission <div className="h-px bg-neutral-100 flex-1" />
                </h2>

                <div className="grid gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Arena Title</label>
                        <input name="title" required defaultValue={initialData?.title}
                            className="w-full bg-neutral-50 border-none p-6 rounded-2xl text-xl font-bold font-outfit focus:ring-2 focus:ring-black transition-all outline-none"
                            placeholder="e.g. NEURAL SYMPHONY" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Codename / Subtitle</label>
                        <input name="subtitle" defaultValue={initialData?.subtitle}
                            className="w-full bg-neutral-50 border-none p-4 rounded-2xl font-medium focus:ring-2 focus:ring-black transition-all outline-none"
                            placeholder="Brief mission statement" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Daily Submission Limit</label>
                        <input name="submission_limit" type="number" defaultValue={initialData?.submissionLimit || 5}
                            className="w-full bg-neutral-50 border-none p-4 rounded-2xl font-bold focus:ring-2 focus:ring-black transition-all outline-none" />
                    </div>
                    <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                            Scoring Protocol <Asterisk size={10} className="text-black" />
                        </label>
                        <select name="metric" defaultValue={initialData?.metric || "accuracy"}
                            className="w-full bg-neutral-50 border-none p-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] focus:ring-2 focus:ring-black transition-all outline-none appearance-none cursor-pointer">
                            <optgroup label="Classification" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                <option value="accuracy">Accuracy</option>
                                <option value="f1">F1 Score</option>
                                <option value="roc_auc">ROC AUC</option>
                                <option value="cross_entropy">Cross Entropy</option>
                            </optgroup>
                            <optgroup label="Regression" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                <option value="mae">Mean Absolute Error (MAE)</option>
                                <option value="mse">Mean Squared Error (MSE)</option>
                                <option value="rmse">Root Mean Squared Error (RMSE)</option>
                            </optgroup>
                        </select>
                        <div className="absolute right-4 bottom-4 pointer-events-none text-neutral-400">
                            <X size={12} className="rotate-45" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-8">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-300 flex items-center gap-4">
                    Temporal Windows <div className="h-px bg-neutral-100 flex-1" />
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Inception Date</label>
                        <input name="start_date" type="datetime-local"
                            defaultValue={formatToUTC7Input(initialData?.startDate)}
                            className="w-full bg-neutral-50 border-none p-4 rounded-2xl font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Termination Date</label>
                        <input name="end_date" type="datetime-local"
                            defaultValue={formatToUTC7Input(initialData?.endDate)}
                            className="w-full bg-neutral-50 border-none p-4 rounded-2xl font-bold focus:ring-2 focus:ring-black transition-all outline-none"
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-8">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-300 flex items-center gap-4">
                    Data Repositories <div className="h-px bg-neutral-100 flex-1" />
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                    <FileUpload label="Core Blueprint (PDF/MD)" name="description_file" accept=".pdf,.md,.txt"
                        initialFiles={initialData?.descriptionPath ? [initialData.descriptionPath.split('/').pop()] : []} />
                    <FileUpload label="Schema Specs" name="data_desc_file" accept=".pdf,.md,.txt"
                        initialFiles={initialData?.dataDescPath ? [initialData.dataDescPath.split('/').pop()] : []} />
                    <div className="sm:col-span-2">
                        <FileUpload label="Training Archives" name="data_files" accept=".zip,.csv,.json" multiple
                            initialFiles={existingDataFiles} />
                    </div>
                    <div className="sm:col-span-2">
                        <FileUpload label="Ground Truth (Classified)" name="ground_truth_file" accept=".csv,.json"
                            initialFiles={initialData?.groundTruthPath ? ["ground_truth.csv"] : []} />
                    </div>
                </div>
            </section>

            <button type="submit" disabled={uploading} className="w-full py-6 bg-black text-white rounded-3xl font-black uppercase text-sm tracking-[0.4em] hover:bg-neutral-800 transition-all shadow-[0px_20px_40px_-10px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                {uploading && <Loader2 className="animate-spin" size={20} />}
                {uploading ? "Uploading..." : (isEdit ? "Synchronize Arena" : "Instantiate Arena")}
            </button>
        </form>
    )
}

function FileUpload({ label, name, accept, multiple, initialFiles = [] }: any) {
    const [files, setFiles] = useState<File[]>([])
    const [removedFiles, setRemovedFiles] = useState<string[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFiles(Array.from(e.target.files))
    }

    const removeNew = (idx: number) => {
        const newFiles = files.filter((_, i) => i !== idx)
        setFiles(newFiles)
        const dt = new DataTransfer()
        newFiles.forEach(f => dt.items.add(f))
        if (inputRef.current) inputRef.current.files = dt.files
    }

    const removeExisting = (filename: string) => {
        setRemovedFiles(prev => [...prev, filename])
    }

    const activeInitialFiles = initialFiles.filter((f: string) => !removedFiles.includes(f))

    return (
        <div className="space-y-3 font-outfit">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</label>

            {/* Hidden inputs to notify server of deletions */}
            {removedFiles.map(f => (
                <input key={f} type="hidden" name={`remove_${name}`} value={f} />
            ))}

            <div className={`bg-neutral-50 border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer relative group hover:bg-neutral-100 ${files.length > 0 || activeInitialFiles.length > 0 ? 'border-black' : 'border-neutral-100 hover:border-black'}`}
                onClick={() => inputRef.current?.click()}>
                <input ref={inputRef} name={name} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleChange} />
                <Upload className={`mx-auto mb-2 transition-colors ${files.length > 0 || activeInitialFiles.length > 0 ? 'text-black' : 'text-neutral-300 group-hover:text-black'}`} size={24} />
                <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${files.length > 0 || activeInitialFiles.length > 0 ? "text-black" : "text-neutral-400 group-hover:text-black"}`}>
                    {files.length + activeInitialFiles.length > 0
                        ? `${files.length + activeInitialFiles.length} File(s) Active`
                        : "Transmit Files"}
                </p>
            </div>

            {(files.length > 0 || activeInitialFiles.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {/* Existing Files */}
                    {activeInitialFiles.map((f: string) => (
                        <div key={f} className="flex items-center gap-2 bg-neutral-100 text-neutral-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-neutral-200">
                            <span className="truncate max-w-[150px]">{f}</span>
                            <button type="button" className="hover:text-red-500 transition-colors" title="Remove from arena"
                                onClick={(e) => { e.stopPropagation(); removeExisting(f); }}>
                                <X size={12} />
                            </button>
                        </div>
                    ))}

                    {/* New Files */}
                    {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                            <span className="truncate max-w-[150px]">{f.name}</span>
                            <button type="button" className="hover:text-red-400 transition-colors"
                                onClick={(e) => { e.stopPropagation(); removeNew(i); }}>
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
