import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="text-6xl mb-4">♟️</div>
          <CardTitle className="text-4xl font-bold">Chess Engine API</CardTitle>
          <CardDescription className="text-lg">
            Stateless HTTP JSON API for chess game logic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              A fully stateless chess engine that uses FEN notation to manage game state.
              Perfect for LLMs, automation tools, and distributed chess applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link to="/docs">View API Documentation</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link to="/n8n-prompts">n8n Agent Prompts</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <Link to="/tests">Run API Tests</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="font-semibold mb-1">Stateless</h3>
              <p className="text-sm text-muted-foreground">No server-side state or sessions</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl mb-2">✓</div>
              <h3 className="font-semibold mb-1">Move Validation</h3>
              <p className="text-sm text-muted-foreground">Legal move checking and generation</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1">Game Detection</h3>
              <p className="text-sm text-muted-foreground">Checkmate, stalemate, and draw detection</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
