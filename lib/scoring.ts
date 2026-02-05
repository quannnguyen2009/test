import { exec } from "child_process"
import path from "path"
import fs from "fs"
import { promisify } from "util"

const execPromise = promisify(exec)

export async function calculateScore(
    submissionPath: string,
    groundTruthPath: string,
    metric: string
): Promise<{ score: number | null; error?: string }> {
    try {
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")

        const scoringUrl = process.env.SCORING_API_URL || baseUrl

        const response = await fetch(`${scoringUrl}/api/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sub_url: submissionPath.startsWith('http') ? submissionPath : `${baseUrl}/${submissionPath}`,
                gt_url: groundTruthPath.startsWith('http') ? groundTruthPath : `${baseUrl}/${groundTruthPath}`,
                metric
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            return { score: null, error: `API Error: ${response.status} - ${errorText}` }
        }

        const result = await response.json()
        if (result.error) {
            console.error("Python scoring logic error:", result.error)
            return { score: null, error: result.error }
        }

        return {
            score: typeof result.score === 'number' ? result.score : null,
            error: undefined
        }
    } catch (e: any) {
        console.error("Scoring bridge error:", e)
        return { score: null, error: e.message || "Unknown scoring error." }
    }
}
