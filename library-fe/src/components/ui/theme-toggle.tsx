import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useRef, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(() => false);
  const initRef = useRef(false);

  if (!initRef.current) {
    initRef.current = true;
    // ponytail: schedule mount flag outside render via microtask
    queueMicrotask(() => setMounted(true));
  }

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-xl transition-colors hover:bg-muted ${className}`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-foreground" />
      )}
    </button>
  );
}
