"use server"

import prisma from "@/lib/prisma"
import { sign } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod" // Optionally use zod for validation, skipping for speed in this tool
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import path from "path"
import fs from "fs"
import { revalidatePath } from "next/cache"
import { parseFromUTC7Input } from "@/lib/dateUtils"
import { calculateScore } from "@/lib/scoring"

// --- Auth ---

export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return { message: "Invalid credentials" }
        }

        const token = await sign({ id: user.id, name: user.name, email: user.email })
            ; (await cookies()).set("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" })

    } catch (e) {
        return { message: "Login failed" }
    }
    redirect("/")
}

export async function logout() {
    ; (await cookies()).set("token", "", { expires: new Date(0) })
    redirect("/auth")
}

export async function register(prevState: any, formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string

    if (!email || !password || !name) return { message: "Missing fields" }

    try {
        const hashed = bcrypt.hashSync(password, 10)
        await prisma.user.create({
            data: { email, password: hashed, name }
        })
    } catch (e) {
        return { message: "User likely exists" }
    }

    // Auto login
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
        const token = await sign({ id: user.id, name: user.name, email: user.email })
            ; (await cookies()).set("token", token, { httpOnly: true })
    }
    redirect("/")
}

// --- Helpers ---

import { put } from "@vercel/blob"

async function saveFile(file: File, folder: string): Promise<string | null> {
    if (!file || file.size === 0 || file.name === "undefined") return null

    // If Vercel Blob token is present, use it
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { url } = await put(`${folder}/${file.name}`, file, {
            access: 'public',
        })
        return url
    }

    // Fallback to local fs for development
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "uploads", folder)
    fs.mkdirSync(uploadDir, { recursive: true })

    const filePath = path.join(uploadDir, file.name)
    fs.writeFileSync(filePath, buffer)

    return `api/file/${folder}/${file.name}`
}

// --- Competitions ---

export async function createCompetition(prevState: any, formData: FormData) {
    const sessionToken = (await cookies()).get("token")?.value
    if (!sessionToken) return { message: "Unauthorized" }
    // Ideally verify session here, but for now trusting cookie presence + middleware/page protection
    // To get user ID, we need to verify
    const { verify } = require("@/lib/auth")
    const session = await verify(sessionToken)
    if (!session) return { message: "Unauthorized" }

    try {
        const title = formData.get("title") as string
        const subtitle = formData.get("subtitle") as string
        const metric = formData.get("metric") as string || "accuracy"
        const timeline = formData.get("timeline") as string
        const submissionLimit = parseInt(formData.get("submission_limit") as string || "5")

        const startDateStr = formData.get("start_date") as string
        const endDateStr = formData.get("end_date") as string
        const startDate = parseFromUTC7Input(startDateStr)
        const endDate = parseFromUTC7Input(endDateStr)

        // Generate ID or use temp ID for folder? Prisma autoincrements ID.
        // We can't know ID before insert.
        // Strategy: Create DB record first (with empty paths), then upload, then update?
        // Or generic folder `competitions/uuid`? 
        // Let's use timestamp-random for folder name to avoid Id race conditions or dependency.
        const folderId = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`

        let descPath = null
        let dataDescPath = null
        let gtPath = null
        let dataDir = null

        const descFile = formData.get("description_file") as File
        if (descFile) {
            const saved = await saveFile(descFile, `competitions/${folderId}/description`)
            if (saved) descPath = saved
        }

        // Data Files (Multi)
        const dataFiles = formData.getAll("data_files") as File[]
        if (dataFiles.length > 0) {
            for (const f of dataFiles) {
                await saveFile(f, `competitions/${folderId}/data`)
            }
            dataDir = `competitions/${folderId}/data`
        }

        const dataDescFile = formData.get("data_desc_file") as File
        if (dataDescFile) {
            const saved = await saveFile(dataDescFile, `competitions/${folderId}/data_desc`)
            if (saved) dataDescPath = saved
        }

        const gtFile = formData.get("ground_truth_file") as File
        if (gtFile) {
            const saved = await saveFile(gtFile, `competitions/${folderId}/hidden`) // Hidden folder
            if (saved) gtPath = saved
        }

        await prisma.competition.create({
            data: {
                title, subtitle, metric, timeline, submissionLimit,
                startDate, endDate,
                descriptionPath: descPath,
                dataDescPath: dataDescPath, // Fixed typo
                dataDir,
                groundTruthPath: gtPath,
                hostId: Number(session.id)
            }
        })

    } catch (e) {
        console.error(e)
        return { message: "Failed to create competition" }
    }

    revalidatePath("/")
    redirect("/")
}

export async function deleteCompetition(id: number) {
    const sessionToken = (await cookies()).get("token")?.value
    if (!sessionToken) return { message: "Unauthorized" }
    const { verify } = require("@/lib/auth")
    const session = await verify(sessionToken)
    if (!session) return { message: "Unauthorized" }

    const comp = await prisma.competition.findUnique({ where: { id: Number(id) } })
    if (!comp || comp.hostId !== Number(session.id)) return { message: "Forbidden" }

    await prisma.competition.delete({ where: { id: Number(id) } })
    revalidatePath("/")
    redirect("/")
}

export async function submitSubmission(cid: number, formData: FormData) {
    const sessionToken = (await cookies()).get("token")?.value
    if (!sessionToken) return { message: "Login required" }
    const { verify } = require("@/lib/auth") // Lazy import to avoid circular dep if any
    const session = await verify(sessionToken)
    if (!session) return { message: "Login required" }

    const file = formData.get("file") as File
    if (!file) return { message: "No file" }

    try {
        const savedPath = await saveFile(file, "submissions")
        if (!savedPath) return { message: "Upload failed" }

        const comp = await prisma.competition.findUnique({
            where: { id: Number(cid) }
        })

        if (!comp) return { message: "Arena not found" }

        // Real Scoring
        let score = 0
        let status = "graded"
        let errorMsg = ""

        if (comp.groundTruthPath) {
            const res = await calculateScore(
                savedPath.replace("api/file/", ""),
                comp.groundTruthPath,
                comp.metric
            )
            if (res.score !== null) {
                score = res.score
            } else {
                status = "error"
                errorMsg = res.error || "Scoring failed"
            }
        } else {
            status = "pending" // No ground truth to grade against yet
        }

        await prisma.submission.create({
            data: {
                competitionId: Number(cid),
                userId: Number(session.id),
                filePath: savedPath,
                score,
                status
            }
        })
        revalidatePath(`/competition/${cid}`)
        if (status === "error") return { message: errorMsg }
        return { message: "Success", score }
    } catch (e) {
        return { message: "Error submitting" }
    }
}

export async function updateCompetition(id: number, prevState: any, formData: FormData) {
    const sessionToken = (await cookies()).get("token")?.value
    if (!sessionToken) return { message: "Unauthorized" }
    const { verify } = require("@/lib/auth")
    const session = await verify(sessionToken)
    if (!session) return { message: "Unauthorized" }

    const comp = await prisma.competition.findUnique({ where: { id: Number(id) } })
    if (!comp || comp.hostId !== Number(session.id)) return { message: "Forbidden" }

    try {
        const title = formData.get("title") as string
        const subtitle = formData.get("subtitle") as string
        const metric = formData.get("metric") as string || "accuracy"
        const timeline = formData.get("timeline") as string
        const submissionLimit = parseInt(formData.get("submission_limit") as string || "5")
        const startDateStr = formData.get("start_date") as string
        const endDateStr = formData.get("end_date") as string
        const startDate = parseFromUTC7Input(startDateStr) || comp.startDate
        const endDate = parseFromUTC7Input(endDateStr) || comp.endDate

        // Determine folderId from existing paths or generate new one
        const samplePath = comp.dataDir || comp.descriptionPath || comp.dataDescPath || comp.groundTruthPath
        const folderId = samplePath?.split('/')[1] || `comp_${Date.now()}`

        let descPath = comp.descriptionPath
        let dataDescPath = comp.dataDescPath
        let gtPath = comp.groundTruthPath
        let dataDir = comp.dataDir

        // --- Removals ---
        const removeDesc = formData.get("remove_description_file")
        if (removeDesc && descPath && !descPath.startsWith("http")) {
            const fullPath = path.join(process.cwd(), "uploads", descPath)
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
            descPath = null
        }

        const removeDataDesc = formData.get("remove_data_desc_file")
        if (removeDataDesc && dataDescPath && !dataDescPath.startsWith("http")) {
            const fullPath = path.join(process.cwd(), "uploads", dataDescPath)
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
            dataDescPath = null
        }

        const removeGT = formData.get("remove_ground_truth_file")
        if (removeGT && gtPath && !gtPath.startsWith("http")) {
            const fullPath = path.join(process.cwd(), "uploads", gtPath)
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
            gtPath = null
        }

        const removedDataFiles = formData.getAll("remove_data_files") as string[]
        if (removedDataFiles.length > 0 && dataDir && !dataDir.startsWith("http")) {
            for (const filename of removedDataFiles) {
                const fullPath = path.join(process.cwd(), "uploads", dataDir, filename)
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
            }
            // Check if directory is empty
            const dirFullPath = path.join(process.cwd(), "uploads", dataDir)
            if (fs.existsSync(dirFullPath) && fs.readdirSync(dirFullPath).length === 0) {
                dataDir = null
            }
        }

        // --- Uploads ---
        const descFile = formData.get("description_file") as File
        if (descFile && descFile.size > 0) {
            const saved = await saveFile(descFile, `competitions/${folderId}/description`)
            if (saved) descPath = saved
        }

        const dataFiles = formData.getAll("data_files") as File[]
        if (dataFiles.length > 0 && dataFiles[0] instanceof File && dataFiles[0].size > 0) {
            for (const f of dataFiles) {
                if (f.size > 0) {
                    const saved = await saveFile(f, `competitions/${folderId}/data`)
                    if (saved && saved.startsWith("http")) {
                        dataDir = `competitions/${folderId}/data` // Prefix for blob
                    } else if (saved) {
                        dataDir = `competitions/${folderId}/data` // Local folder
                    }
                }
            }
        }

        const dataDescFile = formData.get("data_desc_file") as File
        if (dataDescFile && dataDescFile.size > 0) {
            const saved = await saveFile(dataDescFile, `competitions/${folderId}/data_desc`)
            if (saved) dataDescPath = saved
        }

        const gtFile = formData.get("ground_truth_file") as File
        if (gtFile && gtFile.size > 0) {
            const saved = await saveFile(gtFile, `competitions/${folderId}/hidden`)
            if (saved) gtPath = saved
        }

        await prisma.competition.update({
            where: { id: Number(id) },
            data: {
                title, subtitle, metric, timeline, submissionLimit,
                startDate, endDate,
                descriptionPath: descPath,
                dataDescPath: dataDescPath,
                dataDir,
                groundTruthPath: gtPath
            }
        })
    } catch (e) {
        console.error(e)
        return { message: "Failed to update competition" }
    }

    revalidatePath(`/competition/${id}`)
    revalidatePath("/")
    redirect(`/competition/${id}`)
}

