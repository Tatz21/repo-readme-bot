import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, sectionContent, repoInfo, instruction } = await req.json();

    if (!section || !repoInfo) {
      return new Response(
        JSON.stringify({ error: 'Section and repo info are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Regenerating section: ${section} for ${repoInfo.name}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `You are an expert technical writer. Regenerate ONLY the "${section}" section for a GitHub README.

**Repository:** ${repoInfo.name}
**Owner:** ${repoInfo.owner}
**Description:** ${repoInfo.description}
**Main Language:** ${repoInfo.language}

**Current section content:**
${sectionContent || 'No existing content'}

${instruction ? `**User instruction:** ${instruction}` : ''}

Generate an improved, polished version of just this section. Start directly with the section heading (##) and content. Do not include any other sections. Make it engaging, clear, and professional.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const newContent = aiData.choices?.[0]?.message?.content || '';

    console.log('Section regenerated successfully');

    return new Response(
      JSON.stringify({ content: newContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in regenerate-section:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to regenerate section' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
