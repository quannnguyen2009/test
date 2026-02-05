"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

export default function MarkdownPreview({ content }: { content: string | null }) {
    if (!content) return null

    // Normalize math delimiters
    const normalizedContent = content
        .replace(/\\\[/g, () => "$$")
        .replace(/\\\]/g, () => "$$")
        .replace(/\\\(/g, () => "$")
        .replace(/\\\)/g, () => "$")

    return (
        <div className="markdown-content prose max-w-none prose-neutral prose-table:border prose-table:border-neutral-200 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2">
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
            >
                {normalizedContent}
            </ReactMarkdown>
        </div>
    )
}
