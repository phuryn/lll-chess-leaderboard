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

    const { gameId, move } = await req.json();

    if (!gameId || !move) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'gameId and move are required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Applying move to game:', gameId, 'Move:', move);

    // Fetch current game state
    const { data: game, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (fetchError || !game) {
      console.error('Game not found:', gameId, fetchError);
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

    // Initialize chess with current position
    const chess = new Chess(game.fen);
    
    // Attempt to make the move
    const result = chess.move(move);
    
    if (!result) {
      console.log('Invalid move:', move, 'for position:', game.fen);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Invalid move: ${move}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Move applied successfully:', result.san);

    // Get new game state
    const newFen = chess.fen();
    const legalMoves = chess.moves();
    
    let status = 'continue';
    let winner = null;
    let reason = null;
    
    if (chess.isCheckmate()) {
      status = 'mate';
      winner = game.side_to_move; // Previous side won
      reason = 'checkmate';
      console.log('Checkmate! Winner:', winner);
    } else if (chess.isStalemate()) {
      status = 'draw';
      reason = 'stalemate';
      console.log('Stalemate!');
    } else if (chess.isDraw()) {
      status = 'draw';
      if (chess.isThreefoldRepetition()) {
        reason = 'threefold_repetition';
      } else if (chess.isInsufficientMaterial()) {
        reason = 'insufficient_material';
      } else {
        reason = '50_move_rule';
      }
      console.log('Draw:', reason);
    }

    const newSideToMove = chess.turn() === 'w' ? 'white' : 'black';
    const updatedMoveHistory = [...game.move_history, result.san];

    // Update game in database
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({
        fen: newFen,
        status,
        side_to_move: newSideToMove,
        winner,
        reason,
        legal_moves: legalMoves,
        move_history: updatedMoveHistory,
      })
      .eq('id', gameId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Game updated successfully');

    return new Response(
      JSON.stringify({
        gameId: updatedGame.id,
        fen: updatedGame.fen,
        sideToMove: updatedGame.side_to_move,
        legalMoves: updatedGame.legal_moves,
        status: updatedGame.status,
        winner: updatedGame.winner,
        reason: updatedGame.reason,
        moveHistory: updatedGame.move_history,
        whitePlayer: updatedGame.white_player,
        blackPlayer: updatedGame.black_player,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in apply-move function:', error);
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
