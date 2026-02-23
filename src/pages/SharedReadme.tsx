import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingState } from '@/components/LoadingState';
import { FileText, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SharedReadme() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: readme, error } = await supabase
        .from('shared_readmes' as any)
        .select('*')
        .eq('slug', slug)
        .single();
      if (!error && readme) {
        setData(readme);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><LoadingState /></div>;

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">README not found</p>
          <p className="text-sm text-muted-foreground">This link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground">{data.repo_name}</span>
              <span className="text-xs text-muted-foreground ml-2">README</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            {data.views} views
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {data.branding?.logo_url && (
          <div className="mb-6 flex justify-center">
            <img src={data.branding.logo_url} alt="Logo" className="max-h-16 rounded" />
          </div>
        )}
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 markdown-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.readme_content}</ReactMarkdown>
        </div>
        {data.branding?.footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {data.branding.footer}
          </div>
        )}
      </main>
    </div>
  );
}
