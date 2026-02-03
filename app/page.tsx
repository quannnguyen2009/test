import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import CompetitionList from "@/components/CompetitionList"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export default async function Home() {
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" }
  })
  const user = await getSession()

  async function deleteComp(id: number) {
    "use server"
    // Validate host
    // Actually we should verify user again inside action
    const { getSession } = require("@/lib/auth")
    const u = await getSession()
    const c = await prisma.competition.findUnique({ where: { id } })
    if (c && u && c.hostId === u.id) {
      await prisma.competition.delete({ where: { id } })
      // Check file cleanup (omitted for brevity, should use util)
      revalidatePath("/")
    }
  }

  return (
    <CompetitionList
      competitions={competitions}
      user={user}
      onDelete={deleteComp}
    />
  )
}
