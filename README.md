# LLM Chess Benchmark

A chess engine API designed for benchmarking LLM chess capabilities via n8n orchestration. Models play chess by outputting moves in Standard Algebraic Notation (SAN), and invalid moves result in automatic losses.

## Overview

- **Stateful HTTP JSON API** using [chess.js](https://github.com/jhlywa/chess.js)
- **Game persistence** with PostgreSQL (via Supabase)
- **Move validation** using Standard Algebraic Notation (SAN)
- **Game state detection**: checkmate, stalemate, draw, invalid moves
- **Player tracking** and leaderboard with points system

## API Endpoints

All endpoints return HTTP 200 for domain-level outcomes. 4xx/5xx codes are reserved for server errors only.

### `POST /new-game`

Create a new game.

**Request:**
```json
{
  "whitePlayer": "gpt-4",
  "blackPlayer": "claude-3",
  "testType": "FEN mode",
  "testDescription": "Models receive exact board position as FEN string"
}
```

**Response:**
```json
{
  "gameId": "uuid",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "status": "continue",
  "sideToMove": "white",
  "legalMoves": ["a3", "a4", "b3", "b4", "..."]
}
```

### `POST /current-position`

Get the current game state.

**Request:**
```json
{
  "gameId": "uuid"
}
```

**Response:**
```json
{
  "fen": "...",
  "status": "continue",
  "sideToMove": "black",
  "legalMoves": ["..."],
  "moveHistory": ["e4", "e5"]
}
```

### `POST /apply-move`

Apply a move to a game.

**Request:**
```json
{
  "gameId": "uuid",
  "move": "Nf3"
}
```

**Response:**
```json
{
  "fen": "...",
  "status": "continue",
  "sideToMove": "white",
  "legalMoves": ["..."],
  "moveHistory": ["e4", "e5", "Nf3"]
}
```

**Status values:**
- `continue` - Game in progress
- `mate` - Checkmate
- `stalemate` - Stalemate
- `draw` - Draw (insufficient material, threefold repetition, etc.)
- `invalid_move` - Invalid move attempted (game ends, opponent wins)

### `POST /legal-moves`

Get legal moves for a position.

**Request:**
```json
{
  "gameId": "uuid"
}
```

## n8n Workflows

Pre-built n8n workflows are available in the `/n8n` folder:

| File | Description |
|------|-------------|
| `blind_mode.json` | Models reconstruct board state from move history only |
| `FEN_mode.json` | Models receive exact board position as FEN string |

### How to Import

1. Open your n8n instance
2. Go to **Workflows → Import from file**
3. Select the JSON file (`blind_mode.json` or `FEN_mode.json`)
4. Configure the HTTP Request nodes with your API endpoint URL
5. Add your **OpenRouter API keys** to the AI/LLM nodes
6. Activate the workflow

### Key Finding: Blind Mode Outperforms FEN

Models perform better in blind mode than with FEN because LLMs are trained extensively on natural-language chess notation, PGN move sequences, and commentary — but very little on strict FEN decoding.

Reconstructing the position from move history triggers multi-step reasoning and forces the model to simulate board state explicitly, which reduces illegal moves.

## Scoring System

- **Win**: +1 point
- **Loss**: -1 point
- **Draw**: 0 points
- **Invalid move**: Automatic loss (-1 point)

## Technology Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Edge Functions)
- chess.js for move validation

## Links

- **Live Leaderboard**: [View benchmark results](/)
- **Battle Statistics**: [/stats](/stats)
- **API Documentation**: [/docs](/docs)
