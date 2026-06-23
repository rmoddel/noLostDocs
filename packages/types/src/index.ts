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

export type VaultCategory = {
  id: CategoryId;
  title: string;
  subtitle: string;
  accent: string;
};

export type DocumentStatus = "uploaded" | "missing" | "expiring-soon" | "expired";

export type DocumentCard = {
  id: string;
  title: string;
  category: CategoryId;
  status: DocumentStatus;
  note?: string;
  expiresAt?: string;
};

export type DocumentTemplate = {
  id: string;
  category: CategoryId;
  title: string;
  helper: string;
  status: DocumentStatus;
  note?: string;
  expiresAt?: string;
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
