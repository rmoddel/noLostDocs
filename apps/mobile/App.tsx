import { BASIC_GROUP_CATEGORIES, prototypeSnapshot } from "@nolostdocs/config";
import { createNoLostDocsSupabaseClient } from "@nolostdocs/supabase";
import type { CategoryId, DocumentTemplate, VaultCategory, VaultMode } from "@nolostdocs/types";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

const { configured } = createNoLostDocsSupabaseClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
});

const statusPalette = {
  uploaded: "#06a77d",
  "expiring-soon": "#d98f2b",
  missing: "#95a1b2",
  expired: "#d1495b"
};

type ScreenState =
  | { name: "onboarding"; step: 0 | 1 | 2; mode: VaultMode | null }
  | { name: "home"; mode: VaultMode }
  | { name: "category"; mode: VaultMode; categoryId: CategoryId };

const visibleCategories = prototypeSnapshot.categories.filter((category) => category.id !== "custom");

function groupTemplates(categoryId: CategoryId) {
  return prototypeSnapshot.templates.filter((template) => template.category === categoryId);
}

function categoryCounts(categoryId: CategoryId) {
  const items = groupTemplates(categoryId);
  const uploaded = items.filter((item) => item.status === "uploaded").length;
  const attention = items.filter((item) => item.status === "expiring-soon" || item.status === "expired").length;
  const missing = items.filter((item) => item.status === "missing").length;
  return { total: items.length, uploaded, attention, missing };
}

function statusLabel(template: DocumentTemplate) {
  if (template.status === "uploaded" && template.expiresAt) {
    return `Saved · expires ${template.expiresAt}`;
  }

  if (template.status === "expiring-soon" && template.expiresAt) {
    return `Expiring soon · ${template.expiresAt}`;
  }

  if (template.status === "expired" && template.expiresAt) {
    return `Expired · ${template.expiresAt}`;
  }

  if (template.status === "missing") {
    return "Missing · tap to add";
  }

  return "Saved";
}

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ name: "onboarding", step: 0, mode: null });
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [search, setSearch] = useState("");

  const activeMode = screen.mode ?? "local";
  const filteredCategories = useMemo(() => {
    const planScopedCategories =
      activeMode === "local"
        ? visibleCategories.filter((category) =>
            BASIC_GROUP_CATEGORIES.includes(category.id as (typeof BASIC_GROUP_CATEGORIES)[number])
          )
        : visibleCategories;

    if (!search.trim()) return planScopedCategories;

    const query = search.trim().toLowerCase();
    return planScopedCategories.filter((category) => {
      const text = `${category.title} ${category.subtitle}`.toLowerCase();
      return text.includes(query) || groupTemplates(category.id).some((template) => template.title.toLowerCase().includes(query));
    });
  }, [activeMode, search]);

  const category = screen.name === "category"
    ? prototypeSnapshot.categories.find((entry) => entry.id === screen.categoryId) ?? null
    : null;

  const categoryTemplates = category ? groupTemplates(category.id) : [];

  const continueOnboarding = () => {
    if (screen.name !== "onboarding") return;

    if (screen.step === 0) {
      setScreen({ name: "onboarding", step: 1, mode: screen.mode ?? "local" });
      return;
    }

    if (screen.step === 1) {
      setScreen({ name: "onboarding", step: 2, mode: screen.mode ?? "local" });
      return;
    }

    setScreen({ name: "home", mode: screen.mode ?? "local" });
  };

  const selectMode = (mode: VaultMode) => {
    if (screen.name !== "onboarding") return;
    setScreen({ ...screen, mode });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {screen.name === "onboarding" ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Step {screen.step + 1} of 3</Text>
            <Text style={styles.title}>Every account starts with login.</Text>
            <Text style={styles.lede}>
              Choose the access tier, understand the boundary, and then secure the account with PIN and biometrics.
            </Text>
          </View>

          {screen.step === 0 ? (
            <View style={styles.sheet}>
              <Text style={styles.sectionTitle}>Choose your setup</Text>
              <Text style={styles.sheetCopy}>
                Free Basic covers the essential document group behind login. Premium expands to the broader cloud-backed workspace with restore and web access.
              </Text>

              <Pressable
                style={[styles.choiceCard, screen.mode === "local" && styles.choiceCardActive]}
                onPress={() => selectMode("local")}
              >
                <Text style={styles.choiceTitle}>Free Basic</Text>
                <Text style={styles.choiceCopy}>Login required, core identity records first, and a tighter cloud-backed limit for the basic group.</Text>
              </Pressable>

              <Pressable
                style={[styles.choiceCard, screen.mode === "cloud" && styles.choiceCardActive]}
                onPress={() => selectMode("cloud")}
              >
                <Text style={styles.choiceTitle}>Premium</Text>
                <Text style={styles.choiceCopy}>Encrypted backup, restore on a new device, the full web portal, and broader document groups.</Text>
              </Pressable>
            </View>
          ) : null}

          {screen.step === 1 ? (
            <View style={styles.sheet}>
              <Text style={styles.sectionTitle}>Set your unlock rules</Text>
              <Text style={styles.sheetCopy}>
                Every document stays behind an app PIN. Biometrics are convenience, not the only lock.
              </Text>
              <View style={styles.lockCard}>
                <Text style={styles.lockTitle}>App PIN</Text>
                <Text style={styles.lockValue}>••••</Text>
              </View>
              <View style={styles.lockCard}>
                <Text style={styles.lockTitle}>Biometric unlock</Text>
                <Text style={styles.lockValue}>Enabled after PIN</Text>
              </View>
            </View>
          ) : null}

          {screen.step === 2 ? (
            <View style={styles.sheet}>
              <Text style={styles.sectionTitle}>Read the warnings</Text>
              <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>Account recovery warning</Text>
                <Text style={styles.warningCopy}>Email-based account recovery should exist for every user, but document recovery promises must stay honest about the actual encryption design.</Text>
              </View>
              <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>Legal warning</Text>
                <Text style={styles.warningCopy}>A scanned document may not be accepted as a legal replacement for the original.</Text>
              </View>
              <View style={styles.banner}>
                <Text style={styles.bannerText}>
                  {configured ? "Shared Supabase env detected" : "Using placeholder Supabase env values"}
                </Text>
              </View>
            </View>
          ) : null}

          <Pressable
            style={[styles.primaryButton, !screen.mode && screen.step === 0 && styles.primaryButtonDisabled]}
            onPress={continueOnboarding}
            disabled={!screen.mode && screen.step === 0}
          >
            <Text style={styles.primaryButtonText}>
              {screen.step < 2 ? "Continue" : "Enter wallet"}
            </Text>
          </Pressable>
        </ScrollView>
      ) : null}

      {screen.name === "home" ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.walletHero}>
            <View>
              <Text style={styles.eyebrow}>{activeMode === "cloud" ? "Premium" : "Free Basic"}</Text>
              <Text style={styles.walletTitle}>When life asks for documents, this is where they are.</Text>
            </View>
            <View style={styles.heroActions}>
              <Pressable style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add document</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              {activeMode === "cloud"
                ? "Premium unlocks the broader cloud-backed workspace and recovery-focused features."
                : "Free Basic stays login-backed and focused on the core document group."}
            </Text>
          </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by document or category"
            placeholderTextColor="#8d98a4"
            style={styles.searchInput}
          />

          <View style={styles.quickStats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{prototypeSnapshot.documents.length}</Text>
              <Text style={styles.statLabel}>Saved docs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{prototypeSnapshot.templates.filter((item) => item.status === "missing").length}</Text>
              <Text style={styles.statLabel}>Missing slots</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{prototypeSnapshot.templates.filter((item) => item.status === "expiring-soon").length}</Text>
              <Text style={styles.statLabel}>Need attention</Text>
            </View>
          </View>

          <View style={styles.section}>
            {filteredCategories.map((entry) => {
              const counts = categoryCounts(entry.id);
              return (
                <Pressable
                  key={entry.id}
                  style={[styles.walletCard, { borderLeftColor: entry.accent }]}
                  onPress={() => setScreen({ name: "category", mode: activeMode, categoryId: entry.id })}
                >
                  <View style={styles.walletCardTop}>
                    <View>
                      <Text style={styles.walletCardTitle}>{entry.title}</Text>
                      <Text style={styles.walletCardSubtitle}>{entry.subtitle}</Text>
                    </View>
                    <Text style={styles.walletCardCount}>{counts.uploaded}/{counts.total}</Text>
                  </View>
                  <View style={styles.walletCardMeta}>
                    <Text style={styles.metaTag}>{counts.missing} missing</Text>
                    <Text style={styles.metaTag}>{counts.attention} expiring</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      {screen.name === "category" && category ? (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.categoryHero}>
            <Pressable onPress={() => setScreen({ name: "home", mode: activeMode })}>
              <Text style={styles.backLink}>Back to wallet</Text>
            </Pressable>
            <Text style={styles.walletTitle}>{category.title}</Text>
            <Text style={styles.lede}>{category.subtitle}</Text>
          </View>

          <View style={styles.section}>
            {categoryTemplates.map((template) => (
              <Pressable
                key={template.id}
                style={styles.slotCard}
                onPress={() => setSelectedTemplate(template)}
              >
                <View style={styles.slotTop}>
                  <Text style={styles.slotTitle}>{template.title}</Text>
                  <View style={[styles.slotStatus, { backgroundColor: statusPalette[template.status] }]}>
                    <Text style={styles.statusText}>{template.status}</Text>
                  </View>
                </View>
                <Text style={styles.slotHelper}>{template.helper}</Text>
                <Text style={styles.slotMeta}>{statusLabel(template)}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <Modal visible={Boolean(selectedTemplate)} transparent animationType="slide" onRequestClose={() => setSelectedTemplate(null)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>{selectedTemplate?.title}</Text>
            <Text style={styles.sheetCopy}>{selectedTemplate?.helper}</Text>
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Status</Text>
              <Text style={styles.warningCopy}>{selectedTemplate ? statusLabel(selectedTemplate) : ""}</Text>
            </View>
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Notes</Text>
              <Text style={styles.warningCopy}>{selectedTemplate?.note ?? "No note yet"}</Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Rescan / Replace</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => setSelectedTemplate(null)}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3efe8"
  },
  container: {
    padding: 18,
    gap: 18
  },
  hero: {
    backgroundColor: "#faf3e7",
    borderRadius: 30,
    padding: 24,
    gap: 14
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: "#b16a22",
    fontWeight: "700"
  },
  title: {
    fontSize: 36,
    lineHeight: 38,
    color: "#1f2933",
    fontWeight: "700"
  },
  walletTitle: {
    fontSize: 32,
    lineHeight: 36,
    color: "#1f2933",
    fontWeight: "700"
  },
  lede: {
    fontSize: 16,
    lineHeight: 24,
    color: "#52606d"
  },
  sheet: {
    gap: 14,
    backgroundColor: "white",
    borderRadius: 28,
    padding: 20
  },
  sheetCopy: {
    color: "#52606d",
    lineHeight: 22
  },
  choiceCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dfd8cd",
    backgroundColor: "#fcfaf6",
    gap: 12
  },
  choiceCardActive: {
    backgroundColor: "#204a72",
    borderColor: "#204a72"
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2933"
  },
  choiceCopy: {
    color: "#5c6773",
    lineHeight: 20
  },
  lockCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#fcfaf6",
    borderWidth: 1,
    borderColor: "#eadfca",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  lockTitle: {
    fontSize: 16,
    color: "#1f2933",
    fontWeight: "700"
  },
  lockValue: {
    color: "#204a72",
    fontWeight: "700"
  },
  warningCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#fff8ef",
    borderWidth: 1,
    borderColor: "#ebd6b4",
    gap: 6
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18222d"
  },
  warningCopy: {
    color: "#5c6773",
    lineHeight: 20
  },
  banner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignSelf: "flex-start",
    backgroundColor: configured ? "#d8f3e8" : "#fce7cb"
  },
  bannerText: {
    color: "#4a5560",
    fontWeight: "600"
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f4f7b"
  },
  primaryButtonDisabled: {
    backgroundColor: "#9cacbd"
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16
  },
  secondaryButton: {
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef1f5"
  },
  secondaryButtonText: {
    color: "#28445f",
    fontWeight: "700"
  },
  walletHero: {
    gap: 16,
    backgroundColor: "#fffaf3",
    borderRadius: 28,
    padding: 22
  },
  heroActions: {
    flexDirection: "row"
  },
  addButton: {
    borderRadius: 999,
    backgroundColor: "#204a72",
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  addButtonText: {
    color: "white",
    fontWeight: "700"
  },
  searchInput: {
    borderRadius: 18,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#1f2933",
    fontSize: 16
  },
  quickStats: {
    flexDirection: "row",
    gap: 10
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#fffaf3",
    padding: 16,
    gap: 4
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2933"
  },
  statLabel: {
    color: "#5c6773"
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2933"
  },
  walletCard: {
    borderRadius: 24,
    borderLeftWidth: 8,
    backgroundColor: "white",
    padding: 18,
    gap: 14
  },
  walletCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  walletCardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2933"
  },
  walletCardSubtitle: {
    color: "#52606d",
    marginTop: 4
  },
  walletCardCount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#204a72"
  },
  walletCardMeta: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  metaTag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#eef1f5",
    color: "#52606d",
    overflow: "hidden"
  },
  categoryHero: {
    gap: 10,
    backgroundColor: "#fffaf3",
    borderRadius: 28,
    padding: 22
  },
  backLink: {
    color: "#204a72",
    fontWeight: "700"
  },
  slotCard: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 24,
    gap: 10
  },
  slotTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center"
  },
  slotTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2933"
  },
  slotHelper: {
    color: "#52606d",
    lineHeight: 20
  },
  slotMeta: {
    color: "#52606d"
  },
  slotStatus: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  statusText: {
    color: "white",
    textTransform: "capitalize",
    fontWeight: "700"
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(24, 34, 45, 0.35)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: "#fffaf3",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 14
  },
  modalActions: {
    gap: 10
  }
});
