import React, { createContext, useContext } from "react";
import type { IconProps } from "./defaultIcons.js";
import { defaultIconMap } from "./defaultIcons.js";

/* ------------------------------------------------------------------ */
/*  Icon Resolver                                                       */
/* ------------------------------------------------------------------ */

/**
 * A function that resolves a semantic icon name to a React node.
 * Return `null` to fall through to text rendering.
 */
export type IconResolver = (
  name: string,
  props?: IconProps,
) => React.ReactNode;

/**
 * Default resolver: looks up `name` in `defaultIconMap`, renders the
 * SVG component if found, otherwise renders the string as text.
 */
export function defaultIconResolver(
  name: string,
  props?: IconProps,
): React.ReactNode {
  const Icon = defaultIconMap[name];
  if (Icon) return <Icon {...props} />;
  return <span className="kanava-icon-text">{name}</span>;
}

/* ------------------------------------------------------------------ */
/*  Context                                                             */
/* ------------------------------------------------------------------ */

const IconContext = createContext<IconResolver>(defaultIconResolver);

export interface KanavaIconProviderProps {
  /** Custom icon resolver. Receives semantic name + optional props. */
  resolver: IconResolver;
  children: React.ReactNode;
}

/**
 * Provide a custom icon resolver to all Kanava components below.
 *
 * @example
 * ```tsx
 * import { AlignLeft } from "lucide-react";
 * const myResolver = (name, props) => {
 *   if (name === "alignLeft") return <AlignLeft size={props?.size ?? 16} />;
 *   return defaultIconResolver(name, props);
 * };
 * <KanavaIconProvider resolver={myResolver}>
 *   <KanavaEditorComponent ... />
 * </KanavaIconProvider>
 * ```
 */
export function KanavaIconProvider({
  resolver,
  children,
}: KanavaIconProviderProps) {
  return (
    <IconContext.Provider value={resolver}>{children}</IconContext.Provider>
  );
}

/**
 * Returns the current icon resolver function from context.
 * Call `resolver(name, props)` to get a React node.
 */
export function useIconResolver(): IconResolver {
  return useContext(IconContext);
}

/* ------------------------------------------------------------------ */
/*  Convenience component                                               */
/* ------------------------------------------------------------------ */

export interface KanavaIconComponentProps extends IconProps {
  name: string;
}

/**
 * Render an icon by semantic name using the current resolver.
 *
 * @example
 * ```tsx
 * <KanavaIcon name="trash" size={18} />
 * ```
 */
export function KanavaIcon({ name, ...props }: KanavaIconComponentProps) {
  const resolve = useContext(IconContext);
  return <>{resolve(name, props)}</>;
}
