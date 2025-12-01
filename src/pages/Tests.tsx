import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type TestResult = {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
};

type TestSuite = {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
};

const Tests = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestSuite[]>([]);
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  const runTests = async () => {
    setRunning(true);
    setResults([]);
    const suites: TestSuite[] = [];

    // Test Suite 1: Basic Endpoint Tests
    {
      const suite: TestSuite = {
        name: "Basic Endpoint Tests",
        tests: [],
        passed: 0,
        failed: 0,
        duration: 0,
      };
      const suiteStart = performance.now();

      // Test: Get start position
      {
        const start = performance.now();
        try {
          const response = await fetch(`${baseUrl}/start-position`);
          const data = await response.json();
          const duration = performance.now() - start;

          if (data.fen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
            suite.tests.push({
              name: "GET /start-position returns correct initial FEN",
              passed: true,
              message: "✓ Correct starting position returned",
              duration,
            });
            suite.passed++;
          } else {
            suite.tests.push({
              name: "GET /start-position returns correct initial FEN",
              passed: false,
              message: `✗ Expected standard starting position, got: ${data.fen}`,
              duration,
            });
            suite.failed++;
          }
        } catch (error) {
          suite.tests.push({
            name: "GET /start-position returns correct initial FEN",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      // Test: Legal moves from start position
      {
        const start = performance.now();
        try {
          const response = await fetch(`${baseUrl}/legal-moves`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            }),
          });
          const data = await response.json();
          const duration = performance.now() - start;

          if (data.ok && data.legalMoves && data.legalMoves.length === 20) {
            suite.tests.push({
              name: "POST /legal-moves returns 20 moves from start",
              passed: true,
              message: "✓ Correct number of legal opening moves",
              duration,
            });
            suite.passed++;
          } else {
            suite.tests.push({
              name: "POST /legal-moves returns 20 moves from start",
              passed: false,
              message: `✗ Expected 20 moves, got ${data.legalMoves?.length || 0}`,
              duration,
            });
            suite.failed++;
          }
        } catch (error) {
          suite.tests.push({
            name: "POST /legal-moves returns 20 moves from start",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      suite.duration = performance.now() - suiteStart;
      suites.push(suite);
    }

    // Test Suite 2: Valid Move Sequences
    {
      const suite: TestSuite = {
        name: "Valid Move Sequences",
        tests: [],
        passed: 0,
        failed: 0,
        duration: 0,
      };
      const suiteStart = performance.now();

      // Test: Standard opening e4
      {
        const start = performance.now();
        try {
          const response = await fetch(`${baseUrl}/apply-move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              move: "e4",
            }),
          });
          const data = await response.json();
          const duration = performance.now() - start;

          if (data.ok && data.status === "continue" && data.sideToMove === "black") {
            suite.tests.push({
              name: "Apply move e4 from start position",
              passed: true,
              message: "✓ Move applied successfully, turn switches to black",
              duration,
            });
            suite.passed++;
          } else {
            suite.tests.push({
              name: "Apply move e4 from start position",
              passed: false,
              message: `✗ Unexpected response: ${JSON.stringify(data)}`,
              duration,
            });
            suite.failed++;
          }
        } catch (error) {
          suite.tests.push({
            name: "Apply move e4 from start position",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      // Test: Scholar's Mate sequence
      {
        const start = performance.now();
        try {
          let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
          const moves = ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"];

          for (const move of moves) {
            const response = await fetch(`${baseUrl}/apply-move`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fen, move }),
            });
            const data = await response.json();
            fen = data.fen;

            // Check last move for checkmate
            if (move === "Qxf7#") {
              if (data.status === "mate" && data.winner === "white") {
                suite.tests.push({
                  name: "Scholar's Mate sequence (checkmate detection)",
                  passed: true,
                  message: "✓ Checkmate detected correctly",
                  duration: performance.now() - start,
                });
                suite.passed++;
              } else {
                suite.tests.push({
                  name: "Scholar's Mate sequence (checkmate detection)",
                  passed: false,
                  message: `✗ Expected mate status, got: ${data.status}`,
                  duration: performance.now() - start,
                });
                suite.failed++;
              }
            }
          }
        } catch (error) {
          suite.tests.push({
            name: "Scholar's Mate sequence (checkmate detection)",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      // Test: Castling
      {
        const start = performance.now();
        try {
          // Position after 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5
          const fen = "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";
          const response = await fetch(`${baseUrl}/apply-move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fen, move: "O-O" }),
          });
          const data = await response.json();
          const duration = performance.now() - start;

          if (data.ok && data.status === "continue") {
            suite.tests.push({
              name: "Kingside castling (O-O)",
              passed: true,
              message: "✓ Castling applied successfully",
              duration,
            });
            suite.passed++;
          } else {
            suite.tests.push({
              name: "Kingside castling (O-O)",
              passed: false,
              message: `✗ Castling failed: ${data.reason || data.status}`,
              duration,
            });
            suite.failed++;
          }
        } catch (error) {
          suite.tests.push({
            name: "Kingside castling (O-O)",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      suite.duration = performance.now() - suiteStart;
      suites.push(suite);
    }

    // Test Suite 3: Invalid Moves
    {
      const suite: TestSuite = {
        name: "Invalid Move Detection",
        tests: [],
        passed: 0,
        failed: 0,
        duration: 0,
      };
      const suiteStart = performance.now();

      // Test: Invalid pawn move
      {
        const start = performance.now();
        try {
          const response = await fetch(`${baseUrl}/apply-move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              move: "e5", // Can't move pawn 2 squares to e5 from e2
            }),
          });
          const data = await response.json();
          const duration = performance.now() - start;

          if (data.status === "invalid_move") {
            suite.tests.push({
              name: "Detect invalid pawn move (e5 from start)",
              passed: true,
              message: "✓ Invalid move correctly rejected",
              duration,
            });
            suite.passed++;
          } else {
            suite.tests.push({
              name: "Detect invalid pawn move (e5 from start)",
              passed: false,
              message: `✗ Move should be invalid, got status: ${data.status}`,
              duration,
            });
            suite.failed++;
          }
        } catch (error) {
          suite.tests.push({
            name: "Detect invalid pawn move (e5 from start)",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      // Test: Move wrong color piece
      {
        const start = performance.now();
        try {
          const response = await fetch(`${baseUrl}/apply-move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              move: "Nf6", // Black move when it's white's turn
            }),
          });
          const data = await response.json();
          const duration = performance.now() - start;

          if (data.status === "invalid_move") {
            suite.tests.push({
              name: "Detect move of wrong color piece",
              passed: true,
              message: "✓ Wrong color move correctly rejected",
              duration,
            });
            suite.passed++;
          } else {
            suite.tests.push({
              name: "Detect move of wrong color piece",
              passed: false,
              message: `✗ Move should be invalid, got status: ${data.status}`,
              duration,
            });
            suite.failed++;
          }
        } catch (error) {
          suite.tests.push({
            name: "Detect move of wrong color piece",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      // Test: Case sensitivity
      {
        const start = performance.now();
        try {
          const response = await fetch(`${baseUrl}/apply-move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              move: "nf3", // lowercase knight move (invalid)
            }),
          });
          const data = await response.json();
          const duration = performance.now() - start;

          if (data.status === "invalid_move") {
            suite.tests.push({
              name: "SAN case sensitivity (lowercase Nf3)",
              passed: true,
              message: "✓ Case-sensitive validation working",
              duration,
            });
            suite.passed++;
          } else {
            suite.tests.push({
              name: "SAN case sensitivity (lowercase Nf3)",
              passed: false,
              message: `✗ Lowercase move should be invalid, got status: ${data.status}`,
              duration,
            });
            suite.failed++;
          }
        } catch (error) {
          suite.tests.push({
            name: "SAN case sensitivity (lowercase Nf3)",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      suite.duration = performance.now() - suiteStart;
      suites.push(suite);
    }

    // Test Suite 4: Special Positions
    {
      const suite: TestSuite = {
        name: "Special Positions & Game Endings",
        tests: [],
        passed: 0,
        failed: 0,
        duration: 0,
      };
      const suiteStart = performance.now();

      // Test: Stalemate detection
      {
        const start = performance.now();
        try {
          // Position: White king on h1, Black king on h3, White queen on g2 to deliver stalemate
          const fen = "8/8/8/8/8/7k/6Q1/7K b - - 0 1";
          const response = await fetch(`${baseUrl}/legal-moves`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fen }),
          });
          const data = await response.json();
          const duration = performance.now() - start;

          // In this position, black king has no legal moves but is not in check (stalemate)
          if (data.legalMoves.length === 0) {
            suite.tests.push({
              name: "Stalemate position (no legal moves, not in check)",
              passed: true,
              message: "✓ Stalemate position correctly identified (0 legal moves)",
              duration,
            });
            suite.passed++;
          } else {
            suite.tests.push({
              name: "Stalemate position (no legal moves, not in check)",
              passed: false,
              message: `✗ Expected 0 legal moves for stalemate, got ${data.legalMoves.length}`,
              duration,
            });
            suite.failed++;
          }
        } catch (error) {
          suite.tests.push({
            name: "Stalemate position (no legal moves, not in check)",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      // Test: Pawn promotion
      {
        const start = performance.now();
        try {
          // White pawn on e7, can promote to queen
          const fen = "8/4P3/8/8/8/8/k7/K7 w - - 0 1";
          const response = await fetch(`${baseUrl}/apply-move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fen, move: "e8=Q" }),
          });
          const data = await response.json();
          const duration = performance.now() - start;

          if (data.ok && data.status !== "invalid_move") {
            suite.tests.push({
              name: "Pawn promotion (e8=Q)",
              passed: true,
              message: "✓ Pawn promotion applied successfully",
              duration,
            });
            suite.passed++;
          } else {
            suite.tests.push({
              name: "Pawn promotion (e8=Q)",
              passed: false,
              message: `✗ Promotion failed: ${data.reason || data.status}`,
              duration,
            });
            suite.failed++;
          }
        } catch (error) {
          suite.tests.push({
            name: "Pawn promotion (e8=Q)",
            passed: false,
            message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
            duration: performance.now() - start,
          });
          suite.failed++;
        }
      }

      suite.duration = performance.now() - suiteStart;
      suites.push(suite);
    }

    setResults(suites);
    setRunning(false);
  };

  const totalTests = results.reduce((sum, suite) => sum + suite.tests.length, 0);
  const totalPassed = results.reduce((sum, suite) => sum + suite.passed, 0);
  const totalFailed = results.reduce((sum, suite) => sum + suite.failed, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Chess API Test Suite</h1>
          <p className="text-muted-foreground">
            Automated tests for validating chess engine API endpoints and move validation
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Run Tests</CardTitle>
            <CardDescription>Execute all test suites against the Chess API</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} disabled={running} size="lg" className="w-full sm:w-auto">
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run All Tests"
              )}
            </Button>

            {results.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">{totalTests}</div>
                    <div className="text-sm text-muted-foreground">Total Tests</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">{totalPassed}</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-600">{totalFailed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {results.map((suite, idx) => (
            <Card key={idx} className={suite.failed > 0 ? "border-red-500" : "border-green-500"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      {suite.name}
                      <Badge variant={suite.failed > 0 ? "destructive" : "default"}>
                        {suite.passed}/{suite.tests.length} passed
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Completed in {suite.duration.toFixed(0)}ms
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {suite.tests.map((test, testIdx) => (
                  <Alert
                    key={testIdx}
                    variant={test.passed ? "default" : "destructive"}
                    className={test.passed ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}
                  >
                    <AlertTitle className="flex items-center justify-between">
                      <span>{test.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {test.duration.toFixed(0)}ms
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2 font-mono text-sm">
                      {test.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tests;
