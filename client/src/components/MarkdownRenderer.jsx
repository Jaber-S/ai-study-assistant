import { marked } from 'marked';
import './MarkdownRenderer.css';

export function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const htmlContent = marked(content);

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}