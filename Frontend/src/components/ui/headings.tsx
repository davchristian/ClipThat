import type { ReactNode } from "react";
import { PageClock } from "./page-clock";

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
      {action && <div className="page-heading-actions">{action}</div>}
      <PageClock />
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
