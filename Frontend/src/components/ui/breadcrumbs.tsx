import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import { PageClock } from "./page-clock";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          {items.length ? (
            <Link href="/">
              <House size={15} aria-hidden="true" />
              <span>Home</span>
            </Link>
          ) : (
            <span className="breadcrumb-current breadcrumb-home" aria-current="page">
              <House size={15} aria-hidden="true" /> Home
            </span>
          )}
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            <ChevronRight size={14} aria-hidden="true" />
            {item.href ? (
              <Link href={item.href} title={item.label}>
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="breadcrumb-current" aria-current="page" title={item.label}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      <PageClock />
    </nav>
  );
}
