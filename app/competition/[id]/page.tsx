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

    // Determine sort order based on metric
    const lowIsBetter = ["rmse", "mae", "mse", "cross_entropy"].includes(c.metric.toLowerCase())
    const sortOrder = lowIsBetter ? "asc" : "desc"

    // Parallel fetch all data
    const [files, leaderboard, descriptionContent, dataDescContent, mySubmissions] = await Promise.all([
        listFiles(c.dataDir || ""),
        prisma.submission.findMany({
            where: { competitionId: id, status: "graded" },
            orderBy: { score: sortOrder },
            include: { user: true },
            take: 1000 // Higher take for per-user filter
        }).then(subs => {
            const topPerUser = new Map<number, any>()
            for (const sub of subs) {
                if (!topPerUser.has(sub.userId)) topPerUser.set(sub.userId, sub)
            }
            return Array.from(topPerUser.values()).slice(0, 50)
        }),
        readText(c.descriptionPath || ""),
        readText(c.dataDescPath || ""),
        user ? prisma.submission.findMany({
            where: { competitionId: id, userId: Number(user.id) },
            orderBy: { createdAt: "desc" }
        }) : Promise.resolve([])
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
