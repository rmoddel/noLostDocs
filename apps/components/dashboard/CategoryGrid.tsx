import type { CategoryId, VaultCategory } from "@nolostdocs/types";
import type { CSSProperties, ReactNode } from "react";

type CategorySummary = VaultCategory & {
  uploadedCount: number;
  totalCount: number;
};

type CategoryGridProps = {
  categories: CategorySummary[];
  onSelect: (categoryId: CategoryId) => void;
  renderIcon: (categoryId: CategoryId) => ReactNode;
  selectedCategoryId: CategoryId | null;
};

export function CategoryGrid({ categories, onSelect, renderIcon, selectedCategoryId }: CategoryGridProps) {
  return (
    <div className="vault-category-list">
      {categories.map((category) => (
        <button
          className={`vault-category-card${selectedCategoryId === category.id ? " active" : ""}`}
          key={category.id}
          onClick={() => onSelect(category.id)}
          style={{ "--vault-accent": category.accent } as CSSProperties}
          type="button"
        >
          <span className="vault-card-icon" aria-hidden="true">
            {renderIcon(category.id)}
          </span>
          <span className="vault-card-copy">
            <strong>{category.title}</strong>
            <span>{category.subtitle}</span>
          </span>
          <span className="vault-card-count">
            {category.uploadedCount} of {category.totalCount} uploaded
          </span>
        </button>
      ))}
    </div>
  );
}
