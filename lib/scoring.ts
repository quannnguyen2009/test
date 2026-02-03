import { exec } from "child_process"
import path from "path"
import fs from "fs"
import { promisify } from "util"

const execPromise = promisify(exec)

export async function calculateScore(
    submissionPath: string,
    groundTruthPath: string,
    metric: string
): Promise<number | null> {
    try {
        const subFullPath = path.join(process.cwd(), "uploads", submissionPath)
        const gtFullPath = path.join(process.cwd(), "uploads", groundTruthPath)
        const pythonScriptPath = path.join(process.cwd(), "lib", "scoring.py")

        if (!fs.existsSync(subFullPath) || !fs.existsSync(gtFullPath)) {
            console.error("Submission or Ground Truth file missing:", { subFullPath, gtFullPath })
            return null
        }

        // Call python script
        const command = `python3 "${pythonScriptPath}" "${subFullPath}" "${gtFullPath}" "${metric}"`
        const { stdout, stderr } = await execPromise(command)

        if (stderr) {
            console.warn("Python scoring warning/stderr:", stderr)
        }

        const result = JSON.parse(stdout)
        if (result.error) {
            console.error("Python scoring logic error:", result.error)
            return null
        }

        return typeof result.score === 'number' ? result.score : null
    } catch (e) {
        console.error("Scoring bridge error:", e)
        return null
    }
}
