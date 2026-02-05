export async function compressFile(file: File): Promise<File | Blob> {
    const stream = file.stream().pipeThrough(new CompressionStream('gzip'))
    const blob = await new Response(stream).blob()
    return new File([blob], `${file.name}.gz`, { type: 'application/gzip' })
}

export function isTextFile(filename: string): boolean {
    return /\.(csv|json|md|txt)$/i.test(filename)
}
