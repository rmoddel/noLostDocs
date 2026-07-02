import taxonomy from "./document-type-taxonomy.json";

export type DocumentTypeTaxonomyItem = {
  id: string;
  items: string[];
  label: string;
};

type DocumentTypeTaxonomy = {
  categories: DocumentTypeTaxonomyItem[];
  featured: string[];
  version: number;
};

const typedTaxonomy = taxonomy as DocumentTypeTaxonomy;

export const documentTypeTaxonomy = typedTaxonomy;
export const documentTypeFeatured = typedTaxonomy.featured;
export const documentTypeSuggestions = typedTaxonomy.categories.flatMap((category) => category.items);
