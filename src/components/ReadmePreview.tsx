import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Download, Check, Code, Eye, ExternalLink, Star, GitFork, RefreshCw, Loader2, Wand2, Columns, FileCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';

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
  onReadmeUpdate: (newReadme: string) => void;
  isStreaming?: boolean;
}

interface Section {
  id: string;
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

function parseReadmeIntoSections(readme: string): Section[] {
  const sections: Section[] = [];
  const lines = readme.split('\n');
  let currentSection: Section | null = null;
  let contentBuffer: string[] = [];
  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      if (currentSection) {
        currentSection.content = contentBuffer.join('\n');
        currentSection.endIndex = lineIndex - 1;
        sections.push(currentSection);
      }
      currentSection = {
        id: `section-${sections.length}`,
        title: headingMatch[2].replace(/[^\w\s]/g, '').trim(),
        content: line,
        startIndex: lineIndex,
        endIndex: lineIndex,
      };
      contentBuffer = [line];
    } else if (currentSection) {
      contentBuffer.push(line);
    } else {
      if (!sections.find(s => s.title === 'Introduction')) {
        currentSection = {
          id: 'section-intro',
          title: 'Introduction',
          content: '',
          startIndex: 0,
          endIndex: 0,
        };
        contentBuffer = [line];
      }
    }
    lineIndex++;
  }

  if (currentSection) {
    currentSection.content = contentBuffer.join('\n');
    currentSection.endIndex = lineIndex - 1;
    sections.push(currentSection);
  }

  return sections;
}

export function ReadmePreview({ readme, repoInfo, onReadmeUpdate, isStreaming }: ReadmePreviewProps) {
  const [view, setView] = useState<'preview' | 'raw' | 'split'>('preview');
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const sections = parseReadmeIntoSections(readme);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(readme);
      setCopied(true);
      toast({ title: "Copied!", description: "README copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", description: "Please try again", variant: "destructive" });
    }
  };

  const handleCopyHtml = async () => {
    if (previewRef.current) {
      try {
        await navigator.clipboard.writeText(previewRef.current.innerHTML);
        setCopiedHtml(true);
        toast({ title: "Copied!", description: "HTML copied to clipboard" });
        setTimeout(() => setCopiedHtml(false), 2000);
      } catch {
        toast({ title: "Failed to copy", description: "Please try again", variant: "destructive" });
      }
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
    toast({ title: "Downloaded!", description: "README.md saved to your device" });
  };

  const handleRegenerateSection = async (section: Section) => {
    setRegeneratingSection(section.id);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-section', {
        body: { section: section.title, sectionContent: section.content, repoInfo },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const lines = readme.split('\n');
      const beforeSection = lines.slice(0, section.startIndex).join('\n');
      const afterSection = lines.slice(section.endIndex + 1).join('\n');
      const newReadme = [beforeSection, data.content, afterSection].filter(Boolean).join('\n');
      onReadmeUpdate(newReadme);
      toast({ title: "Section Regenerated!", description: `"${section.title}" has been improved` });
    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: "Failed to regenerate",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setRegeneratingSection(null);
    }
  };

  const MarkdownContent = ({ withSections = false }: { withSections?: boolean }) => {
    if (!withSections) {
      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme}</ReactMarkdown>;
    }

    return (
      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`relative group rounded-lg transition-all duration-200 ${
              hoveredSection === section.id ? 'bg-primary/5 ring-1 ring-primary/20' : ''
            }`}
            onMouseEnter={() => setHoveredSection(section.id)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            {hoveredSection === section.id && !isStreaming && (
              <div className="absolute -right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerateSection(section)}
                  disabled={regeneratingSection !== null}
                  className="h-8 gap-1.5 bg-card shadow-lg border-primary/30 hover:border-primary hover:bg-primary/10"
                >
                  {regeneratingSection === section.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-xs">Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
                      <span className="text-xs">Regenerate</span>
                    </>
                  )}
                </Button>
              </div>
            )}
            <div className={`p-2 ${regeneratingSection === section.id ? 'opacity-50' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const viewButtons: Array<{ id: 'preview' | 'raw' | 'split'; icon: React.ComponentType<{ className?: string }>; label: string }> = [
    { id: 'preview', icon: Eye, label: 'Preview' },
    { id: 'raw', icon: Code, label: 'Raw' },
    { id: 'split', icon: Columns, label: 'Split' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Repo Info Header */}
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{repoInfo.owner}/{repoInfo.name}</h3>
              <a href={repoInfo.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
              {isStreaming && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Streaming
                </span>
              )}
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

      {/* Regenerate hint */}
      {!isStreaming && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
          <RefreshCw className="w-3 h-3" />
          <span>Hover over any section in Preview mode to regenerate it</span>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
          {viewButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={() => setView(btn.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  view === btn.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{btn.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={copied ? 'animate-copy-flash' : ''}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
            <kbd className="hidden lg:inline ml-1 text-[10px] opacity-50 font-mono">⌘⇧C</kbd>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyHtml}
            className={copiedHtml ? 'animate-copy-flash' : ''}
          >
            {copiedHtml ? <Check className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
            {copiedHtml ? 'Copied' : 'HTML'}
          </Button>
          <Button variant="terminal" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card className="overflow-hidden border-border">
        {view === 'preview' && (
          <div ref={previewRef} className="p-6 md:p-8 markdown-preview max-h-[600px] overflow-y-auto scrollbar-thin">
            <MarkdownContent withSections />
            {isStreaming && <span className="streaming-cursor" />}
          </div>
        )}
        {view === 'raw' && (
          <div className="relative">
            <pre className="p-6 md:p-8 bg-code-bg overflow-x-auto max-h-[600px] scrollbar-thin">
              <code className="text-sm font-mono text-muted-foreground whitespace-pre-wrap break-words">
                {readme}
              </code>
              {isStreaming && <span className="streaming-cursor" />}
            </pre>
          </div>
        )}
        {view === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <pre className="p-4 md:p-6 bg-code-bg overflow-y-auto max-h-[600px] scrollbar-thin">
              <code className="text-sm font-mono text-muted-foreground whitespace-pre-wrap break-words">
                {readme}
              </code>
            </pre>
            <div ref={previewRef} className="p-4 md:p-6 markdown-preview overflow-y-auto max-h-[600px] scrollbar-thin">
              <MarkdownContent />
              {isStreaming && <span className="streaming-cursor" />}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
