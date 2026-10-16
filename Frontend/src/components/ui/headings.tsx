import type { ReactNode } from "react";

export function HeadingMeta({ action }: { action?: ReactNode }) {
  if (!action) return null;
  return (
    <div className="page-heading-meta">
      {action && <div className="page-heading-actions">{action}</div>}
    </div>
  );
}

export function PageHeading({
  title,
  action,
  leading,
}: {
  title: string;
  action?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <div className="page-heading">
      {leading ? (
        <div className="page-heading-title">
          {leading}
          <h1>{title}</h1>
        </div>
      ) : (
        <h1>{title}</h1>
      )}
      <HeadingMeta action={action} />
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {action}
    </div>
  );
}
