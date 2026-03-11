import fs from "fs"
import path from "path"
// Removed Vercel Blob list import for local storage implementation

export async function readText(filePath: string): Promise<string | null> {
    if (!filePath) return null

    // Skip non-text files
    const ext = path.extname(filePath).toLowerCase()
    const textExts = ['.txt', '.md', '.csv', '.json']
    if (ext && !textExts.includes(ext) && !filePath.startsWith('http')) {
        return null
    }

    // Local file storage is primary. If it's a full URL, attempt fetch, otherwise read from 'uploads'.
    if (filePath.startsWith("http")) {
        try {
            const res = await fetch(filePath)
            if (!res.ok) return null
            return await res.text()
        } catch (e) {
            console.error("Error reading remote text:", e)
            return null
        }
    }

    try {
        // Normalize path: strip api/file/ prefix if present
        const relative = filePath.startsWith("api/file/")
            ? filePath.replace("api/file/", "")
            : filePath

        const fullPath = path.join(process.cwd(), "uploads", relative)
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
            return fs.readFileSync(fullPath, "utf-8")
        }
    } catch (e) {
        console.error("Error reading local text:", e)
    }
    return null
}

export async function listFiles(dirPath: string): Promise<{ name: string; url?: string }[]> {
    if (!dirPath) return []

    // Local filesystem storage is now the primary method
    try {
        const fullPath = path.join(process.cwd(), "uploads", dirPath)
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
            return fs.readdirSync(fullPath).map(f => ({ 
                name: f,
                url: `/api/file/${dirPath}/${f}`
            }))
        }
    } catch (e) {
        console.error("Error listing local files:", e)
    }
    return []
}
