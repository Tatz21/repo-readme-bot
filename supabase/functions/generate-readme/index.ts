import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RepoData {
  name: string;
  description: string;
  language: string;
  topics: string[];
  license: { name: string } | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  default_branch: string;
  owner: { login: string };
}

interface FileContent {
  name: string;
  type: string;
  content?: string;
}

async function fetchRepoData(owner: string, repo: string): Promise<RepoData> {
  console.log(`Fetching repo data for ${owner}/${repo}`);
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'README-Generator' }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch repository: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchRepoContents(owner: string, repo: string, path: string = ''): Promise<FileContent[]> {
  console.log(`Fetching repo contents for ${owner}/${repo}/${path}`);
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'README-Generator' }
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'README-Generator' }
  });
  if (!response.ok) return '';
  const data = await response.json();
  if (data.content) return atob(data.content);
  return '';
}

async function fetchLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
    headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'README-Generator' }
  });
  if (!response.ok) return {};
  return response.json();
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [/github\.com\/([^\/]+)\/([^\/]+)/, /^([^\/]+)\/([^\/]+)$/];
  for (const pattern of patterns) {
    const match = url.replace(/\.git$/, '').match(pattern);
    if (match) return { owner: match[1], repo: match[2] };
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { repoUrl, options } = await req.json();
    const style = options?.style || 'detailed';
    const sections = options?.sections || {
      features: true, installation: true, usage: true, techStack: true,
      projectStructure: true, contributing: true, license: true, badges: true,
    };

    if (!repoUrl) {
      return new Response(JSON.stringify({ error: 'Repository URL is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return new Response(JSON.stringify({ error: 'Invalid GitHub URL format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { owner, repo } = parsed;
    console.log(`Processing repository: ${owner}/${repo}`);

    const [repoData, contents, languages] = await Promise.all([
      fetchRepoData(owner, repo),
      fetchRepoContents(owner, repo),
      fetchLanguages(owner, repo)
    ]);

    const keyFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle', 'Gemfile', 'composer.json'];
    const foundKeyFiles: Record<string, string> = {};
    for (const file of contents) {
      if (keyFiles.includes(file.name)) {
        const content = await fetchFileContent(owner, repo, file.name);
        if (content) foundKeyFiles[file.name] = content;
      }
    }

    const fileTree = contents.map(f => `${f.type === 'dir' ? '📁' : '📄'} ${f.name}`).join('\n');

    let dependencies: string[] = [];
    if (foundKeyFiles['package.json']) {
      try {
        const pkg = JSON.parse(foundKeyFiles['package.json']);
        dependencies = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})].slice(0, 20);
      } catch { console.log('Failed to parse package.json'); }
    }

    const context = {
      name: repoData.name,
      description: repoData.description || 'No description provided',
      owner: repoData.owner.login,
      language: repoData.language || 'Unknown',
      languages: Object.keys(languages),
      topics: repoData.topics || [],
      license: repoData.license?.name || 'Not specified',
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      url: repoData.html_url,
      defaultBranch: repoData.default_branch,
      fileTree,
      dependencies,
      hasPackageJson: !!foundKeyFiles['package.json'],
      hasRequirementsTxt: !!foundKeyFiles['requirements.txt'],
      hasCargoToml: !!foundKeyFiles['Cargo.toml'],
      hasGoMod: !!foundKeyFiles['go.mod']
    };

    console.log('Context prepared, calling AI with streaming...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert technical writer who creates beautiful README.md files for GitHub repositories.

STYLE: ${style === 'minimal' ? 'Keep it minimal and concise. Only essential information.' : style === 'badges' ? 'Heavy on shields.io badges everywhere. Make it look professional with lots of visual badges.' : 'Detailed and comprehensive with examples and thorough documentation.'}

SECTIONS TO INCLUDE:
${sections.badges ? '- Badges (shields.io style badges for build, license, language, version)' : ''}
${sections.features ? '- Key Features (bulleted list with emojis)' : ''}
${sections.techStack ? '- Tech Stack (with badges/icons)' : ''}
${sections.installation ? '- Installation (step-by-step with code blocks)' : ''}
${sections.usage ? '- Usage (examples with code blocks)' : ''}
${sections.projectStructure ? '- Project Structure (simplified tree)' : ''}
${sections.contributing ? '- Contributing guidelines' : ''}
${sections.license ? '- License section' : ''}

ALWAYS include: A catchy project title with emoji, and a compelling description.

Use proper markdown formatting, code blocks with language hints, and make it visually appealing.
Be specific to the project's actual technology stack.`
          },
          {
            role: 'user',
            content: `Generate a professional README.md for this GitHub repository:

**Repository:** ${context.name}
**Owner:** ${context.owner}
**Description:** ${context.description}
**Main Language:** ${context.language}
**All Languages:** ${context.languages.join(', ')}
**Topics/Tags:** ${context.topics.join(', ') || 'None'}
**License:** ${context.license}
**Stars:** ${context.stars} | **Forks:** ${context.forks}
**URL:** ${context.url}

**File Structure:**
${context.fileTree}

**Dependencies/Packages:** ${context.dependencies.length > 0 ? context.dependencies.join(', ') : 'Not available'}

**Package Managers Detected:**
${context.hasPackageJson ? '- npm/yarn (Node.js)' : ''}
${context.hasRequirementsTxt ? '- pip (Python)' : ''}
${context.hasCargoToml ? '- Cargo (Rust)' : ''}
${context.hasGoMod ? '- Go modules' : ''}

Generate the README now following the specified style and sections.`
          }
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const repoInfo = {
      name: context.name, owner: context.owner, description: context.description,
      language: context.language, stars: context.stars, forks: context.forks, url: context.url,
    };

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        // Send repo info first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'info', repoInfo })}\n\n`));

        if (!aiResponse.body) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'No AI response body' })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });

            let idx: number;
            while ((idx = buf.indexOf('\n')) !== -1) {
              let line = buf.slice(0, idx);
              buf = buf.slice(idx + 1);
              if (line.endsWith('\r')) line = line.slice(0, -1);
              if (line.startsWith(':') || line.trim() === '') continue;
              if (!line.startsWith('data: ')) continue;

              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              try {
                const chunk = JSON.parse(jsonStr);
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', text: content })}\n\n`));
                }
              } catch {
                // partial JSON, skip
              }
            }
          }
        } catch (e) {
          console.error('Stream processing error:', e);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    console.log('Streaming README generation started');

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error in generate-readme:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate README' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
