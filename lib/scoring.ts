import { exec } from "child_process"
import path from "path"
import fs from "fs"
import { promisify } from "util"

const execPromise = promisify(exec)

// Simple semaphore to limit concurrent scoring processes
// This prevents the server from being overloaded when 100+ people submit at once.
class ConcurrencyLimiter {
    private activeCount = 0;
    private queue: (() => void)[] = [];
    private maxParallel = 4; // Adjust 4-8 based on your server CPU/RAM

    async acquire() {
        if (this.activeCount < this.maxParallel) {
            this.activeCount++;
            return;
        }
        return new Promise<void>(resolve => {
            this.queue.push(resolve);
        });
    }

    release() {
        this.activeCount--;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) {
                this.activeCount++;
                next();
            }
        }
    }
}

const limiter = new ConcurrencyLimiter();

export async function calculateScore(
    submissionPath: string,
    groundTruthPath: string,
    metric: string
): Promise<{ score: number | null; error?: string }> {
    await limiter.acquire();
    try {
        // Normalize paths for local execution
        const subRelative = submissionPath.startsWith('api/file/') ? submissionPath.replace('api/file/', '') : submissionPath
        const gtRelative = groundTruthPath.startsWith('api/file/') ? groundTruthPath.replace('api/file/', '') : groundTruthPath

        const subPath = subRelative.startsWith('http') ? subRelative : path.join(process.cwd(), "uploads", subRelative)
        const gtPath = gtRelative.startsWith('http') ? gtRelative : path.join(process.cwd(), "uploads", gtRelative)

        const bridgeScript = path.join(process.cwd(), "lib", "scoring_bridge.py")

        // Execute local python bridge
        // Using python3 as common alias, might need to adjust based on environment
        const { stdout, stderr } = await execPromise(`python3 "${bridgeScript}" "${subPath}" "${gtPath}" "${metric}"`)

        if (stderr && !stdout) {
             return { score: null, error: `Python Error: ${stderr}` }
        }

        if (!stdout || stdout.trim() === "") {
             return { score: null, error: "Python bridge returned no output." }
        }

        let result;
        try {
            result = JSON.parse(stdout)
        } catch (parseError) {
            return { score: null, error: `JSON parsing error from bridge: ${stdout}` }
        }

        if (result.error) {
            console.error("Local scoring logic error:", result.error)
            return { score: null, error: result.error }
        }

        return {
            score: typeof result.score === 'number' ? result.score : null,
            error: undefined
        }
    } catch (e: any) {
        console.error("Scoring bridge error:", e)
        return { score: null, error: e.message || "Unknown scoring error." }
    } finally {
        limiter.release();
    }
}
