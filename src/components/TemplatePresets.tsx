import { Code, Terminal, BookOpen, Cpu, Package } from 'lucide-react';
import type { ReadmeOptions } from './StyleOptions';

interface TemplatePresetsProps {
  onSelect: (options: ReadmeOptions, label: string) => void;
}

const templates: Array<{
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  options: ReadmeOptions;
}> = [
  {
    name: 'React',
    icon: Code,
    options: {
      style: 'detailed',
      sections: { features: true, installation: true, usage: true, techStack: true, projectStructure: true, contributing: true, license: true, badges: true },
    },
  },
  {
    name: 'Python',
    icon: Cpu,
    options: {
      style: 'badges',
      sections: { features: true, installation: true, usage: true, techStack: true, projectStructure: false, contributing: true, license: true, badges: true },
    },
  },
  {
    name: 'CLI Tool',
    icon: Terminal,
    options: {
      style: 'minimal',
      sections: { features: true, installation: true, usage: true, techStack: false, projectStructure: false, contributing: false, license: true, badges: false },
    },
  },
  {
    name: 'Library',
    icon: Package,
    options: {
      style: 'badges',
      sections: { features: true, installation: true, usage: true, techStack: true, projectStructure: true, contributing: true, license: true, badges: true },
    },
  },
  {
    name: 'Docs',
    icon: BookOpen,
    options: {
      style: 'detailed',
      sections: { features: true, installation: true, usage: true, techStack: false, projectStructure: true, contributing: true, license: true, badges: false },
    },
  },
];

export function TemplatePresets({ onSelect }: TemplatePresetsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm text-muted-foreground">Templates:</span>
      {templates.map((template) => {
        const Icon = template.icon;
        return (
          <button
            key={template.name}
            onClick={() => onSelect(template.options, template.name)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-sm text-secondary-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95 border border-transparent hover:border-primary/30"
          >
            <Icon className="w-3.5 h-3.5" />
            {template.name}
          </button>
        );
      })}
    </div>
  );
}
