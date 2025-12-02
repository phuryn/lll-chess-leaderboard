# Chess Engine API

Stateful HTTP JSON API for chess move validation and game state management.

**Features:** Stateful • Game-ID Based • CORS Enabled

## Overview

This API provides a stateful chess engine that stores games in a database with unique IDs. Each game tracks its complete state including move history, player names, and current position.

### Key Features

- Create new games with optional player names
- Validate move legality and apply moves
- Track complete move history automatically
- Detect checkmate, stalemate, and draws
- Get current game state at any time
- Player statistics tracking support

---

## Endpoints

### POST `/api/new-game`

Create a new chess game and get a unique game ID.

**Request Body (Optional):**

```json
{
  "whitePlayer": "Alice",
  "blackPlayer": "Bob",
  "testType": "Blind mode",
  "testDescription": "Models must track the board state mentally without seeing FEN"
}
```

> **Note:** If `testType` or `testDescription` are not provided, they default to "Unknown"

**Response:**

```json
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "sideToMove": "white",
  "legalMoves": ["a3", "a4", "b3", "b4", "c3", "c4", "..."],
  "status": "continue",
  "whitePlayer": "Alice",
  "blackPlayer": "Bob",
  "testType": "Blind mode",
  "testDescription": "Models must track the board state mentally without seeing FEN"
}
```

**cURL Example:**

```bash
curl -X POST https://csdagwvbuurumpgrqweh.supabase.co/functions/v1/new-game \
  -H "Content-Type: application/json" \
  -d '{
    "whitePlayer": "Alice",
    "blackPlayer": "Bob",
    "testType": "Blind mode",
    "testDescription": "Models must track the board state mentally without seeing FEN"
  }'
```

---

### POST `/api/current-position`

Get the current state of a game by its ID.

**Request Body:**

```json
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**

```json
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
  "sideToMove": "white",
  "legalMoves": ["a3", "a4", "b3", "b4", "..."],
  "status": "continue",
  "winner": null,
  "reason": null,
  "moveHistory": ["e4", "e5"],
  "lastMove": "e5",
  "whitePlayer": "Alice",
  "blackPlayer": "Bob",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:01:00Z"
}
```

> **Note:** `lastMove` returns the last move played, or "-" for a new game with no moves

**cURL Example:**

```bash
curl -X POST https://csdagwvbuurumpgrqweh.supabase.co/functions/v1/current-position \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

---

### POST `/api/apply-move`

Apply a move to a game and get the updated state.

**Request Body:**

```json
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "move": "e4"
}
```

**Response (Legal Move):**

```json
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "sideToMove": "black",
  "legalMoves": ["a6", "a5", "b6", "b5", "c6", "c5", "..."],
  "status": "continue",
  "winner": null,
  "reason": null,
  "moveHistory": ["e4"],
  "whitePlayer": "Alice",
  "blackPlayer": "Bob"
}
```

**Response (Checkmate):**

```json
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "fen": "rnb1kbnr/pppp1ppp/8/8/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
  "sideToMove": "white",
  "legalMoves": [],
  "status": "mate",
  "winner": "black",
  "reason": "checkmate",
  "moveHistory": ["f3", "e5", "g4", "Qh4#"],
  "whitePlayer": "Alice",
  "blackPlayer": "Bob"
}
```

**Status Values:**

| Status | Description |
|--------|-------------|
| `continue` | Game continues, more moves available |
| `mate` | Checkmate - winner specified in response |
| `draw` | Draw by stalemate, repetition, 50-move rule, or insufficient material |
| `invalid_move` | Invalid move attempted - game ends, opponent wins |

**cURL Example:**

```bash
curl -X POST https://csdagwvbuurumpgrqweh.supabase.co/functions/v1/apply-move \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "123e4567-e89b-12d3-a456-426614174000",
    "move": "e4"
  }'
```

---

### POST `/api/legal-moves`

Get all legal moves for a given FEN position (stateless).

**Request Body:**

```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
}
```

**Response:**

```json
{
  "ok": true,
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "sideToMove": "black",
  "legalMoves": [
    "a6", "a5", "b6", "b5", "c6", "c5", "d6", "d5",
    "e6", "e5", "f6", "f5", "g6", "g5", "h6", "h5",
    "Na6", "Nc6", "Nf6", "Nh6"
  ]
}
```

**cURL Example:**

```bash
curl -X POST https://csdagwvbuurumpgrqweh.supabase.co/functions/v1/legal-moves \
  -H "Content-Type: application/json" \
  -d '{
    "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
  }'
```

---

## LLM Integration Guide

### Basic Game Flow

1. **Create new game:** Call `/api/new-game` with optional player names
2. **Make moves:** Send gameId + move to `/api/apply-move`
3. **Get state:** Use `/api/current-position` to fetch current game state
4. **Game ends:** When status is `mate` or `draw`

### Move Notation (SAN)

All moves use Standard Algebraic Notation (SAN). Examples:

| Move | Description |
|------|-------------|
| `e4` | Pawn to e4 |
| `Nf3` | Knight to f3 |
| `Bxe5` | Bishop captures on e5 |
| `O-O` | Kingside castle |
| `O-O-O` | Queenside castle |
| `e8=Q` | Pawn promotion to Queen |

### Error Handling

- **Invalid moves:** Return HTTP 400 with error message
- **Game not found:** Return HTTP 404 with error message
- **Server errors:** Return HTTP 500 with error details

### Important Notes

- ✓ **Stateful:** Games are stored in database with complete history
- ⚠️ **Case sensitive:** SAN notation is case-sensitive. `Nf3` is valid, `nf3` is not.
- ℹ️ **Player names:** Optional but recommended for statistics tracking
- ✓ **CORS enabled:** Can be called from any origin including browser-based clients
- ℹ️ **Test categorization:** Use `testType` and `testDescription` to organize games for analytics and leaderboard tracking

---

*Built with chess.js • Powered by Lovable Cloud*
