import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Download, Check, Code, Eye, ExternalLink, Star, GitFork } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RepoInfo {
  name: string;
  owner: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
}

interface ReadmePreviewProps {
  readme: string;
  repoInfo: RepoInfo;
}

export function ReadmePreview({ readme, repoInfo }: ReadmePreviewProps) {
  const [view, setView] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(readme);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "README copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded!",
      description: "README.md saved to your device",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Repo Info Header */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{repoInfo.owner}/{repoInfo.name}</h3>
              <a
                href={repoInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{repoInfo.description}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {repoInfo.language && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary" />
                {repoInfo.language}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {repoInfo.stars.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-4 h-4" />
              {repoInfo.forks.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setView('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === 'preview'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setView('raw')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === 'raw'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code className="w-4 h-4" />
            Raw
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
          <Button variant="terminal" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card className="overflow-hidden border-border">
        {view === 'preview' ? (
          <div className="p-6 md:p-8 markdown-preview max-h-[600px] overflow-y-auto scrollbar-thin">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme}</ReactMarkdown>
          </div>
        ) : (
          <div className="relative">
            <pre className="p-6 md:p-8 bg-code-bg overflow-x-auto max-h-[600px] scrollbar-thin">
              <code className="text-sm font-mono text-muted-foreground whitespace-pre-wrap break-words">
                {readme}
              </code>
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
