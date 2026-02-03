
import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { api } from "../api"
import { Upload, X } from "lucide-react"

export default function CompetitionForm({ initialData = null, existingDataFiles = [], onSubmit }) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(initialData || {})

    // Helper to get filename from path
    const getFileName = (path) => path ? path.split('/').pop() : null;

    // Handlers for controlled inputs if needed, but we mostly use FormData
    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const form = new FormData(e.target)

        // If updating, we might want to handle file inputs carefully (only if changed)
        // The backend handles None/Null updates gracefully.

        try {
            await onSubmit(form)
        } catch (err) {
            alert("Failed to save competition")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Basic Info</h2>
                <div className="grid gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Title</label>
                        <input name="title" required className="input" defaultValue={data.title} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Subtitle</label>
                        <input name="subtitle" required className="input" defaultValue={data.subtitle} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Metric</label>
                            <select name="metric" className="input bg-white" defaultValue={data.metric} onChange={handleChange}>
                                <option value="rmse">RMSE</option>
                                <option value="accuracy">Accuracy</option>
                                <option value="logloss">LogLoss</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Daily Submission Limit</label>
                            <input name="submission_limit" type="number" defaultValue={data.submission_limit || 5} className="input" onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Start Date & Time</label>
                            <input
                                name="start_date"
                                type="datetime-local"
                                className="input"
                                defaultValue={data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">End Date & Time</label>
                            <input
                                name="end_date"
                                type="datetime-local"
                                className="input"
                                defaultValue={data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : ""}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Resources</h2>
                <p className="text-sm text-gray-500">Leave file inputs empty to keep existing files.</p>

                <FileUpload
                    label="Description File"
                    name="description_file"
                    accept=".pdf,.tex,.md,.txt"
                    existingFiles={getFileName(data.description_path) ? [{ name: getFileName(data.description_path) }] : []}
                />

                <FileUpload
                    label="Data Description"
                    name="data_desc_file"
                    accept=".pdf,.tex,.md,.txt"
                    existingFiles={getFileName(data.data_description_path) ? [{ name: getFileName(data.data_description_path) }] : []}
                />

                <FileUpload
                    label="Ground Truth File (Hidden)"
                    name="ground_truth_file"
                    accept=".csv,.json"
                    existingFiles={getFileName(data.ground_truth_path) ? [{ name: getFileName(data.ground_truth_path) }] : []}
                />

                <FileUpload
                    label="Training data"
                    name="data_files"
                    accept=".zip,.csv,.json"
                    multiple
                    existingFiles={existingDataFiles}
                />
            </section>

            <div className="pt-4 flex justify-end gap-3">
                <Link to="/" className="btn bg-white border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Link>
                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? "Saving..." : (initialData ? "Update Competition" : "Create Competition")}
                </button>
            </div>
        </form>
    )
}

function FileUpload({ label, name, accept, multiple, existingFiles = [] }) {
    const [files, setFiles] = useState([])
    const inputRef = useRef(null)

    const handleFile = (e) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index)
        setFiles(newFiles)

        // Sync with input element so FormData grabs the correct list
        const dt = new DataTransfer()
        newFiles.forEach(f => dt.items.add(f))
        if (inputRef.current) {
            inputRef.current.files = dt.files
        }
    }

    return (
        <div>
            <label className="text-sm font-medium mb-1 block">{label}</label>
            <div className="file-drop relative min-h-[100px] bg-gray-50 hover:bg-gray-100 transition-colors">
                <input
                    ref={inputRef}
                    type="file"
                    name={name}
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="pointer-events-none flex flex-col items-center text-gray-500">
                    <Upload size={24} />
                    <span className="text-sm mt-2">
                        {files.length > 0
                            ? `${files.length} new file(s) selected`
                            : "Click or drag to upload"}
                    </span>
                </div>
            </div>

            {/* New Files */}
            {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {files.map((f, i) => (
                        <li key={i} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm text-sm">
                            <span className="truncate max-w-[80%] font-medium text-blue-600">{f.name} (New)</span>
                            <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition"
                            >
                                <X size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Existing Files */}
            {existingFiles.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Existing Files</p>
                    <ul className="space-y-2">
                        {existingFiles.map((f, i) => (
                            <li key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-sm text-gray-600">
                                <span className="truncate">{f.name}</span>
                                {/* We don't support deleting individual existing files via this form yet, as backend doesn't support it easily */}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
