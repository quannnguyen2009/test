import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname) => {
                // Add authentication check here if needed
                return {
                    allowedContentTypes: ['application/pdf', 'text/markdown', 'text/plain', 'application/zip', 'text/csv', 'application/json'],
                    tokenPayload: JSON.stringify({
                        // Optional metadata
                    }),
                }
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('Upload completed:', blob.url)
            },
        })

        return NextResponse.json(jsonResponse)
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        )
    }
}
