import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Download, Check, Code, Eye, ExternalLink, Star, GitFork, RefreshCw, Loader2, Wand2 } from 'lucide-react';
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
      // Save previous section
      if (currentSection) {
        currentSection.content = contentBuffer.join('\n');
        currentSection.endIndex = lineIndex - 1;
        sections.push(currentSection);
      }

      // Start new section
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
      // Content before first heading (intro)
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

  // Save last section
  if (currentSection) {
    currentSection.content = contentBuffer.join('\n');
    currentSection.endIndex = lineIndex - 1;
    sections.push(currentSection);
  }

  return sections;
}

export function ReadmePreview({ readme, repoInfo, onReadmeUpdate }: ReadmePreviewProps) {
  const [view, setView] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const { toast } = useToast();

  const sections = parseReadmeIntoSections(readme);

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

  const handleRegenerateSection = async (section: Section) => {
    setRegeneratingSection(section.id);

    try {
      const { data, error } = await supabase.functions.invoke('regenerate-section', {
        body: {
          section: section.title,
          sectionContent: section.content,
          repoInfo,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Replace the section in the full readme
      const lines = readme.split('\n');
      const beforeSection = lines.slice(0, section.startIndex).join('\n');
      const afterSection = lines.slice(section.endIndex + 1).join('\n');
      
      const newReadme = [beforeSection, data.content, afterSection]
        .filter(Boolean)
        .join('\n');

      onReadmeUpdate(newReadme);

      toast({
        title: "Section Regenerated!",
        description: `"${section.title}" has been improved`,
      });
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

  // Custom renderer for markdown that adds section hover/regenerate functionality
  const MarkdownWithSections = () => {
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
            {/* Regenerate button */}
            {hoveredSection === section.id && (
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

      {/* Regenerate hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
        <RefreshCw className="w-3 h-3" />
        <span>Hover over any section in Preview mode to regenerate it</span>
      </div>

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
            <MarkdownWithSections />
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
