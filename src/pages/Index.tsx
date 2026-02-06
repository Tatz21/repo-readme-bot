import { useState, useEffect } from 'react';
import { RepoInput } from '@/components/RepoInput';
import { ReadmePreview } from '@/components/ReadmePreview';
import { LoadingState } from '@/components/LoadingState';
import { StyleOptions, defaultOptions, type ReadmeOptions } from '@/components/StyleOptions';
import { TemplatePresets } from '@/components/TemplatePresets';
import { useToast } from '@/hooks/use-toast';
import { FileText, Zap, Wand2, Settings2, RefreshCw, Sparkles, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface RepoInfo {
  name: string;
  owner: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
}

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [readme, setReadme] = useState<string>('');
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [options, setOptions] = useState<ReadmeOptions>(defaultOptions);
  const [showOptions, setShowOptions] = useState(false);
  const [lastUrl, setLastUrl] = useState<string>('');
  const { toast } = useToast();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'Enter' && lastUrl && !isLoading) {
        e.preventDefault();
        handleGenerate(lastUrl, true);
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'c' && readme) {
        e.preventDefault();
        navigator.clipboard.writeText(readme);
        toast({ title: "Copied!", description: "README copied to clipboard" });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lastUrl, isLoading, readme]);

  const handleGenerate = async (url: string, regenerate = false) => {
    setIsLoading(true);
    setIsStreaming(true);
    if (!regenerate) {
      setReadme('');
      setRepoInfo(null);
    }
    setLastUrl(url);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-readme`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ repoUrl: url, options }),
        }
      );

      if (!response.ok) {
        let errorMsg = 'Failed to generate README';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let readmeContent = '';
      let updateTimer: number | null = null;

      const flushReadme = () => {
        setReadme(readmeContent);
        updateTimer = null;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'info') {
              setRepoInfo(parsed.repoInfo);
            } else if (parsed.type === 'content') {
              readmeContent += parsed.text;
              if (!updateTimer) {
                updateTimer = window.setTimeout(flushReadme, 50);
              }
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // Final flush
      if (updateTimer) clearTimeout(updateTimer);
      if (readmeContent) {
        setReadme(readmeContent);
        toast({
          title: regenerate ? "README Regenerated!" : "README Generated!",
          description: "Successfully created README",
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleOptionsChange = (newOptions: ReadmeOptions) => {
    setOptions(newOptions);
    toast({ title: "Settings Updated", description: "Generate again to apply the new style" });
  };

  const handleTemplateSelect = (templateOptions: ReadmeOptions, label: string) => {
    setOptions(templateOptions);
    toast({ title: `${label} Template Applied`, description: "Generate a README with this template" });
  };

  const handleReadmeUpdate = (newReadme: string) => {
    setReadme(newReadme);
  };

  const features = [
    { icon: Github, title: 'Fetch & Analyze', description: 'Automatically extracts repo structure, languages, and dependencies' },
    { icon: Wand2, title: 'AI-Powered', description: 'Uses advanced AI to generate contextual, professional content' },
    { icon: Zap, title: 'Instant Output', description: 'Get a complete README in seconds, ready to use' },
    { icon: Settings2, title: 'Customizable', description: 'Choose your style and pick which sections to include' },
    { icon: RefreshCw, title: 'Regenerate Sections', description: 'Hover over any section to regenerate just that part' },
    { icon: Sparkles, title: 'Multiple Styles', description: 'Minimal, detailed, or badge-heavy — your choice' },
  ];

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {showOptions && (
        <StyleOptions options={options} onChange={handleOptionsChange} onClose={() => setShowOptions(false)} />
      )}

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-glow-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm bg-background/80">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">README<span className="text-gradient">.gen</span></span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOptions(true)}
                className="gap-2 hover:scale-105 active:scale-95 transition-transform"
              >
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Customize</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-4 pt-16 pb-12">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
              <Zap className="w-4 h-4 text-primary" />
              AI-Powered README Generator
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Generate Perfect
              <br />
              <span className="text-gradient animated-gradient-text">README Files</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Paste any GitHub repository URL and get a professional,
              comprehensive README.md instantly powered by AI.
            </p>

            {/* Style + template indicators */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Style:</span>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize">
                {options.style}
              </span>
              <button onClick={() => setShowOptions(true)} className="text-primary hover:underline">
                Change
              </button>
            </div>
          </div>
        </section>

        {/* Input */}
        <section className="container mx-auto px-4 pb-6">
          <RepoInput onGenerate={(url) => handleGenerate(url)} isLoading={isLoading} />
        </section>

        {/* Template Presets */}
        {!readme && !isLoading && (
          <section className="container mx-auto px-4 pb-8">
            <TemplatePresets onSelect={handleTemplateSelect} />
          </section>
        )}

        {/* Keyboard shortcuts hint */}
        {!readme && !isLoading && (
          <section className="container mx-auto px-4 pb-8">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-mono text-[10px]">⌘ Enter</kbd>
                <span>Regenerate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-mono text-[10px]">⌘ ⇧ C</kbd>
                <span>Copy README</span>
              </span>
            </div>
          </section>
        )}

        {/* Regenerate with new options button */}
        {readme && !isLoading && lastUrl && (
          <section className="container mx-auto px-4 pb-4">
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOptions(true)}
                className="gap-2 hover:scale-105 active:scale-95 transition-transform"
              >
                <Settings2 className="w-4 h-4" />
                Adjust Settings
              </Button>
              <Button
                variant="glow"
                size="sm"
                onClick={() => handleGenerate(lastUrl, true)}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate Full README
                <kbd className="hidden sm:inline ml-1 text-[10px] opacity-60 font-mono">⌘↵</kbd>
              </Button>
            </div>
          </section>
        )}

        {/* Loading / Result */}
        <section className="container mx-auto px-4 pb-16">
          {isLoading && !readme && <LoadingState />}
          {readme && repoInfo && (
            <ReadmePreview
              readme={readme}
              repoInfo={repoInfo}
              onReadmeUpdate={handleReadmeUpdate}
              isStreaming={isStreaming}
            />
          )}
        </section>

        {/* Features (show when no result) */}
        {!readme && !isLoading && (
          <section className="container mx-auto px-4 pb-20">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-border/50">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              Built with <span className="text-primary">♥</span> • Powered by AI
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
