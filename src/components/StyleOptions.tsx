import { useState } from 'react';
import { Check, Sparkles, FileText, Award, Code, BookOpen, Users, Scale, Terminal, Rocket, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ReadmeOptions {
  style: 'minimal' | 'detailed' | 'badges';
  sections: {
    features: boolean;
    installation: boolean;
    usage: boolean;
    techStack: boolean;
    projectStructure: boolean;
    contributing: boolean;
    license: boolean;
    badges: boolean;
  };
}

interface StyleOptionsProps {
  options: ReadmeOptions;
  onChange: (options: ReadmeOptions) => void;
  onClose: () => void;
}

const styles = [
  {
    id: 'minimal' as const,
    name: 'Minimal',
    icon: FileText,
    description: 'Clean and concise. Just the essentials.',
    gradient: 'from-slate-500 to-zinc-600',
  },
  {
    id: 'detailed' as const,
    name: 'Detailed',
    icon: BookOpen,
    description: 'Comprehensive documentation with examples.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'badges' as const,
    name: 'Badge Heavy',
    icon: Award,
    description: 'Lots of shields.io badges for that pro look.',
    gradient: 'from-purple-500 to-pink-600',
  },
];

const sections = [
  { id: 'badges', name: 'Badges', icon: Award },
  { id: 'features', name: 'Features', icon: Sparkles },
  { id: 'techStack', name: 'Tech Stack', icon: Code },
  { id: 'installation', name: 'Installation', icon: Terminal },
  { id: 'usage', name: 'Usage', icon: Rocket },
  { id: 'projectStructure', name: 'Project Structure', icon: FileText },
  { id: 'contributing', name: 'Contributing', icon: Users },
  { id: 'license', name: 'License', icon: Scale },
] as const;

export function StyleOptions({ options, onChange, onClose }: StyleOptionsProps) {
  const [localOptions, setLocalOptions] = useState(options);

  const handleStyleChange = (style: ReadmeOptions['style']) => {
    setLocalOptions({ ...localOptions, style });
  };

  const handleSectionToggle = (sectionId: keyof ReadmeOptions['sections']) => {
    setLocalOptions({
      ...localOptions,
      sections: {
        ...localOptions.sections,
        [sectionId]: !localOptions.sections[sectionId],
      },
    });
  };

  const handleApply = () => {
    onChange(localOptions);
    onClose();
  };

  const selectAll = () => {
    const allTrue = Object.fromEntries(
      Object.keys(localOptions.sections).map((k) => [k, true])
    ) as ReadmeOptions['sections'];
    setLocalOptions({ ...localOptions, sections: allTrue });
  };

  const selectNone = () => {
    const allFalse = Object.fromEntries(
      Object.keys(localOptions.sections).map((k) => [k, false])
    ) as ReadmeOptions['sections'];
    setLocalOptions({ ...localOptions, sections: allFalse });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Customize README</h2>
            <p className="text-sm text-muted-foreground">Choose style and sections</p>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* Style Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Style</h3>
            <div className="grid grid-cols-3 gap-3">
              {styles.map((style) => {
                const Icon = style.icon;
                const isSelected = localOptions.style === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => handleStyleChange(style.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-semibold text-foreground">{style.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{style.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Sections</h3>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-primary hover:underline">
                  Select All
                </button>
                <span className="text-muted-foreground">|</span>
                <button onClick={selectNone} className="text-xs text-primary hover:underline">
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isSelected = localOptions.sections[section.id];
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionToggle(section.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}>
                      {isSelected ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    </div>
                    <span className="text-sm font-medium">{section.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-secondary/30">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="glow" onClick={handleApply}>
            Apply Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export const defaultOptions: ReadmeOptions = {
  style: 'detailed',
  sections: {
    features: true,
    installation: true,
    usage: true,
    techStack: true,
    projectStructure: true,
    contributing: true,
    license: true,
    badges: true,
  },
};
