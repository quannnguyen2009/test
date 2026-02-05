import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

export async function POST(request: NextRequest): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                // Optional: Add authentication check
                // const session = await getSession()
                // if (!session) throw new Error('Unauthorized')

                return {
                    allowedContentTypes: [
                        'application/pdf',
                        'text/markdown',
                        'text/plain',
                        'application/zip',
                        'text/csv',
                        'application/json',
                        'application/x-zip-compressed'
                    ],
                    maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB
                    addRandomSuffix: true,
                }
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('Upload completed:', blob.url)
            },
        })

        return NextResponse.json(jsonResponse)
    } catch (error) {
        console.error('Upload API error:', error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        )
    }
}
