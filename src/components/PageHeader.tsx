import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PageHeader() {
  return (
    <div className="mb-8">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leaderboard
      </Link>
    </div>
  );
}
