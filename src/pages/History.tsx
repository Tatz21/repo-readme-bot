import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FileText, ArrowLeft, Trash2, Eye, Clock, Star, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface HistoryItem {
  id: string;
  repo_url: string;
  repo_name: string;
  repo_owner: string;
  readme_content: string;
  version: number;
  score: number | null;
  created_at: string;
}

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/auth'); return; }

    const { data, error } = await supabase
      .from('readme_history')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('readme_history').delete().eq('id', id);
    if (!error) {
      setItems(items.filter(i => i.id !== id));
      if (selected?.id === id) setSelected(null);
      toast({ title: 'Deleted', description: 'README removed from history' });
    }
  };

  const handleRestore = (item: HistoryItem) => {
    // Navigate to home with the readme in state
    navigate('/', { state: { readme: item.readme_content, repoInfo: { name: item.repo_name, owner: item.repo_owner, description: '', language: '', stars: 0, forks: 0, url: item.repo_url } } });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">History</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {items.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No history yet</p>
            <p className="text-sm text-muted-foreground">Generate a README to see it here</p>
            <Button variant="glow" onClick={() => navigate('/')}>Generate README</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3 md:col-span-1">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${selected?.id === item.id ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setSelected(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{item.repo_owner}/{item.repo_name}</p>
                      <p className="text-xs text-muted-foreground">v{item.version} • {new Date(item.created_at).toLocaleDateString()}</p>
                      {item.score && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary" />
                          <span className="text-xs text-primary font-medium">{item.score}/100</span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="md:col-span-2">
              {selected ? (
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <span className="font-medium text-foreground">{selected.repo_owner}/{selected.repo_name}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleRestore(selected)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                  <div className="p-6 markdown-preview max-h-[600px] overflow-y-auto scrollbar-thin">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.readme_content}</ReactMarkdown>
                  </div>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Select a README to preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
