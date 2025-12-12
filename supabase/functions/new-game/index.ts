import { Chess } from 'npm:chess.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('CHESS_API_SECRET');
    
    if (!apiKey || apiKey !== expectedKey) {
      console.log('Unauthorized request: invalid or missing API key');
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized: Invalid or missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional player names and test info
    const body = await req.json().catch(() => ({}));
    const { whitePlayer, blackPlayer, testType, testDescription } = body;

    // Create a new chess instance at starting position
    const chess = new Chess();
    const fen = chess.fen();
    const legalMoves = chess.moves();
    
    console.log('Creating new game', { whitePlayer, blackPlayer, legalMoves: legalMoves.length });

    // Insert new game into database
    const { data: game, error } = await supabase
      .from('games')
      .insert({
        fen,
        status: 'continue',
        side_to_move: 'white',
        legal_moves: legalMoves,
        white_player: whitePlayer || null,
        black_player: blackPlayer || null,
        test_type: testType || 'Unknown',
        test_desc: testDescription || 'Unknown',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Game created successfully:', game.id);

    return new Response(
      JSON.stringify({
        gameId: game.id,
        fen: game.fen,
        sideToMove: game.side_to_move,
        legalMoves: game.legal_moves,
        status: game.status,
        whitePlayer: game.white_player,
        blackPlayer: game.black_player,
        testType: game.test_type,
        testDescription: game.test_desc,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in new-game function:', error);
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