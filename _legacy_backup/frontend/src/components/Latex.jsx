import 'katex/dist/katex.min.css';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

export default function Latex({ content }) {
    if (!content) return null;

    // Pre-process content to replace LaTeX delimiters with Markdown delimiters
    // \[ ... \] -> $$ ... $$
    // \( ... \) -> $ ... $
    const processedContent = content
        .replace(/\\\[/g, '$$$$') // Double $$ for display math
        .replace(/\\\]/g, '$$$$')
        .replace(/\\\(/g, '$')    // Single $ for inline math
        .replace(/\\\)/g, '$');

    return (
        <div className="prose prose-sm max-w-none">
            <ReactMarkdown
                children={processedContent}
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
            />
        </div>
    );
}
