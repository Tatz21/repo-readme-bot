import { useState } from 'react';
import { RepoInput } from '@/components/RepoInput';
import { ReadmePreview } from '@/components/ReadmePreview';
import { LoadingState } from '@/components/LoadingState';
import { useToast } from '@/hooks/use-toast';
import { FileText, Github, Zap, Wand2 } from 'lucide-react';
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

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'fetching' | 'analyzing' | 'generating'>('fetching');
  const [readme, setReadme] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (url: string) => {
    setIsLoading(true);
    setReadme(null);
    setRepoInfo(null);
    setLoadingStage('fetching');

    try {
      // Simulate stage progression for UX
      setTimeout(() => setLoadingStage('analyzing'), 1500);
      setTimeout(() => setLoadingStage('generating'), 3000);

      const { data, error } = await supabase.functions.invoke('generate-readme', {
        body: { repoUrl: url },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate README');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setReadme(data.readme);
      setRepoInfo(data.repoInfo);
      toast({
        title: "README Generated!",
        description: `Successfully created README for ${data.repoInfo.name}`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Github,
      title: 'Fetch & Analyze',
      description: 'Automatically extracts repo structure, languages, and dependencies',
    },
    {
      icon: Wand2,
      title: 'AI-Powered',
      description: 'Uses advanced AI to generate contextual, professional content',
    },
    {
      icon: Zap,
      title: 'Instant Output',
      description: 'Get a complete README in seconds, ready to use',
    },
  ];

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-glow-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">README<span className="text-gradient">.gen</span></span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-4 pt-16 pb-12">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              <Zap className="w-4 h-4 text-primary" />
              AI-Powered README Generator
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Generate Perfect
              <br />
              <span className="text-gradient">README Files</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Paste any GitHub repository URL and get a professional, 
              comprehensive README.md instantly powered by AI.
            </p>
          </div>
        </section>

        {/* Input */}
        <section className="container mx-auto px-4 pb-12">
          <RepoInput onGenerate={handleGenerate} isLoading={isLoading} />
        </section>

        {/* Loading / Result */}
        <section className="container mx-auto px-4 pb-16">
          {isLoading && <LoadingState stage={loadingStage} />}
          {readme && repoInfo && !isLoading && (
            <ReadmePreview readme={readme} repoInfo={repoInfo} />
          )}
        </section>

        {/* Features (show when no result) */}
        {!readme && !isLoading && (
          <section className="container mx-auto px-4 pb-20">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
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
