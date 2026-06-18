import { ComponentProps } from "solid-js"

// SQUADCODER: brand mark — a terminal-prompt ">_" glyph. Replaces the inherited
// opencode square block so the empty-state / loading icon reads as SquadCoder, not
// opencode. Stroked (not filled) so it stays crisp at every size and follows the
// theme via the icon color vars. The underscore cursor uses the weaker var for depth.
export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        data-slot="logo-mark-prompt"
        d="M3.5 6 L8.5 10 L3.5 14"
        stroke="var(--icon-strong-base)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        data-slot="logo-mark-cursor"
        d="M8.5 14 H13"
        stroke="var(--icon-base)"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 34 L46 50 L20 66"
        stroke="var(--icon-strong-base)"
        stroke-width="9"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M46 66 H64"
        stroke="var(--icon-base)"
        stroke-width="9"
        stroke-linecap="round"
      />
    </svg>
  )
}

// SQUADCODER: brand wordmark. Rendered as SVG text (not hand-pixeled paths) so it
// auto-updates if the brand name changes; matches the prior viewBox so existing
// `class` sizing (e.g. md:w-xl, opacity-12 watermark) keeps working.
export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 234 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <text
        x="117"
        y="33"
        text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Rubik, Heebo, sans-serif"
        font-size="34"
        font-weight="800"
        letter-spacing="-1"
        fill="var(--icon-strong-base)"
      >
        SquadCoder
      </text>
    </svg>
  )
}
