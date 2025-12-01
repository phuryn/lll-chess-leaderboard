import { Chess } from 'npm:chess.js';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional player names
    const body = await req.json().catch(() => ({}));
    const { whitePlayer, blackPlayer } = body;

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