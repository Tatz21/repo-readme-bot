import { FileText, Search, Sparkles, Check } from 'lucide-react';

interface LoadingStateProps {
  stage: 'fetching' | 'analyzing' | 'generating';
}

export function LoadingState({ stage }: LoadingStateProps) {
  const stages = [
    { id: 'fetching', label: 'Fetching repository data', icon: Search },
    { id: 'analyzing', label: 'Analyzing project structure', icon: FileText },
    { id: 'generating', label: 'Generating README with AI', icon: Sparkles },
  ];

  const currentIndex = stages.findIndex((s) => s.id === stage);

  return (
    <div className="w-full max-w-md mx-auto space-y-6 py-8">
      <div className="space-y-4">
        {stages.map((s, index) => {
          const Icon = s.icon;
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                isCurrent
                  ? 'bg-primary/10 border border-primary/30'
                  : isComplete
                  ? 'bg-secondary/50'
                  : 'bg-secondary/20'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground animate-pulse'
                    : isComplete
                    ? 'bg-terminal-green text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className={`w-5 h-5 ${isCurrent ? 'animate-spin-slow' : ''}`} />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    isCurrent
                      ? 'text-foreground'
                      : isComplete
                      ? 'text-terminal-green'
                      : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </p>
                {isCurrent && (
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary animate-shimmer w-full" 
                         style={{ backgroundSize: '200% 100%' }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
