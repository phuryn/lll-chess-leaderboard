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

    const { gameId, move } = await req.json();

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

    // Check if move is empty or null - treat as invalid move
    if (!move || move.trim() === '') {
      console.log('Empty or null move provided for game:', gameId);
      
      // Determine winner (opponent of current side to move)
      const winner = game.side_to_move === 'white' ? 'black' : 'white';
      const updatedMoveHistory = [...game.move_history, '(empty)??']; // Mark as invalid empty move
      
      // Update game as finished in database
      const { data: updatedGame, error: updateError } = await supabase
        .from('games')
        .update({
          status: 'invalid_move',
          winner,
          reason: 'invalid_move',
          move_history: updatedMoveHistory,
          legal_moves: game.legal_moves, // Keep current legal moves for reference
        })
        .eq('id', gameId)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log('Game ended by empty move. Winner:', winner);

      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Invalid move: empty or null move provided',
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
          status: 200, // Domain-level outcome
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize chess with current position
    const chess = new Chess(game.fen);
    
    // Attempt to make the move
    let result;
    try {
      result = chess.move(move);
    } catch (moveError) {
      // chess.js 1.4.0 throws on invalid moves
      result = null;
    }
    
    if (!result) {
      console.log('Invalid move:', move, 'for position:', game.fen);
      
      // Determine winner (opponent of current side to move)
      const winner = game.side_to_move === 'white' ? 'black' : 'white';
      const updatedMoveHistory = [...game.move_history, `${move}??`]; // Mark as invalid
      
      // Update game as finished in database
      const { data: updatedGame, error: updateError } = await supabase
        .from('games')
        .update({
          status: 'invalid_move',
          winner,
          reason: 'invalid_move',
          move_history: updatedMoveHistory,
          legal_moves: game.legal_moves, // Keep current legal moves for reference
        })
        .eq('id', gameId)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log('Game ended by invalid move. Winner:', winner);

      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Invalid move: ${move}`,
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
          status: 200, // Domain-level outcome
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
