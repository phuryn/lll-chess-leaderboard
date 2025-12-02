import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const CodeBlock = ({ children, language = "json" }: { children: string; language?: string }) => (
  <div className="relative">
    <Badge variant="secondary" className="absolute right-2 top-2 text-xs">
      {language}
    </Badge>
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto border">
      <code className="text-sm font-mono">{children}</code>
    </pre>
  </div>
);

const Docs = () => {
  const baseUrl = "https://csdagwvbuurumpgrqweh.supabase.co";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Chess Engine API
          </h1>
          <p className="text-xl text-muted-foreground">
            Stateful HTTP JSON API for chess move validation and game state management
          </p>
          <div className="mt-4 flex gap-2">
            <Badge variant="outline">Stateful</Badge>
            <Badge variant="outline">Game-ID Based</Badge>
            <Badge variant="outline">CORS Enabled</Badge>
          </div>
        </div>

        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📋</span> Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This API provides a stateful chess engine that stores games in a database with unique IDs.
              Each game tracks its complete state including move history, player names, and current position.
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold">Key Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Create new games with optional player names</li>
                <li>Validate move legality and apply moves</li>
                <li>Track complete move history automatically</li>
                <li>Detect checkmate, stalemate, and draws</li>
                <li>Get current game state at any time</li>
                <li>Player statistics tracking support</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* POST /api/new-game */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-green-600 hover:bg-green-700">POST</Badge>
                <code className="text-lg font-mono">/api/new-game</code>
              </div>
              <CardDescription>Create a new chess game and get a unique game ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Request Body (Optional)</h3>
                <CodeBlock>
{`{
  "whitePlayer": "Alice",
  "blackPlayer": "Bob",
  "testType": "Blind mode",
  "testDescription": "Models must track the board state mentally without seeing FEN"
}`}
                </CodeBlock>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Note:</strong> If <code className="bg-muted px-1.5 py-0.5 rounded">testType</code> or{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded">testDescription</code> are not provided, they default to "Unknown"
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Response</h3>
                <CodeBlock>
{`{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "sideToMove": "white",
  "legalMoves": ["a3", "a4", "b3", "b4", "c3", "c4", ...],
  "status": "continue",
  "whitePlayer": "Alice",
  "blackPlayer": "Bob",
  "testType": "Blind mode",
  "testDescription": "Models must track the board state mentally without seeing FEN"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">cURL Example</h3>
                <CodeBlock language="bash">
{`curl -X POST ${baseUrl}/functions/v1/new-game \\
  -H "Content-Type: application/json" \\
  -d '{
    "whitePlayer": "Alice",
    "blackPlayer": "Bob",
    "testType": "Blind mode",
    "testDescription": "Models must track the board state mentally without seeing FEN"
  }'`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* POST /api/current-position */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-600 hover:bg-blue-700">POST</Badge>
                <code className="text-lg font-mono">/api/current-position</code>
              </div>
              <CardDescription>Get the current state of a game by its ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Request Body</h3>
                <CodeBlock>
{`{
  "gameId": "123e4567-e89b-12d3-a456-426614174000"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Response</h3>
                <CodeBlock>
{`{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
  "sideToMove": "white",
  "legalMoves": ["a3", "a4", "b3", "b4", ...],
  "status": "continue",
  "winner": null,
  "reason": null,
  "moveHistory": ["e4", "e5"],
  "lastMove": "e5",
  "whitePlayer": "Alice",
  "blackPlayer": "Bob",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:01:00Z"
}`}
                </CodeBlock>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Note:</strong> <code className="bg-muted px-1.5 py-0.5 rounded">lastMove</code> returns the last move played, or "-" for a new game with no moves
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">cURL Example</h3>
                <CodeBlock language="bash">
{`curl -X POST ${baseUrl}/functions/v1/current-position \\
  -H "Content-Type: application/json" \\
  -d '{
    "gameId": "123e4567-e89b-12d3-a456-426614174000"
  }'`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* POST /api/apply-move */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-green-600 hover:bg-green-700">POST</Badge>
                <code className="text-lg font-mono">/api/apply-move</code>
              </div>
              <CardDescription>Apply a move to a game and get the updated state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Request Body</h3>
                <CodeBlock>
{`{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "move": "e4"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Response (Legal Move)</h3>
                <CodeBlock>
{`{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "sideToMove": "black",
  "legalMoves": ["a6", "a5", "b6", "b5", "c6", "c5", ...],
  "status": "continue",
  "winner": null,
  "reason": null,
  "moveHistory": ["e4"],
  "whitePlayer": "Alice",
  "blackPlayer": "Bob"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Response (Checkmate)</h3>
                <CodeBlock>
{`{
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
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Status Values</h3>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="outline">continue</Badge>
                    <span className="text-sm text-muted-foreground">Game continues, more moves available</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="outline">mate</Badge>
                    <span className="text-sm text-muted-foreground">Checkmate - winner specified in response</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="outline">draw</Badge>
                    <span className="text-sm text-muted-foreground">Draw by stalemate, repetition, 50-move rule, or insufficient material</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">cURL Example</h3>
                <CodeBlock language="bash">
{`curl -X POST ${baseUrl}/functions/v1/apply-move \\
  -H "Content-Type: application/json" \\
  -d '{
    "gameId": "123e4567-e89b-12d3-a456-426614174000",
    "move": "e4"
  }'`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* POST /api/legal-moves */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-purple-600 hover:bg-purple-700">POST</Badge>
                <code className="text-lg font-mono">/api/legal-moves</code>
              </div>
              <CardDescription>Get all legal moves for a given FEN position (stateless)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Request Body</h3>
                <CodeBlock>
{`{
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Response</h3>
                <CodeBlock>
{`{
  "ok": true,
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "sideToMove": "black",
  "legalMoves": [
    "a6", "a5", "b6", "b5", "c6", "c5", "d6", "d5",
    "e6", "e5", "f6", "f5", "g6", "g5", "h6", "h5",
    "Na6", "Nc6", "Nf6", "Nh6"
  ]
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">cURL Example</h3>
                <CodeBlock language="bash">
{`curl -X POST ${baseUrl}/functions/v1/legal-moves \\
  -H "Content-Type: application/json" \\
  -d '{
    "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
  }'`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12" />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🤖</span> LLM Integration Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-lg">Basic Game Flow</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="font-mono bg-background px-2 py-1 rounded">1.</span>
                  <div>
                    <strong className="text-foreground">Create new game:</strong> Call{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">/api/new-game</code> with optional player names
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="font-mono bg-background px-2 py-1 rounded">2.</span>
                  <div>
                    <strong className="text-foreground">Make moves:</strong> Send gameId + move to{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">/api/apply-move</code>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="font-mono bg-background px-2 py-1 rounded">3.</span>
                  <div>
                    <strong className="text-foreground">Get state:</strong> Use{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">/api/current-position</code> to fetch current game state
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="font-mono bg-background px-2 py-1 rounded">4.</span>
                  <div>
                    <strong className="text-foreground">Game ends:</strong> When status is{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">mate</code> or{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">draw</code>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Move Notation (SAN)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                All moves use Standard Algebraic Notation (SAN). Examples:
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <code className="font-mono">e4</code> - Pawn to e4
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="font-mono">Nf3</code> - Knight to f3
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="font-mono">Bxe5</code> - Bishop captures on e5
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="font-mono">O-O</code> - Kingside castle
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="font-mono">O-O-O</code> - Queenside castle
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="font-mono">e8=Q</code> - Pawn promotion to Queen
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Error Handling</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>
                  <strong className="text-foreground">Invalid moves:</strong> Return HTTP 400 with error message
                </li>
                <li>
                  <strong className="text-foreground">Game not found:</strong> Return HTTP 404 with error message
                </li>
                <li>
                  <strong className="text-foreground">Server errors:</strong> Return HTTP 500 with error details
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Important Notes</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>
                    <strong className="text-foreground">Stateful:</strong> Games are stored in database with complete history
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600">⚠️</span>
                  <span>
                    <strong className="text-foreground">Case sensitive:</strong> SAN notation is case-sensitive.{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded">Nf3</code> is valid,{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded">nf3</code> is not.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">ℹ️</span>
                  <span>
                    <strong className="text-foreground">Player names:</strong> Optional but recommended for statistics tracking
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>
                    <strong className="text-foreground">CORS enabled:</strong> Can be called from any origin including browser-based clients.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">ℹ️</span>
                  <span>
                    <strong className="text-foreground">Test categorization:</strong> Use{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded">testType</code> and{" "}
                    <code className="bg-muted px-1.5 py-0.5 rounded">testDescription</code> to organize games for analytics and leaderboard tracking
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Built with chess.js • Powered by Lovable Cloud</p>
        </div>
      </div>
    </div>
  );
};

export default Docs;