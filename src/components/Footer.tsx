import { Link } from "react-router-dom";
import { Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto bg-zinc-900 w-full">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-4">The Benchmark</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>Published: 12/2/2025 (v1.0)</li>
            <li>
              Author:{" "}
              <a 
                href="https://www.linkedin.com/in/pawel-huryn/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white transition-colors"
              >
                Paweł Huryn
              </a>
            </li>
            <li>
              Newsletter:{" "}
              <a 
                href="https://www.productcompass.pm/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white transition-colors"
              >
                The Product Compass
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-4">More</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>
              <Link to="/games" className="text-zinc-300 hover:text-white transition-colors">
                Games
              </Link>
            </li>
            <li>
              <Link to="/stats" className="text-zinc-300 hover:text-white transition-colors">
                Battle Statistics
              </Link>
            </li>
            <li>
              <Link to="/docs" className="text-zinc-300 hover:text-white transition-colors">
                Chess Engine API
              </Link>
            </li>
            <li>
              <a 
                href="https://github.com/phuryn/lll-chess-leaderboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white transition-colors inline-flex items-center"
              >
                <Github className="w-4 h-4 inline -mt-0.5" />&nbsp;Source Code (GitHub)
              </a>
            </li>
          </ul>
        </div>
        </div>
      </div>
    </footer>
  );
}