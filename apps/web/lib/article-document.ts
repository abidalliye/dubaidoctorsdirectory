export type ArticleNode={type:string;text?:string;attrs?:Record<string,any>;marks?:{type:string;attrs?:Record<string,any>}[];content?:ArticleNode[]};
const inline=(text:string):ArticleNode[]=>text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(s=>({type:'text',text:s.startsWith('**')?s.slice(2,-2):s,...(s.startsWith('**')?{marks:[{type:'bold'}]}:{})}));
export function articleDocument(body:string,format?:string):ArticleNode {
  if(format==='richtext'){try{const doc=JSON.parse(body);if(doc?.type==='doc')return doc}catch{}}
  return {type:'doc',content:body.split(/\n\s*\n/).filter(Boolean).map(block=>{
    if(/^#{2,3} /.test(block))return {type:'heading',attrs:{level:block.startsWith('###')?3:2},content:inline(block.replace(/^#{2,3} /,''))};
    if(block.split('\n').every(s=>s.startsWith('- ')))return {type:'bulletList',content:block.split('\n').map(s=>({type:'listItem',content:[{type:'paragraph',content:inline(s.slice(2))}]}))};
    return {type:'paragraph',content:block.split('\n').flatMap((s,i)=>[...(i?[{type:'hardBreak'}]:[]),...inline(s)])};
  })};
}
export function articleText(body:string,format?:string):string {
  if(format!=='richtext')return body;
  const text=(n:ArticleNode):string=>n.text||n.content?.map(text).join(n.type==='paragraph'?'':' ')||'';
  return text(articleDocument(body,format));
}
