declare module 'data/d2/source-to-season-v2.json' {
  const x: { readonly [season: number]: number | undefined };
  export default x;
}
declare module 'data/d2/seasons.json' {
  const x: { readonly [itemHash: number]: number | undefined };
  export default x;
}
declare module 'data/d2/seasons_backup.json' {
  const x: { readonly [itemHash: number]: number | undefined };
  export default x;
}
declare module 'data/d2/watermark-to-season.json' {
  const x: { readonly [watermark: string]: number | undefined };
  export default x;
}

declare type D2EventIndex = keyof typeof import('data/d2/d2-event-info-v2').D2EventInfo;
declare module 'data/d2/watermark-to-event.json' {
  const x: { readonly [watermark: string]: D2EventIndex | undefined };
  export default x;
}
declare module 'data/d2/events.json' {
  const x: { readonly [itemHash: number]: D2EventIndex | undefined };
  export default x;
}
