import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureUserProfile } from "@/lib/auth/ensureUserProfile";
import { loadDashboardDocuments, type DashboardDocumentRecord } from "@/lib/documents/dashboard";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function statusLabel(status: string) {
  switch (status) {
    case "active":
    case "uploaded":
      return "Active";
    case "expired":
      return "Expired";
    case "archived":
      return "Archived";
    case "needs_review":
    case "missing":
      return "Needs Review";
    case "expiring-soon":
      return "Expiring Soon";
    default:
      return "Active";
  }
}

function statusTone(status: string) {
  switch (status) {
    case "active":
    case "uploaded":
      return "active";
    case "archived":
      return "archived";
    case "expired":
      return "expired";
    case "needs_review":
    case "missing":
      return "review";
    case "expiring-soon":
      return "warning";
    default:
      return "active";
  }
}

function relativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function matchesSearch(document: DashboardDocumentRecord, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    document.title,
    document.document_type_name ?? "",
    document.category_name ?? "",
    document.owner_profile_name ?? "",
    document.notes ?? "",
    ...(document.tags ?? [])
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams ?? Promise.resolve(emptySearchParams)]);
  const qValue = resolvedSearchParams.q;
  const query = (Array.isArray(qValue) ? qValue[0] : qValue ?? "").trim();
  const normalizedQuery = query.toLowerCase();

  const user = await requireUser(`/dashboard/categories/${slug}`);
  const { client, configured } = await createServerSupabaseClient();

  if (configured && client) {
    try {
      await ensureUserProfile(client, user);
    } catch (profileError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to ensure user profile", profileError);
      }
    }
  }

  const dashboardData =
    configured && client
      ? await loadDashboardDocuments(client, user.id)
      : { categories: [], documentTypes: [], documents: [], errorMessage: null, profiles: [] };

  const category = dashboardData.categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const documents = dashboardData.documents
    .filter((document) => document.category_slug === slug)
    .filter((document) => matchesSearch(document, normalizedQuery));
  const types = dashboardData.documentTypes.filter((type) => type.category_id === category.id);

  return (
    <main className="category-page">
      <div className="category-shell">
        <header className="category-header">
          <Link className="category-back-link" href="/dashboard">
            ‹ Dashboard
          </Link>
          <div>
            <p className="category-eyebrow">Category</p>
            <h1>{category.name}</h1>
            <p>{category.description}</p>
          </div>
        </header>

        <form action={`/dashboard/categories/${category.slug}`} className="category-search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            <circle cx="10.7" cy="10.7" r="6.7" stroke="currentColor" strokeWidth="1.9" />
          </svg>
          <input aria-label={`Search ${category.name}`} defaultValue={query} name="q" placeholder={`Search ${category.name.toLowerCase()} documents...`} type="search" />
          <button type="submit">Search</button>
        </form>

        {types.length ? (
          <section className="category-type-strip" aria-label="Document types">
            {types.map((type) => (
              <span key={type.id}>{type.name}</span>
            ))}
          </section>
        ) : null}

        <section className="category-results">
          <div className="category-results-header">
            <h2>{documents.length} documents</h2>
            <Link href={`/dashboard?scan=open&category=${encodeURIComponent(category.slug)}`}>Add document</Link>
          </div>

          <div className="category-document-list">
            {documents.length ? documents.map((document) => (
              <article className="category-document-row" key={document.id}>
                <div>
                  <h3>{document.title}</h3>
                  <p>{document.document_type_name ?? "Document type"} · {document.owner_profile_name ?? "Me"}</p>
                </div>
                <span className={`dashboard-pill ${statusTone(document.status)}`}>{statusLabel(document.status)}</span>
                <time>{relativeDate(document.updated_at)}</time>
              </article>
            )) : (
              <div className="category-empty-state">
                No documents match this category yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
