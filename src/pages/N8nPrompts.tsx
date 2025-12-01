import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CodeBlock = ({ children, language = "text" }: { children: string; language?: string }) => (
  <div className="relative">
    <Badge variant="secondary" className="absolute right-2 top-2 text-xs">
      {language}
    </Badge>
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto border">
      <code className="text-sm font-mono whitespace-pre-wrap">{children}</code>
    </pre>
  </div>
);

const N8nPrompts = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            n8n Chess Agent Prompts
          </h1>
          <p className="text-xl text-muted-foreground">
            LLM prompts for automated chess agents in n8n workflows
          </p>
          <div className="mt-4 flex gap-2">
            <Badge variant="outline">n8n Integration</Badge>
            <Badge variant="outline">LLM Agents</Badge>
            <Badge variant="outline">Coordinate Notation</Badge>
          </div>
        </div>

        <Alert className="mb-8">
          <AlertTitle className="text-lg font-semibold">📋 Integration Notes</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              These prompts are designed to be used in n8n workflows that orchestrate chess games between LLM agents.
              The orchestration layer should handle API calls to the Chess Engine API endpoints.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
              <li>Use the <code className="bg-muted px-1.5 py-0.5 rounded">/api/apply-move</code> endpoint to validate and apply moves</li>
              <li>Pass the current FEN string to the LLM agent via n8n variable injection</li>
              <li>Parse the LLM output and send it to the API</li>
              <li>Handle <code className="bg-muted px-1.5 py-0.5 rounded">resign</code> output for terminal positions</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-8">
          {/* WHITE Player Prompt */}
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">⚪</span>
                <CardTitle className="text-2xl">WHITE Player Prompt</CardTitle>
              </div>
              <CardDescription>LLM agent configuration for playing as WHITE pieces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Prompt Template</h3>
                <CodeBlock language="prompt">
{`You are a chess engine playing as WHITE.

Your job:
- Analyze the current position in FEN format: {{ $json.FEN }}
- Output ONE legal move for WHITE in coordinate notation: exactly 4 characters (e.g., e2e4, g1f3).
- Never explain the move. Never add text. Never include SAN notation.
- If you have no legal move (checkmate or stalemate), output exactly: resign
- Do not output punctuation, commentary, or multiple moves.
- Format strictly: lowercase letters a–h, digits 1–8.

Any output that is not a single 4-character move is considered an illegal move and loses the game.`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Key Requirements</h3>
                <div className="grid gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="font-semibold text-sm">Move Format:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Exactly 4 characters in coordinate notation (e.g., <code className="bg-background px-1.5 py-0.5 rounded">e2e4</code>)
                    </span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="font-semibold text-sm">No Explanation:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Output only the move, no commentary or reasoning
                    </span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="font-semibold text-sm">Terminal Position:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Output <code className="bg-background px-1.5 py-0.5 rounded">resign</code> if no legal moves available
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Example Outputs</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">✓ Valid</Badge>
                    <code className="font-mono text-sm">e2e4</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">✓ Valid</Badge>
                    <code className="font-mono text-sm">g1f3</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">✓ Valid</Badge>
                    <code className="font-mono text-sm">resign</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900">✗ Invalid</Badge>
                    <code className="font-mono text-sm">e4 (opening move)</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900">✗ Invalid</Badge>
                    <code className="font-mono text-sm">Nf3 - developing the knight</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BLACK Player Prompt */}
          <Card className="border-l-4 border-l-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">⚫</span>
                <CardTitle className="text-2xl">BLACK Player Prompt</CardTitle>
              </div>
              <CardDescription>LLM agent configuration for playing as BLACK pieces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Prompt Template</h3>
                <CodeBlock language="prompt">
{`You are a chess engine playing as BLACK.

Your job:
- Analyze the current position in FEN format: {{ $json.FEN }}
- Output ONE legal move for BLACK in coordinate notation: exactly 4 characters (e.g., e7e5, g8f6).
- Never explain the move. Never add text. Never include SAN notation.
- If you have no legal move (checkmate or stalemate), output exactly: resign
- Do not output punctuation, commentary, or multiple moves.
- Format strictly: lowercase letters a–h, digits 1–8.

Any output that is not a single 4-character move is considered an illegal move and loses the game.`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Key Requirements</h3>
                <div className="grid gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="font-semibold text-sm">Move Format:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Exactly 4 characters in coordinate notation (e.g., <code className="bg-background px-1.5 py-0.5 rounded">e7e5</code>)
                    </span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="font-semibold text-sm">No Explanation:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Output only the move, no commentary or reasoning
                    </span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="font-semibold text-sm">Terminal Position:</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Output <code className="bg-background px-1.5 py-0.5 rounded">resign</code> if no legal moves available
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Example Outputs</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">✓ Valid</Badge>
                    <code className="font-mono text-sm">e7e5</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">✓ Valid</Badge>
                    <code className="font-mono text-sm">g8f6</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">✓ Valid</Badge>
                    <code className="font-mono text-sm">resign</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900">✗ Invalid</Badge>
                    <code className="font-mono text-sm">e5 (responding with pawn)</code>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900">✗ Invalid</Badge>
                    <code className="font-mono text-sm">Nf6 - mirroring white</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12" />

        {/* Implementation Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🔧</span> n8n Implementation Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-lg">Workflow Structure</h3>
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">1. Get Current Position</h4>
                  <p className="text-sm text-muted-foreground">
                    Retrieve the current FEN string from your game state storage or previous workflow step
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">2. Inject FEN into LLM Context</h4>
                  <p className="text-sm text-muted-foreground">
                    Use n8n variable injection: <code className="bg-background px-1.5 py-0.5 rounded">{`{{ $json.FEN }}`}</code> in the prompt
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">3. Call LLM Agent</h4>
                  <p className="text-sm text-muted-foreground">
                    Execute the LLM with the appropriate prompt (WHITE or BLACK)
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">4. Parse Output</h4>
                  <p className="text-sm text-muted-foreground">
                    Extract the move string from LLM response, trim whitespace
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">5. Validate via API</h4>
                  <p className="text-sm text-muted-foreground">
                    Send to <code className="bg-background px-1.5 py-0.5 rounded">/api/apply-move</code> endpoint
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">6. Handle Response</h4>
                  <p className="text-sm text-muted-foreground">
                    Check <code className="bg-background px-1.5 py-0.5 rounded">status</code> field: continue, mate, stalemate, game_over, or invalid_move
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Move Validation Logic</h3>
              <CodeBlock language="javascript">
{`// In n8n, after getting LLM output
const move = $json.llm_output.trim().toLowerCase();

// Check for resignation
if (move === "resign") {
  return { game_over: true, winner: opponent };
}

// Validate move format (4 characters, lowercase)
if (!/^[a-h][1-8][a-h][1-8]$/.test(move)) {
  return { invalid_move: true, reason: "Invalid format" };
}

// Send to API for validation
const response = await fetch(API_URL + "/apply-move", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fen: currentFEN,
    move: move
  })
});

const result = await response.json();

if (result.status === "invalid_move") {
  // LLM made an illegal move - opponent wins
  return { game_over: true, winner: opponent, reason: "Illegal move" };
}

// Continue with new position
return {
  new_fen: result.fen,
  status: result.status,
  winner: result.winner,
  next_turn: result.sideToMove
};`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Error Handling</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <span className="text-yellow-600">⚠️</span>
                  <div>
                    <strong className="text-foreground">Invalid Format:</strong>
                    <span className="text-muted-foreground ml-2">
                      If LLM outputs anything other than 4 characters or "resign", treat as illegal move and end game
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <span className="text-yellow-600">⚠️</span>
                  <div>
                    <strong className="text-foreground">API Returns invalid_move:</strong>
                    <span className="text-muted-foreground ml-2">
                      The move was formatted correctly but is not legal in the position - opponent wins
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-600">ℹ️</span>
                  <div>
                    <strong className="text-foreground">Terminal Positions:</strong>
                    <span className="text-muted-foreground ml-2">
                      When API returns mate/stalemate/game_over, check the winner field and end the game
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Coordinate notation only • No SAN • Strict 4-character format</p>
        </div>
      </div>
    </div>
  );
};

export default N8nPrompts;
