import type {CSSProperties} from 'react';
const paths:Record<string,string>={
 home:'m3 10 9-7 9 7 M5 9v12h5v-7h4v7h5V9',
 user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2Z',
 hospital:'M4 21V5h16v16 M9 21v-5h6v5 M9 8h6 M12 5v6 M7 13h2 M15 13h2',
 calendar:'M4 5h16v16H4Z M8 3v4 M16 3v4 M4 10h16 M8 14h1 M12 14h1 M16 14h1 M8 18h1 M12 18h1',
 lab:'M9 3h6 M10 3v7L4 20q-1 1 1 1h14q2 0 1-1l-6-10V3 M8 15h8',
 card:'M3 5h18v14H3Z M3 10h18 M6 15h5',
 file:'M5 3h10l4 4v14H5Z M14 3v5h5 M8 12h8 M8 16h6',
 star:'m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z',
 bell:'M5 17h14l-2-3V9A5 5 0 0 0 7 9v5Z M10 21h4',
 search:'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
 heart:'M12 21 3 12C-3 3 8-2 12 5 16-2 27 3 21 12Z M3 12h5l2-5 4 10 2-5h5',
 check:'m5 12 4 4L19 6',
 settings:'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
};
export function Icon({name,size=22,style}:{name:string;size?:number;style?:CSSProperties}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]||paths.hospital}/></svg>}
