import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Github, Sparkles, Loader2 } from 'lucide-react';

interface RepoInputProps {
  onGenerate: (url: string) => void;
  isLoading: boolean;
}

export function RepoInput({ onGenerate, isLoading }: RepoInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onGenerate(url.trim());
    }
  };

  const placeholderExamples = [
    'https://github.com/facebook/react',
    'https://github.com/vercel/next.js',
    'https://github.com/tailwindlabs/tailwindcss',
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative glow-border rounded-xl">
          <div className="relative flex items-center bg-card rounded-xl overflow-hidden">
            <div className="pl-4 text-muted-foreground">
              <Github className="w-5 h-5" />
            </div>
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a GitHub repository URL..."
              className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 h-14 text-base px-3"
              disabled={isLoading}
            />
            <div className="pr-2">
              <Button
                type="submit"
                variant="glow"
                size="lg"
                disabled={!url.trim() || isLoading}
                className="min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">Try:</span>
        {placeholderExamples.map((example) => (
          <button
            key={example}
            onClick={() => setUrl(example)}
            className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-mono text-xs truncate max-w-[200px]"
            disabled={isLoading}
          >
            {example.replace('https://github.com/', '')}
          </button>
        ))}
      </div>
    </div>
  );
}
