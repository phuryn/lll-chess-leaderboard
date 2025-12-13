import { Chess } from 'npm:chess.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify API key
  const apiKey = req.headers.get('x-api-key');
  const expectedKey = Deno.env.get('CHESS_API_SECRET');
  
  if (!apiKey || apiKey !== expectedKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Unauthorized' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { fen } = await req.json();

    if (!fen) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Missing required field: fen' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create a new chess instance and load the FEN
    const chess = new Chess();
    
    try {
      chess.load(fen);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Invalid FEN: ${errorMsg}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const sideToMove = chess.turn() === 'w' ? 'white' : 'black';
    const legalMoves = chess.moves();

    return new Response(
      JSON.stringify({
        ok: true,
        fen,
        sideToMove,
        legalMoves,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in legal-moves function:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: errorMsg 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
