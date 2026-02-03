import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import CompetitionDetail from "@/components/CompetitionDetail"
import fs from "fs"
import path from "path"

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const user = await getSession()

    const c = await prisma.competition.findUnique({
        where: { id },
        include: { host: true }
    })

    if (!c) return <div className="p-10 text-center">Competition not found</div>

    // List files
    let files: any[] = []
    if (c.dataDir) {
        // dataDir is relative? In actions we saved as `competitions/...`
        // which matches `saveFile` location in `uploads/`
        // Full path on disk:
        const fullPath = path.join(process.cwd(), "uploads", c.dataDir)
        if (fs.existsSync(fullPath)) {
            const dirFiles = fs.readdirSync(fullPath)
            files = dirFiles.map(f => ({ name: f }))
        }
    }

    // Leaderboard (Filter by duration and show top score per user)
    const allSubmissions = await prisma.submission.findMany({
        where: {
            competitionId: id,
            ...(c.startDate && c.endDate ? {
                createdAt: {
                    gte: c.startDate,
                    lte: c.endDate
                }
            } : {})
        },
        orderBy: { score: (c.metric === "rmse" || c.metric === "mae") ? "asc" : "desc" },
        include: { user: true },
        take: 500
    })

    const topPerUser = new Map<number, any>()
    for (const sub of allSubmissions) {
        if (!topPerUser.has(sub.userId)) {
            topPerUser.set(sub.userId, sub)
        }
    }
    const leaderboard = Array.from(topPerUser.values()).slice(0, 50)

    // My submissions
    let mySubmissions: any[] = []
    if (user) {
        mySubmissions = await prisma.submission.findMany({
            where: { competitionId: id, userId: Number(user.id) },
            orderBy: { createdAt: "desc" }
        })
    }

    // Read file contents if they exist
    let descriptionContent = null
    if (c.descriptionPath) {
        const fullPath = path.join(process.cwd(), "uploads", c.descriptionPath)
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
            descriptionContent = fs.readFileSync(fullPath, "utf-8")
        }
    }

    let dataDescContent = null
    if (c.dataDescPath) {
        const fullPath = path.join(process.cwd(), "uploads", c.dataDescPath)
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
            dataDescContent = fs.readFileSync(fullPath, "utf-8")
        }
    }

    return (
        <CompetitionDetail
            competition={c}
            files={files}
            leaderboard={leaderboard}
            mySubmissions={mySubmissions}
            user={user}
            descriptionContent={descriptionContent}
            dataDescContent={dataDescContent}
        />
    )
}
