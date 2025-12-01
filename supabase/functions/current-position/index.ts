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

    const { gameId } = await req.json();

    if (!gameId) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'gameId is required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Fetching game:', gameId);

    // Fetch game from database
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error || !game) {
      console.error('Game not found:', gameId, error);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Game not found' 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Game found:', game.id, 'Status:', game.status);

    return new Response(
      JSON.stringify({
        gameId: game.id,
        fen: game.fen,
        sideToMove: game.side_to_move,
        legalMoves: game.legal_moves,
        status: game.status,
        winner: game.winner,
        reason: game.reason,
        moveHistory: game.move_history,
        whitePlayer: game.white_player,
        blackPlayer: game.black_player,
        createdAt: game.created_at,
        updatedAt: game.updated_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in current-position function:', error);
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