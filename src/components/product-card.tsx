import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  className?: string;
}

export function ProductCard({ product, onClick, className }: ProductCardProps) {
  const budgetLabels: Record<string, string> = {
    budget: "平价",
    mid: "中端",
    premium: "高端",
    luxury: "奢华",
  };

  const skinTypeLabels: Record<string, string> = {
    dry: "干性",
    oily: "油性",
    combination: "混合",
    sensitive: "敏感",
    normal: "中性",
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-200",
        "hover:shadow-soft-lg hover:-translate-y-1",
        "active:scale-[0.98]",
        className
      )}
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={product.image_url || ''}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm"
        >
          {budgetLabels[product.budget_level]}
        </Badge>
      </div>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-primary font-semibold">
            ¥{product.price_min}-{product.price_max}
          </span>
          <div className="flex gap-1">
            {(product.skin_types || []).slice(0, 2).map((type) => (
              <span
                key={type}
                className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-full text-secondary-foreground"
              >
                {skinTypeLabels[type]}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
