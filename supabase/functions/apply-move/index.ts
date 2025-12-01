import { Chess } from 'npm:chess.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fen, move } = await req.json();

    if (!fen || !move) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Missing required fields: fen and move' 
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

    // Get side to move before applying the move
    const sideToMove = chess.turn() === 'w' ? 'white' : 'black';

    // Try to apply the move
    const moveResult = chess.move(move);

    // If move is invalid
    if (moveResult === null) {
      return new Response(
        JSON.stringify({
          ok: true,
          status: 'invalid_move',
          fen: fen, // Return original FEN
          sideToMove: sideToMove,
          winner: null,
          reason: 'Illegal move',
          legalMoves: chess.moves(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Move was valid, get the new state
    const newFen = chess.fen();
    const newSideToMove = chess.turn() === 'w' ? 'white' : 'black';
    const legalMoves = chess.moves();

    // Determine game status
    let status = 'continue';
    let winner = null;
    let reason = null;

    if (chess.isCheckmate()) {
      status = 'mate';
      winner = sideToMove; // The side that just moved wins
      reason = 'Checkmate';
    } else if (chess.isStalemate()) {
      status = 'stalemate';
      reason = 'Stalemate';
    } else if (chess.isDraw()) {
      status = 'game_over';
      if (chess.isThreefoldRepetition()) {
        reason = 'Threefold repetition';
      } else if (chess.isInsufficientMaterial()) {
        reason = 'Insufficient material';
      } else {
        reason = 'Draw by 50-move rule';
      }
    } else if (chess.isGameOver()) {
      status = 'game_over';
      reason = 'Game over';
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status,
        fen: newFen,
        sideToMove: newSideToMove,
        winner,
        reason,
        legalMoves,
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
