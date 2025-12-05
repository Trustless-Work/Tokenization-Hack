// packages/ui/src/lib/utils.ts
export function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
