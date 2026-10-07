import { BadRequestException } from '@nestjs/common';

const nodes = new Set(['doc','paragraph','heading','text','hardBreak','bulletList','orderedList','listItem','blockquote','horizontalRule','codeBlock','image','table','tableRow','tableCell','tableHeader']);
const marks = new Set(['bold','italic','underline','strike','code','link']);
const validUrl = (value:unknown,image=false) => {
  if(typeof value!=='string'||value.length>2000)return false;
  try {return (image?['http:','https:']:['http:','https:','mailto:']).includes(new URL(value).protocol)} catch {return false}
};
// Persist structured content and render it with React. Never accept raw HTML.
export function validateArticleDocument(body:string) {
  let count=0;
  const invalid=()=>{throw new BadRequestException('Invalid article content')};
  function visit(value:any,depth=0):any {
    if(!value||typeof value!=='object'||Array.isArray(value)||depth>20||++count>5000||!nodes.has(value.type))return invalid();
    const result:any={type:value.type};
    if(value.type==='text') {
      if(typeof value.text!=='string'||!value.text.length)return invalid();
      result.text=value.text;
      if(value.marks!==undefined){
        if(!Array.isArray(value.marks)||value.marks.length>6)return invalid();
        result.marks=value.marks.map((mark:any)=>{
          if(!mark||!marks.has(mark.type))return invalid();
          if(mark.type==='link'){
            if(!validUrl(mark.attrs?.href))return invalid();
            return {type:'link',attrs:{href:mark.attrs.href,target:'_blank',rel:'noopener noreferrer'}};
          }
          return {type:mark.type};
        });
      }
    } else if(value.text!==undefined)return invalid();
    const a=value.attrs||{};
    if(['paragraph','heading'].includes(value.type)) {
      if(a.textAlign&&!['left','center','right','justify'].includes(a.textAlign))return invalid();
      result.attrs={...(a.textAlign?{textAlign:a.textAlign}:{}),...(value.type==='heading'?{level:a.level}:{})};
      if(value.type==='heading'&&![2,3].includes(a.level))return invalid();
    }
    if(value.type==='orderedList')result.attrs={start:Number.isInteger(a.start)&&a.start>=1&&a.start<=10000?a.start:1};
    if(value.type==='codeBlock')result.attrs={language:null};
    if(value.type==='image') {
      if(!validUrl(a.src,true))return invalid();
      result.attrs={src:a.src,alt:typeof a.alt==='string'?a.alt.slice(0,500):'',title:typeof a.title==='string'?a.title.slice(0,500):null};
    }
    if(['tableCell','tableHeader'].includes(value.type)) {
      const colspan=a.colspan??1,rowspan=a.rowspan??1;
      if(!Number.isInteger(colspan)||colspan<1||colspan>20||!Number.isInteger(rowspan)||rowspan<1||rowspan>100)return invalid();
      result.attrs={colspan,rowspan,colwidth:null};
    }
    if(value.content!==undefined){
      if(!Array.isArray(value.content)||value.content.length>1000)return invalid();
      result.content=value.content.map((child:any)=>visit(child,depth+1));
    }
    return result;
  }
  let doc;
  try {doc=JSON.parse(body)}catch{return invalid()}
  if(doc.type!=='doc')return invalid();
  const result=visit(doc);
  function text(node:any):string{return (node.text||'')+(node.content||[]).map(text).join(' ')}
  if(!text(result).trim()&&!JSON.stringify(result).includes('"type":"image"'))throw new BadRequestException('Write your article before saving');
  return JSON.stringify(result);
}
