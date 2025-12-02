# LLM Chess Benchmark

A chess engine API designed for benchmarking LLM chess capabilities via n8n orchestration. Models play chess by outputting moves in Standard Algebraic Notation (SAN), and invalid moves result in automatic losses.

## Overview

- **Stateful HTTP JSON API** using [chess.js](https://github.com/jhlywa/chess.js)
- **Game persistence** with PostgreSQL (via Supabase)
- **Move validation** using Standard Algebraic Notation (SAN)
- **Game state detection**: checkmate, stalemate, draw, invalid moves
- **Player tracking** and leaderboard with points system

## API Documentation

Full API documentation is available in [APIdoc.md](./APIdoc.md) or at the [/docs](/docs) page.

### Quick Reference

| Endpoint | Description |
|----------|-------------|
| `POST /new-game` | Create a new game |
| `POST /current-position` | Get current game state |
| `POST /apply-move` | Apply a move to a game |
| `POST /legal-moves` | Get legal moves for a position |

**Status values:** `continue`, `mate`, `stalemate`, `draw`, `invalid_move`

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
