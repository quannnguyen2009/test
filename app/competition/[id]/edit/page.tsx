import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import CompetitionForm from "@/components/CompetitionForm"
import { redirect } from "next/navigation"
import fs from "fs"
import path from "path"

export default async function EditCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const user = await getSession()

    if (!user) redirect("/auth")

    const c = await prisma.competition.findUnique({
        where: { id }
    })

    if (!c) return <div className="p-10 text-center">Competition not found</div>
    if (c.hostId !== Number(user.id)) return <div className="p-10 text-center">Access denied</div>

    let dataFiles: string[] = []
    if (c.dataDir) {
        const fullPath = path.join(process.cwd(), "uploads", c.dataDir)
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
            dataFiles = fs.readdirSync(fullPath)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold mb-8">Edit Competition</h1>
            <CompetitionForm initialData={c} existingDataFiles={dataFiles} />
        </div>
    )
}
