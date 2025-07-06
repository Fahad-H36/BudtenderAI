"use client";


import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { File, FileText, ImageIcon } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url?: string;
  }>;
  status?: "success" | "error";
  onImageClick?: (src: string, alt: string) => void;
}

export function MessageBubble({ 
  content, 
  isUser, 
  attachments = [],
  status,
}: MessageBubbleProps) {
  // File utility functions
  const getFileExtension = (filename: string) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
  }

  const isImageFile = (filename: string) => {
    const ext = getFileExtension(filename).toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
  }

  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) return <ImageIcon className="h-4 w-4" />;

    const ext = getFileExtension(filename).toLowerCase();
    if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) {
      return <FileText className="h-4 w-4" />;
    }

    return <File className="h-4 w-4" />;
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg transition-all hover:shadow-md w-fit",
        isUser
          ? status === "error"
            ? "bg-red-100 text-red-700 border border-red-200 ml-auto rounded-tr-none max-w-[85%] md:max-w-[75%] shadow-sm"
            : "bg-gradient-to-r from-[#142F32] to-[#1a3c40] text-white ml-auto rounded-tr-none max-w-[85%] md:max-w-[75%] shadow-sm"
          : "bg-gradient-to-r from-white to-[#f9fcf7] border border-[#E3FFCC]/60 text-[#282930] rounded-tl-none inline-block max-w-[95%] md:max-w-[90%] shadow-sm"
      )}
      style={{
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
        wordBreak: 'break-word'
      }}
    >
      {/* Message Content */}
      {content && (
        <div className="mb-1 markdown-content text-sm leading-relaxed break-words">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Customize component rendering
              p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
              a: ({...props}) => <a className={cn("underline", isUser ? "text-white/90 hover:text-white" : "text-[#142F32] hover:text-[#142F32]/80")} target="_blank" rel="noopener noreferrer" {...props} />,
              ul: ({...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
              ol: ({...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
              li: ({...props}) => <li className="mb-1" {...props} />,
              h1: ({...props}) => <h1 className="text-lg font-bold mb-2 mt-3" {...props} />,
              h2: ({...props}) => <h2 className="text-md font-bold mb-2 mt-3" {...props} />,
              h3: ({...props}) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
              blockquote: ({...props}) => <blockquote className={cn("border-l-2 pl-3 italic my-2", isUser ? "border-white/30" : "border-[#142F32]/30")} {...props} />,
              hr: ({...props}) => <hr className={cn("my-3 border-t", isUser ? "border-white/20" : "border-[#142F32]/20")} {...props} />,
              table: ({...props}) => <div className="overflow-x-auto my-2"><table className="min-w-full border-collapse" {...props} /></div>,
              th: ({...props}) => <th className={cn("px-2 py-1 border", isUser ? "border-white/20 bg-white/10" : "border-[#142F32]/20 bg-[#142F32]/5")} {...props} />,
              td: ({...props}) => <td className={cn("px-2 py-1 border", isUser ? "border-white/20" : "border-[#142F32]/20")} {...props} />,
              img: ({...props}) => <img className="max-w-full rounded my-2" {...props} alt={props.alt || "Image"} />,
              code: ({ className, children }) => {
                return (
                  <div className="relative mt-2 mb-1">
                    <pre className={cn("p-3 overflow-x-auto bg-[#FAFBFB] text-sm border rounded-md text-sm", className)}>
                      <code className="font-mono">{children}</code>
                    </pre>
                    <button
                      onClick={() => {
                      }}
                    >
                      Copy
                    </button>
                  </div>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
      
      {/* Render attachments as simple pills */}
      {attachments && attachments.length > 0 && (
        <div className={cn("mt-2 flex flex-wrap gap-2", content ? "pt-2 border-t" : "", isUser ? "border-white/20" : "border-[#142F32]/10")}>
          {attachments.map((file) => (
            <a 
              key={file.id} 
              href={file.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                isUser 
                  ? "bg-white/10 hover:bg-white/20 text-white/90"
                  : "bg-[#142F32]/5 hover:bg-[#142F32]/10 text-[#142F32]/90"
              )}
              title={file.name}
            >
              {getFileIcon(file.name)}
              <span className="truncate max-w-[150px] leading-snug">{file.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}