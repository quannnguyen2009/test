import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import prisma from "@/lib/prisma"


export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const filePathParams = (await params).path

    // Security: Prevent directory traversal
    if (filePathParams.some(p => p.includes(".."))) {
        return new NextResponse("Invalid path", { status: 400 })
    }

    // Security: Explicitly deny access to hidden/ground_truth files
    if (filePathParams.some(p => p === "hidden" || p === "ground_truth")) {
        return new NextResponse("Access Denied", { status: 403 })
    }

    const relativePath = filePathParams.join("/")

    // Security: Ownership check for submissions
    if (filePathParams[0] === "submissions") {
        const { getSession } = require("@/lib/auth")
        const user = await getSession()
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        // Find submission in DB
        const submission = await prisma.submission.findFirst({
            where: { filePath: `api/file/${relativePath}` },
            include: { competition: true }
        })

        if (!submission) return new NextResponse("Submission not found", { status: 404 })

        // Allowed if owner OR host of the competition
        const isOwner = submission.userId === Number(user.id)
        const isHost = submission.competition.hostId === Number(user.id)

        if (!isOwner && !isHost) {
            return new NextResponse("Forbidden", { status: 403 })
        }
    }
    const fullPath = path.join(process.cwd(), "uploads", relativePath)

    if (!fs.existsSync(fullPath)) {
        return new NextResponse("File not found", { status: 404 })
    }

    const stat = fs.statSync(fullPath)
    if (!stat.isFile()) {
        return new NextResponse("Not a file", { status: 400 })
    }

    // Simple mime type detection (or assume based on extension)
    const ext = path.extname(fullPath).toLowerCase()
    let contentType = "application/octet-stream"
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg"
    else if (ext === ".png") contentType = "image/png"
    else if (ext === ".pdf") contentType = "application/pdf"
    else if (ext === ".csv") contentType = "text/csv"
    else if (ext === ".json") contentType = "application/json"
    else if (ext === ".txt") contentType = "text/plain"
    else if (ext === ".zip") contentType = "application/zip"

    const fileBuffer = fs.readFileSync(fullPath)

    return new NextResponse(fileBuffer, {
        headers: {
            "Content-Type": contentType,
            "Content-Length": stat.size.toString(),
        },
    })
}
