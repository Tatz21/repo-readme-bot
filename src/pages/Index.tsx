import { useState, useEffect } from 'react';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { useLocation } from 'react-router-dom';
import { RepoInput } from '@/components/RepoInput';
import { ReadmePreview } from '@/components/ReadmePreview';
import { LoadingState } from '@/components/LoadingState';
import { StyleOptions, defaultOptions, type ReadmeOptions } from '@/components/StyleOptions';
import { TemplatePresets } from '@/components/TemplatePresets';
import { ShareDialog } from '@/components/ShareDialog';
import { BulkGenerator } from '@/components/BulkGenerator';
import { ReadmeScore } from '@/components/ReadmeScore';

import { ImportReadme } from '@/components/ImportReadme';
import { SectionEditor } from '@/components/SectionEditor';
import { useToast } from '@/hooks/use-toast';

import { FileText, Zap, Wand2, Settings2, RefreshCw, Sparkles, Github, Share2, Layers, BarChart3, Upload } from 'lucide-react';
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
  const [showShare, setShowShare] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showScore, setShowScore] = useState(false);
  
  const [showImport, setShowImport] = useState(false);
  const [editingSection, setEditingSection] = useState<{ title: string; content: string } | null>(null);
  const [lastUrl, setLastUrl] = useState<string>('');
  
  
  const { toast } = useToast();
  const location = useLocation();
  


  // Restore from history navigation
  useEffect(() => {
    const state = location.state as any;
    if (state?.readme && state?.repoInfo) {
      setReadme(state.readme);
      setRepoInfo(state.repoInfo);
      setLastUrl(state.repoInfo.url);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

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
    if (!regenerate) { setReadme(''); setRepoInfo(null); }
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
        try { const d = await response.json(); errorMsg = d.error || errorMsg; } catch {}
        throw new Error(errorMsg);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let readmeContent = '';
      let updateTimer: number | null = null;
      let currentRepoInfo: RepoInfo | null = null;

      const flushReadme = () => { setReadme(readmeContent); updateTimer = null; };

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
            if (parsed.type === 'info') { currentRepoInfo = parsed.repoInfo; setRepoInfo(parsed.repoInfo); }
            else if (parsed.type === 'content') {
              readmeContent += parsed.text;
              if (!updateTimer) updateTimer = window.setTimeout(flushReadme, 50);
            } else if (parsed.type === 'error') throw new Error(parsed.error);
          } catch (e) { if (e instanceof SyntaxError) continue; throw e; }
        }
      }

      if (updateTimer) clearTimeout(updateTimer);
      if (readmeContent) {
        setReadme(readmeContent);
        toast({ title: regenerate ? "README Regenerated!" : "README Generated!" });

      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({ title: "Generation Failed", description: error instanceof Error ? error.message : 'Something went wrong', variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleOptionsChange = (newOptions: ReadmeOptions) => {
    setOptions(newOptions);
    toast({ title: "Settings Updated", description: "Generate again to apply" });
  };

  const handleTemplateSelect = (templateOptions: ReadmeOptions, label: string) => {
    setOptions(templateOptions);
    toast({ title: `${label} Template Applied` });
  };

  const handleReadmeUpdate = (newReadme: string) => setReadme(newReadme);

  const handleSectionEdit = (title: string, content: string) => {
    setEditingSection({ title, content });
  };

  const handleSectionEditUpdate = (newContent: string) => {
    if (!editingSection) return;
    const lines = readme.split('\n');
    const sections = parseIntoSections(readme);
    const section = sections.find(s => s.title === editingSection.title);
    if (section) {
      const before = lines.slice(0, section.startIndex).join('\n');
      const after = lines.slice(section.endIndex + 1).join('\n');
      setReadme([before, newContent, after].filter(Boolean).join('\n'));
    }
    setEditingSection(null);
  };


  const features = [
    { icon: Github, title: 'Fetch & Analyze', description: 'Automatically extracts repo structure, languages, and dependencies' },
    { icon: Wand2, title: 'AI-Powered', description: 'Uses advanced AI to generate contextual, professional content' },
    { icon: Zap, title: 'Instant Output', description: 'Get a complete README in seconds, ready to use' },
    { icon: Settings2, title: 'Customizable', description: 'Choose your style and pick which sections to include' },
    { icon: RefreshCw, title: 'Section Editing', description: 'Click any section to refine it with AI using custom prompts' },
    { icon: Sparkles, title: 'Score & Share', description: 'Get quality scores, share via link, and bulk generate' },
  ];

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {showOptions && <StyleOptions options={options} onChange={handleOptionsChange} onClose={() => setShowOptions(false)} />}
      {showShare && repoInfo && <ShareDialog readme={readme} repoName={repoInfo.name} repoUrl={repoInfo.url} branding={{ logo_url: '', footer: '' }} onClose={() => setShowShare(false)} />}
      {showBulk && <BulkGenerator onClose={() => setShowBulk(false)} options={options} />}
      {showScore && <ReadmeScore readme={readme} repoName={repoInfo?.name || ''} onClose={() => setShowScore(false)} />}
      
      {showImport && <ImportReadme onImport={(r) => { setReadme(r); setRepoInfo({ name: 'Imported', owner: 'user', description: 'Imported README', language: '', stars: 0, forks: 0, url: '' }); }} onClose={() => setShowImport(false)} />}
      {editingSection && repoInfo && (
        <SectionEditor
          sectionTitle={editingSection.title}
          sectionContent={editingSection.content}
          repoInfo={repoInfo}
          onUpdate={handleSectionEditUpdate}
          onClose={() => setEditingSection(null)}
        />
      )}

      {/* Background */}
      <BackgroundPaths />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header - sticky mobile app style */}
        <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/90">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 group cursor-default">
              <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">README<span className="text-gradient">.gen</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => setShowBulk(true)} className="h-9 w-9 sm:hidden">
                <Layers className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowImport(true)} className="h-9 w-9 sm:hidden">
                <Upload className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowOptions(true)} className="h-9 w-9 sm:hidden">
                <Settings2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBulk(true)} className="gap-1.5 hidden sm:flex">
                <Layers className="w-4 h-4" />
                Bulk
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-1.5 hidden sm:flex">
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowOptions(true)} className="gap-1.5 hidden sm:flex">
                <Settings2 className="w-4 h-4" />
                Customize
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero */}
          <section className="px-4 pt-8 pb-6 sm:pt-16 sm:pb-12 sm:container sm:mx-auto">
            <div className="text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm font-medium">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                AI-Powered README Generator
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Generate Perfect<br />
                <span className="text-gradient animated-gradient-text">README Files</span>
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Paste any GitHub repo URL and get a professional README.md instantly.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>Style:</span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize">{options.style}</span>
                <button onClick={() => setShowOptions(true)} className="text-primary hover:underline">Change</button>
              </div>
            </div>
          </section>

          {/* Input */}
          <section className="px-4 pb-4 sm:pb-6 sm:container sm:mx-auto">
            <RepoInput onGenerate={(url) => handleGenerate(url)} isLoading={isLoading} />
          </section>

          {/* Template Presets */}
          {!readme && !isLoading && (
            <section className="px-4 pb-6 sm:pb-8 sm:container sm:mx-auto">
              <TemplatePresets onSelect={handleTemplateSelect} />
            </section>
          )}

          {/* Keyboard shortcuts hint - desktop only */}
          {!readme && !isLoading && (
            <section className="hidden sm:block container mx-auto px-4 pb-8">
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

          {/* Action bar - sticky bottom on mobile */}
          {readme && !isLoading && lastUrl && (
            <section className="sticky bottom-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/50 px-4 py-3 sm:relative sm:border-t-0 sm:bg-transparent sm:backdrop-blur-none sm:container sm:mx-auto sm:pb-4">
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowOptions(true)} className="gap-1.5 flex-1 sm:flex-none">
                  <Settings2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
                <Button variant="glow" size="sm" onClick={() => handleGenerate(lastUrl, true)} className="gap-1.5 flex-1 sm:flex-none">
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Regenerate</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowShare(true)} className="gap-1.5 flex-1 sm:flex-none">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowScore(true)} className="gap-1.5 flex-1 sm:flex-none">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Score</span>
                </Button>
              </div>
            </section>
          )}

          {/* Loading / Result */}
          <section className="px-4 pb-8 sm:pb-16 sm:container sm:mx-auto">
            {isLoading && !readme && <LoadingState />}
            {readme && repoInfo && (
              <ReadmePreview
                readme={readme}
                repoInfo={repoInfo}
                onReadmeUpdate={handleReadmeUpdate}
                isStreaming={isStreaming}
                onSectionEdit={handleSectionEdit}
              />
            )}
          </section>

          {/* How to Use */}
          {!readme && !isLoading && (
            <section className="px-4 pb-10 sm:pb-16 sm:container sm:mx-auto">
              <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">How to Use</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Three simple steps</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-8 max-w-4xl mx-auto">
                {[
                  { step: '1', title: 'Paste URL', description: 'Copy any public GitHub repo URL and paste it above.' },
                  { step: '2', title: 'Customize', description: 'Pick a style and toggle the sections you want.' },
                  { step: '3', title: 'Generate', description: 'Get a polished README instantly. Edit, score, share, or download.' },
                ].map((item) => (
                  <div key={item.step} className="flex flex-row sm:flex-col items-center sm:text-center p-4 sm:p-6 rounded-xl bg-card/50 sm:bg-transparent border border-border/50 sm:border-0 gap-4 sm:gap-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center sm:mb-4 text-primary font-bold text-base sm:text-lg">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-0.5 sm:mb-2 text-base sm:text-lg">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Features */}
          {!readme && !isLoading && (
            <section className="px-4 pb-12 sm:pb-20 sm:container sm:mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-5xl mx-auto">
                {features.map((feature) => (
                  <div key={feature.title} className="group p-4 sm:p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-secondary flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/10 transition-all duration-300">
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <footer className="border-t border-border/50">
          <div className="px-4 py-4 sm:py-6">
            <p className="text-center text-xs sm:text-sm text-muted-foreground">
              Built with <span className="text-primary">♥</span> • Powered by AI
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Helper to parse sections (duplicated for use in handleSectionEditUpdate)
function parseIntoSections(readme: string) {
  const sections: { title: string; startIndex: number; endIndex: number }[] = [];
  const lines = readme.split('\n');
  let current: { title: string; startIndex: number; endIndex: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      if (current) { current.endIndex = i - 1; sections.push(current); }
      current = { title: match[2].replace(/[^\w\s]/g, '').trim(), startIndex: i, endIndex: i };
    }
  }
  if (current) { current.endIndex = lines.length - 1; sections.push(current); }
  return sections;
}
