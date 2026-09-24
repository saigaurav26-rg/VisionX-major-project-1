"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  CloudRain,
  Cpu,
  History,
  Settings as SettingsIcon,
  BookOpen,
  Sparkles,
  LayoutGrid,
  ScanSearch,
  ImageIcon,
  Gauge,
  Globe,
  Bot,
  Menu,
  X,
  Layers,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelStatusBadge } from "@/components/model-status-badge";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "VisionX",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutGrid }],
  },
  {
    label: "Restoration",
    items: [
      { href: "/app", label: "VisionX Engine", icon: Sparkles },
      { href: "/app?view=xray", label: "Restoration X-Ray", icon: ScanSearch },
      { href: "/app?view=results", label: "Results", icon: ImageIcon },
    ],
  },
  {
    label: "Analysis",
    items: [
      { href: "/app?view=objects", label: "Object Detection", icon: Layers },
      { href: "/app?view=analysis", label: "Image Analysis", icon: FlaskConical },
      { href: "/app?view=metrics", label: "Metrics", icon: Gauge },
      { href: "/applications", label: "Real-World Applications", icon: Globe },
    ],
  },
  {
    label: "Assistant",
    items: [{ href: "/app?view=assistant", label: "VisionX Q&A", icon: Bot }],
  },
  {
    label: "System",
    items: [
      { href: "/model", label: "Model", icon: Cpu },
      { href: "/history", label: "History", icon: History },
      { href: "/docs", label: "Documentation", icon: BookOpen },
      { href: "/settings", label: "Settings", icon: SettingsIcon },
      { href: "/docs#about", label: "About", icon: BookOpen },
    ],
  },
];

const BARE_PATHS = new Set(["/", "/applications"]);

function isActive(pathname: string, search: string, href: string) {
  const [path, query] = href.split("?");
  if (path !== pathname) return false;
  if (!query) {
    if (pathname === "/app") {
      const view = new URLSearchParams(search).get("view");
      return !view;
    }
    return true;
  }
  const want = new URLSearchParams(query).get("view");
  const have = new URLSearchParams(search).get("view");
  return want === have;
}

function SidebarNav({
  pathname,
  search,
  onNavigate,
}: {
  pathname: string;
  search: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-2 mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
            {group.label}
          </div>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, search, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-sm border border-transparent transition-colors",
                    active
                      ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-300 border-yellow-500/30 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className={cn("h-3.5 w-3.5", active ? "text-yellow-500 dark:text-yellow-400" : "text-muted-foreground")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-card sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2.5 px-4 h-16 border-b border-border">
          <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-yellow-500/90 to-yellow-600/60 flex items-center justify-center ring-1 ring-yellow-400/30">
            <CloudRain className="h-4 w-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-foreground">VISIONX</span>
            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Engine</span>
          </div>
        </Link>
        <SidebarNav pathname={pathname} search={search} />
        <div className="px-4 py-3 border-t border-border text-[10px] font-mono text-muted-foreground">
          VisionX Engine
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 h-16 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="h-full px-4 lg:px-8 flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="lg:hidden flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">VISIONX</span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <ModelStatusBadge />
            </div>
          </div>
        </header>

        {open && (
          <div className="lg:hidden fixed inset-0 z-50">
            <button
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
            <aside className="relative h-full w-72 max-w-[85vw] bg-card border-r border-border flex flex-col">
              <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                <span className="text-sm font-semibold text-foreground">VISIONX</span>
                <button onClick={() => setOpen(false)} aria-label="Close" className="p-2 text-muted-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav pathname={pathname} search={search} onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border">
          <div className="px-4 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>VISIONX Engine — image restoration for rain-degraded vision</div>
            <a
              href="https://huggingface.co/NSG04/visionx-model"
              target="_blank"
              rel="noreferrer"
              className="text-foreground/80 hover:text-yellow-500 underline-offset-2 hover:underline"
            >
              NSG04/visionx-model
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (BARE_PATHS.has(pathname)) {
    return <>{children}</>;
  }
  return (
    <Suspense fallback={<div className="min-h-screen bg-background">{children}</div>}>
      <AppChrome>{children}</AppChrome>
    </Suspense>
  );
}