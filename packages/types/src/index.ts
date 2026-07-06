export type VaultMode = "local" | "cloud";
export type PlatformType = "ios" | "android" | "web";

export type CategoryId =
  | "personal"
  | "driving"
  | "medical"
  | "family"
  | "work"
  | "business"
  | "travel"
  | "custom";

export type DocumentStatus = "active" | "expired" | "archived" | "needs_review" | "uploaded" | "missing" | "expiring-soon";
export type DocumentProfileType = "person" | "family" | "business" | "other";
export type DocumentFileRole = "original" | "preview" | "processed";

export type VaultCategory = {
  id: CategoryId;
  title: string;
  subtitle: string;
  accent: string;
};

export type DocumentCard = {
  id: string;
  title: string;
  category: CategoryId;
  status: DocumentStatus;
  note?: string;
  expiresAt?: string;
};

export type DocumentTemplate = {
  categoryId?: string;
  categoryName?: string;
  contentType?: string;
  documentFileId?: string;
  documentId?: string;
  documentTypeId?: string;
  documentTypeName?: string;
  documentDate?: string;
  fileRole?: DocumentFileRole;
  id: string;
  category: CategoryId;
  title: string;
  helper: string;
  hasFile?: boolean;
  mimeType?: string;
  status: DocumentStatus;
  notes?: string;
  ownerProfileId?: string;
  ownerProfileName?: string;
  ownerProfileType?: DocumentProfileType;
  issueDate?: string;
  note?: string;
  expiresAt?: string;
  expirationDate?: string;
  pageCount?: number;
  tags?: string[];
  storageBucket?: string;
  storagePath?: string;
  originalFilename?: string;
  updatedAt?: string;
};

export type DocumentLookupRow = {
  id: string;
  name: string;
  slug?: string;
  sort_order?: number;
};

export type DeviceRecord = {
  id: string;
  name: string;
  platform: PlatformType;
  trusted: boolean;
  locked: boolean;
  lastSeen: string;
};

export type VaultSnapshot = {
  mode: VaultMode;
  categories: VaultCategory[];
  documents: DocumentCard[];
  templates: DocumentTemplate[];
  devices: DeviceRecord[];
};
