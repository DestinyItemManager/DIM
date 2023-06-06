declare global {
  interface Window {
    ga: (...args: unknown[]) => void;
  }
}
export function gaPageView(path: string, title?: string) {
  window.ga('event', 'page_view', {
    page_title: title,
    page_location: window.location.origin + path,
  });
}

export function gaEvent(type: string, params: Record<string, string>) {
  window.ga('event', type, params);
}
