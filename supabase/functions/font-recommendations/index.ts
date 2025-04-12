import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Configuration, OpenAIApi } from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fonts } = await req.json();

    if (!Array.isArray(fonts)) {
      throw new Error('Invalid request format');
    }

    const openai = new OpenAIApi(new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    }));

    const recommendations = await Promise.all(
      fonts.map(async (fontFamily) => {
        const prompt = `Suggest 3 fonts that would pair well with ${fontFamily}. Consider font classification, style, and common use cases. Return only the font names as a comma-separated list.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 50,
        });

        const response = completion.choices[0]?.message?.content || '';
        return response.split(',').map(font => font.trim());
      })
    );

    return new Response(
      JSON.stringify(recommendations),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});