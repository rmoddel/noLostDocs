import { LoginForm } from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextValue = resolvedSearchParams.next;
  const nextPath = Array.isArray(nextValue) ? nextValue[0] : nextValue;

  return <LoginForm nextPath={typeof nextPath === "string" && nextPath.startsWith("/") ? nextPath : "/dashboard"} />;
}
