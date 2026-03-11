import React from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface IconProps {
  /** Rendered size in pixels. Default: 16 */
  size?: number;
  /** Extra CSS class */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Base SVG wrapper                                                    */
/* ------------------------------------------------------------------ */

function Svg({
  size = 16,
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `kanava-icon ${className}` : "kanava-icon"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Alignment                                                           */
/* ------------------------------------------------------------------ */

export function AlignLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6h16M4 12h10M4 18h13" />
    </Svg>
  );
}

export function AlignCenterIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6h16M7 12h10M5 18h14" />
    </Svg>
  );
}

export function AlignRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6h16M10 12h10M7 18h13" />
    </Svg>
  );
}

export function AlignJustifyIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Navigation                                                          */
/* ------------------------------------------------------------------ */

export function ChevronDownIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Actions                                                             */
/* ------------------------------------------------------------------ */

export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function MinusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 12h14" />
    </Svg>
  );
}

export function TrashIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

export function DuplicateIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  );
}

export function UndoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13" />
    </Svg>
  );
}

export function RedoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.69 3L21 13" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Link & Edit                                                         */
/* ------------------------------------------------------------------ */

export function LinkIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  );
}

export function ExternalLinkIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </Svg>
  );
}

export function EditIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Image editor                                                        */
/* ------------------------------------------------------------------ */

export function CropIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </Svg>
  );
}

export function RotateIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 12a9 9 0 1 1-9-9" />
      <path d="M15 3h6v6" />
    </Svg>
  );
}

export function AdjustmentsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </Svg>
  );
}

export function FilterIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path
        d="M12 2a10 10 0 0 1 0 20z"
        fill="currentColor"
        stroke="none"
      />
    </Svg>
  );
}

export function ResizeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" />
    </Svg>
  );
}

export function UploadIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </Svg>
  );
}

export function ImageIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Block types & structure                                             */
/* ------------------------------------------------------------------ */

export function ColumnsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="8" height="18" rx="1" />
      <rect x="13" y="3" width="8" height="18" rx="1" />
    </Svg>
  );
}

export function Columns3Icon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2" y="3" width="5.5" height="18" rx="1" />
      <rect x="9.25" y="3" width="5.5" height="18" rx="1" />
      <rect x="16.5" y="3" width="5.5" height="18" rx="1" />
    </Svg>
  );
}

export function Columns4Icon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="1.5" y="3" width="4" height="18" rx="1" />
      <rect x="7" y="3" width="4" height="18" rx="1" />
      <rect x="12.5" y="3" width="4" height="18" rx="1" />
      <rect x="18" y="3" width="4" height="18" rx="1" />
    </Svg>
  );
}

export function ParagraphIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M13 4v16M17 4v16M13 4H9a4 4 0 0 0 0 8h4" />
    </Svg>
  );
}

export function InsertBelowIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 18h16" />
      <path d="M12 6v8M8 10l4 4 4-4" />
    </Svg>
  );
}

export function AddColumnLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="10" y="3" width="11" height="18" rx="2" />
      <path d="M5 8v8M2 12h6" />
    </Svg>
  );
}

export function AddColumnRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="11" height="18" rx="2" />
      <path d="M19 8v8M16 12h6" />
    </Svg>
  );
}

export function TurnIntoIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" />
    </Svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </Svg>
  );
}

export function GripIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function ZoomInIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </Svg>
  );
}

export function ZoomOutIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35M8 11h6" />
    </Svg>
  );
}

export function ReplaceIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 7H8l4-4" />
      <path d="M4 17h12l-4 4" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Default Icon Map                                                    */
/* ------------------------------------------------------------------ */

/**
 * Maps semantic icon names to React components.
 * Used by the default icon resolver.
 */
export const defaultIconMap: Record<
  string,
  React.FC<IconProps>
> = {
  // Alignment
  alignLeft: AlignLeftIcon,
  alignCenter: AlignCenterIcon,
  alignRight: AlignRightIcon,
  alignJustify: AlignJustifyIcon,

  // Navigation
  chevronDown: ChevronDownIcon,
  chevronRight: ChevronRightIcon,

  // Actions
  check: CheckIcon,
  close: CloseIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  trash: TrashIcon,
  delete: TrashIcon,
  duplicate: DuplicateIcon,
  undo: UndoIcon,
  redo: RedoIcon,

  // Link & edit
  link: LinkIcon,
  externalLink: ExternalLinkIcon,
  edit: EditIcon,
  editImage: EditIcon,

  // Image editor
  crop: CropIcon,
  rotate: RotateIcon,
  adjustments: AdjustmentsIcon,
  filter: FilterIcon,
  resize: ResizeIcon,
  width: ResizeIcon,
  upload: UploadIcon,
  image: ImageIcon,

  // Block types & structure
  columns: ColumnsIcon,
  columns2: ColumnsIcon,
  columns3: Columns3Icon,
  columns4: Columns4Icon,
  paragraph: ParagraphIcon,
  insertBelow: InsertBelowIcon,
  addColumnLeft: AddColumnLeftIcon,
  addColumnRight: AddColumnRightIcon,
  turnInto: TurnIntoIcon,

  // Utilities
  search: SearchIcon,
  grip: GripIcon,
  zoomIn: ZoomInIcon,
  zoomOut: ZoomOutIcon,
  replace: ReplaceIcon,
};
