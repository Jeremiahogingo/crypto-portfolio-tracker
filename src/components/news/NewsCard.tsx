import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface NewsArticle {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string;
  source: string;
  author: string;
  publishedAt: string;
  featured: boolean;
}

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  return (
    <Card hover className="flex flex-col h-full">
      {/* Banner */}
      <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
        <span className="text-5xl">{article.image}</span>
      </div>

      {/* Category + Source */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="primary">{article.category}</Badge>
        <span className="text-xs text-secondary">{article.source}</span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-text mb-2 line-clamp-2">
        {article.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-secondary line-clamp-3 mb-4">
        {article.description}
      </p>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-secondary">{article.author}</span>
        <span className="text-xs text-secondary">{article.publishedAt}</span>
      </div>
    </Card>
  );
}