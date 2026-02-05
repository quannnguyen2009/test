import fs from "fs"
import path from "path"
import { list } from "@vercel/blob"

export async function readText(filePath: string): Promise<string | null> {
    if (!filePath) return null

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

    // Local fallback
    try {
        // If it starts with api/file/, strip it
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

    // If BLOB_READ_WRITE_TOKEN is set, prioritize Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const { blobs } = await list({ prefix: dirPath })
            return blobs.map(b => ({
                name: b.pathname.split("/").pop() || b.pathname,
                url: b.url
            }))
        } catch (e) {
            console.error("Error listing blobs:", e)
        }
    }

    // Local fallback
    try {
        const fullPath = path.join(process.cwd(), "uploads", dirPath)
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
            return fs.readdirSync(fullPath).map(f => ({ name: f }))
        }
    } catch (e) {
        console.error("Error listing local files:", e)
    }
    return []
}
