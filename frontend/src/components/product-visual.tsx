/* eslint-disable @next/next/no-img-element */

type ProductVisualProps = {
  name: string;
  imageUrl?: string | null;
  categoryName?: string | null;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

const GENERIC_ASSETS = new Set(["/file.svg", "/globe.svg", "/next.svg", "/vercel.svg", "/window.svg"]);

const VISUAL_THEMES = [
  {
    bg: "#e9f3ef",
    accent: "#00796b",
    secondary: "#c9dfd8",
  },
  {
    bg: "#f4eadc",
    accent: "#a15c16",
    secondary: "#e2c7a4",
  },
  {
    bg: "#eef0f5",
    accent: "#355070",
    secondary: "#c9d1e0",
  },
  {
    bg: "#f4e7e7",
    accent: "#9f2d45",
    secondary: "#e2c3c9",
  },
];

function getTheme(name: string) {
  const index = [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % VISUAL_THEMES.length;
  return VISUAL_THEMES[index];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function shouldUseGeneratedVisual(imageUrl?: string | null) {
  return !imageUrl || GENERIC_ASSETS.has(imageUrl);
}

export function ProductVisual({
  name,
  imageUrl,
  categoryName,
  className = "h-full w-full",
  imageClassName = "h-full w-full object-contain p-8",
  priority = false,
}: ProductVisualProps) {
  if (!shouldUseGeneratedVisual(imageUrl)) {
    return (
      <div className={`flex items-center justify-center bg-[var(--ink-soft)] ${className}`}>
        <img src={imageUrl ?? ""} alt={name} loading={priority ? "eager" : "lazy"} className={imageClassName} />
      </div>
    );
  }

  const theme = getTheme(name);

  return (
    <div
      className={`relative grid place-items-center overflow-hidden ${className}`}
      style={{ backgroundColor: theme.bg }}
      aria-label={name}
      role="img"
    >
      <div
        className="absolute left-[12%] top-[14%] h-[22%] w-[34%] rounded-full opacity-70"
        style={{ backgroundColor: theme.secondary }}
      />
      <div
        className="absolute bottom-[12%] right-[10%] h-[28%] w-[28%] rounded-lg opacity-80"
        style={{ backgroundColor: theme.secondary }}
      />
      <div
        className="relative grid aspect-square w-[42%] min-w-28 max-w-52 place-items-center rounded-full text-3xl font-semibold tracking-tight text-white shadow-[0_18px_45px_rgba(29,39,33,0.16)]"
        style={{ backgroundColor: theme.accent }}
      >
        {getInitials(name)}
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white/80 px-4 py-3 backdrop-blur">
        <p className="truncate text-sm font-semibold">{name}</p>
        {categoryName ? (
          <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
            {categoryName}
          </p>
        ) : null}
      </div>
    </div>
  );
}
