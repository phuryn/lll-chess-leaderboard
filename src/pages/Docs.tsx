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
            Stateless HTTP JSON API for chess move validation and game state management
          </p>
          <div className="mt-4 flex gap-2">
            <Badge variant="outline">Stateless</Badge>
            <Badge variant="outline">FEN-based</Badge>
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
              This API provides a stateless chess engine that uses{" "}
              <span className="font-mono bg-muted px-2 py-1 rounded">FEN (Forsyth-Edwards Notation)</span> to represent game state.
              Every request is fully determined by the request body - no sessions, cookies, or server-side state.
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold">Key Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Parse FEN strings into chess positions</li>
                <li>Validate move legality</li>
                <li>Apply moves and generate new game states</li>
                <li>Detect checkmate, stalemate, and draws</li>
                <li>Generate all legal moves for any position</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* POST /api/apply-move */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-green-600 hover:bg-green-700">POST</Badge>
                <code className="text-lg font-mono">/api/apply-move</code>
              </div>
              <CardDescription>Apply a move to a position and get the resulting game state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Request Body</h3>
                <CodeBlock>
{`{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "move": "e4"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Response (Legal Move)</h3>
                <CodeBlock>
{`{
  "ok": true,
  "status": "continue",
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "sideToMove": "black",
  "winner": null,
  "reason": null,
  "legalMoves": ["a6", "a5", "b6", "b5", "c6", "c5", "d6", "d5", ...]
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Response (Illegal Move)</h3>
                <CodeBlock>
{`{
  "ok": true,
  "status": "invalid_move",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "sideToMove": "white",
  "winner": null,
  "reason": "Illegal move",
  "legalMoves": ["a3", "a4", "b3", "b4", "c3", "c4", ...]
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
                    <span className="text-sm text-muted-foreground">Checkmate - side that moved wins</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="outline">stalemate</Badge>
                    <span className="text-sm text-muted-foreground">Stalemate - draw, no legal moves but not in check</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="outline">game_over</Badge>
                    <span className="text-sm text-muted-foreground">Draw by repetition, 50-move rule, or insufficient material</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Badge variant="outline">invalid_move</Badge>
                    <span className="text-sm text-muted-foreground">Move was illegal, original FEN returned</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">cURL Example</h3>
                <CodeBlock language="bash">
{`curl -X POST ${baseUrl}/functions/v1/apply-move \\
  -H "Content-Type: application/json" \\
  -d '{
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "move": "e4"
  }'`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* GET /api/start-position */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-600 hover:bg-blue-700">GET</Badge>
                <code className="text-lg font-mono">/api/start-position</code>
              </div>
              <CardDescription>Get the FEN string for the standard starting position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Response</h3>
                <CodeBlock>
{`{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">cURL Example</h3>
                <CodeBlock language="bash">
{`curl ${baseUrl}/functions/v1/start-position`}
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
              <CardDescription>Get all legal moves for a given position</CardDescription>
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
                    <strong className="text-foreground">Get starting position:</strong> Call{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">/api/start-position</code>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="font-mono bg-background px-2 py-1 rounded">2.</span>
                  <div>
                    <strong className="text-foreground">Make moves:</strong> Send FEN + move to{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">/api/apply-move</code>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="font-mono bg-background px-2 py-1 rounded">3.</span>
                  <div>
                    <strong className="text-foreground">Check response:</strong> Use the new FEN from response for next move
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="font-mono bg-background px-2 py-1 rounded">4.</span>
                  <div>
                    <strong className="text-foreground">Game ends:</strong> When status is{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">mate</code>,{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">stalemate</code>, or{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded">game_over</code>
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
                  <strong className="text-foreground">Invalid moves:</strong> Return status{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded">invalid_move</code> with HTTP 200
                </li>
                <li>
                  <strong className="text-foreground">Invalid FEN:</strong> Return HTTP 400 with error message
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
                    <strong className="text-foreground">Stateless:</strong> Always include the full FEN string in each request.
                    The API does not store any game state.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>
                    <strong className="text-foreground">CORS enabled:</strong> Can be called from any origin including browser-based clients.
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
