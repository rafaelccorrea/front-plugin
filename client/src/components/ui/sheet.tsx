"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const SheetOpenContext = React.createContext<boolean | undefined>(undefined);

function Sheet({
  open,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return (
    <SheetOpenContext.Provider value={open}>
      <SheetPrimitive.Root data-slot="sheet" open={open} {...props} />
    </SheetOpenContext.Provider>
  );
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  );
}

/**
 * Drawer mobile: quando forceWidth=true, o caller (sidebar) passa style com width/maxWidth.
 * Quando fechado (open=false), aplica width 0 para o drawer reduzir o tamanho.
 */
function SheetContent({
  className,
  children,
  side = "right",
  forceWidth,
  forceMount,
  style,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  /** Se true, caller passa style com width (ex.: sidebar mobile). Não define largura aqui. */
  forceWidth?: boolean;
}) {
  const open = React.useContext(SheetOpenContext);
  const baseStyle = forceWidth ? { minWidth: "240px", ...style } : style;
  const mergedStyle =
    forceWidth && open === false
      ? {
          width: 0,
          minWidth: 0,
          maxWidth: 0,
          overflow: "hidden",
          padding: 0,
          borderWidth: 0,
          pointerEvents: "none" as const,
          transition: "width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease",
        }
      : baseStyle;
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!forceWidth || !contentRef.current) return;
    const el = contentRef.current;
    const s = mergedStyle as React.CSSProperties;
    const isClosed = forceWidth && open === false;
    const priority = isClosed ? "important" : undefined;
    if (s.width != null) el.style.setProperty("width", String(s.width), priority);
    if (s.maxWidth != null) el.style.setProperty("max-width", String(s.maxWidth), priority);
    if (s.minWidth != null) el.style.setProperty("min-width", String(s.minWidth), priority);
    return () => {
      el.style.removeProperty("width");
      el.style.removeProperty("max-width");
      el.style.removeProperty("min-width");
    };
  }, [forceWidth, mergedStyle, open]);

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={contentRef}
        data-slot="sheet-content"
        data-drawer-closed={forceWidth && open === false ? "true" : undefined}
        forceMount={forceMount}
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            !forceWidth &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            !forceWidth &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "left" &&
            forceWidth &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full border-r",
          side === "right" &&
            forceWidth &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full border-l",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        style={mergedStyle}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Fechar</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
