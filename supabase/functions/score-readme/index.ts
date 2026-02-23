import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { readme, repoName } = await req.json();
    if (!readme) {
      return new Response(JSON.stringify({ error: 'README content is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
            content: `You are an expert README quality analyzer. Score the README out of 100 and provide actionable suggestions.

Return ONLY valid JSON in this exact format:
{
  "score": <number 0-100>,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "breakdown": [
    {"category": "Structure", "score": <0-20>, "max": 20, "notes": "..."},
    {"category": "Completeness", "score": <0-25>, "max": 25, "notes": "..."},
    {"category": "Clarity", "score": <0-20>, "max": 20, "notes": "..."},
    {"category": "Code Examples", "score": <0-15>, "max": 15, "notes": "..."},
    {"category": "Visual Appeal", "score": <0-20>, "max": 20, "notes": "..."}
  ]
}`
          },
          {
            role: 'user',
            content: `Score this README for "${repoName || 'a project'}":\n\n${readme}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1];
    
    const result = JSON.parse(content.trim());

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in score-readme:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to score README' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
