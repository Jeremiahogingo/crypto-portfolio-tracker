import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { newsArticles } from "@/mock/news";

export default function FeaturedArticle() {
  const article = newsArticles.find((a) => a.featured);
  if (!article) return null;

  return (
    <Card gradientBorder hover className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="w-full h-48 md:h-full rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
          <span className="text-7xl">{article.image}</span>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="primary">{article.category}</Badge>
            <span className="text-xs text-secondary">Featured</span>
          </div>
          <h2 className="text-xl font-bold text-text mb-3">{article.title}</h2>
          <p className="text-sm text-secondary mb-4">{article.description}</p>
          <div className="flex items-center gap-3 text-xs text-secondary">
            <span>{article.source}</span>
            <span className="w-1 h-1 rounded-full bg-secondary" />
            <span>{article.author}</span>
            <span className="w-1 h-1 rounded-full bg-secondary" />
            <span>{article.publishedAt}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}