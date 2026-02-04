import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import CompetitionDetail from "@/components/CompetitionDetail"
import { readText, listFiles } from "@/lib/storage"

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
    const files = await listFiles(c.dataDir || "")

    // Determine sort order based on metric
    const lowIsBetter = ["rmse", "mae", "mse", "cross_entropy"].includes(c.metric.toLowerCase())
    const sortOrder = lowIsBetter ? "asc" : "desc"

    // Leaderboard (Filter by status, show top score per user)
    const allSubmissions = await prisma.submission.findMany({
        where: {
            competitionId: id,
            status: "graded"
        },
        orderBy: { score: sortOrder },
        include: { user: true },
        take: 1000
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

    // Read file contents
    const [descriptionContent, dataDescContent] = await Promise.all([
        readText(c.descriptionPath || ""),
        readText(c.dataDescPath || "")
    ])

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
