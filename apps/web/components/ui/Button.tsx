import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

type SharedProps = {
  children: ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type LinkButtonProps = SharedProps & {
  href: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "children" | "className" | "href">;

type NativeButtonProps = SharedProps &
  Omit<ComponentPropsWithoutRef<"button">, "children" | "className"> & {
    href?: undefined;
  };

type ButtonProps = LinkButtonProps | NativeButtonProps;

function buttonClassName(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return ["button", `button-${variant}`, `button-${size}`, className].filter(Boolean).join(" ");
}

export function Button(props: ButtonProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";

  if ("href" in props && typeof props.href === "string") {
    const { children, className, href, ...rest } = props;
    return (
      <Link className={buttonClassName(variant, size, className)} href={href} {...rest}>
        {children}
      </Link>
    );
  }

  const { children, className, type, ...rest } = props as NativeButtonProps;
  const buttonType = type === "submit" || type === "reset" ? type : "button";

  return (
    <button className={buttonClassName(variant, size, className)} type={buttonType} {...rest}>
      {children}
    </button>
  );
}
