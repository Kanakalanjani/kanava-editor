import React from "react";
import { EditIcon, ExternalLinkIcon, CloseIcon } from "./icons/index.js";
import "./components.css";

/* ------------------------------------------------------------------ */
/*  LinkPreviewCard                                                     */
/* ------------------------------------------------------------------ */

export interface LinkPreviewCardProps {
  /** The link URL to display. */
  href: string;
  /** Anchor rect for positioning the card. */
  anchorRect: DOMRect;
  /** Called when the user clicks "Edit". */
  onEdit: () => void;
  /** Called when the user clicks "Remove". */
  onRemove: () => void;
  /** Extra CSS class. */
  className?: string;
}

/**
 * Floating card shown below a link — displays URL with Edit, Open, and Remove actions.
 */
export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({
  href,
  anchorRect,
  onEdit,
  onRemove,
  className,
}) => {
  // Truncate long URLs for display
  const displayUrl = href.length > 50 ? href.slice(0, 47) + "…" : href;

  const style: React.CSSProperties = {
    position: "fixed",
    top: anchorRect.bottom + 4,
    left: anchorRect.left,
    zIndex: 10000,
  };

  // Flip above if near bottom of viewport
  if (anchorRect.bottom + 60 > window.innerHeight) {
    style.top = anchorRect.top - 48;
  }

  return (
    <div className={`kanava-link-preview ${className || ""}`} style={style}>
      <a
        className="kanava-lp-url"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={href}
      >
        {displayUrl}
      </a>
      <div className="kanava-lp-actions">
        <button className="kanava-lp-btn" onClick={onEdit} type="button" title="Edit link">
          <EditIcon size={14} />
        </button>
        <button
          className="kanava-lp-btn"
          onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
          type="button"
          title="Open in new tab"
        >
          <ExternalLinkIcon size={14} />
        </button>
        <button className="kanava-lp-btn kanava-lp-btn-danger" onClick={onRemove} type="button" title="Remove link">
          <CloseIcon size={14} />
        </button>
      </div>
    </div>
  );
};

LinkPreviewCard.displayName = "KanavaLinkPreviewCard";
