export function prefetchRoute(importer: () => Promise<unknown>): void {
  importer().catch(() => {});
}
