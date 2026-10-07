import {Fragment,ReactNode,CSSProperties} from 'react';
import {articleDocument,ArticleNode} from '../lib/article-document';
const safeUrl=(s:unknown,image=false)=>{try{return typeof s==='string'&&(image?['http:','https:']:['http:','https:','mailto:']).includes(new URL(s).protocol)?s:undefined}catch{return undefined}};
export function ArticleContent({body,format}:{body:string;format?:string}) {
  function render(n:ArticleNode,key:number,depth=0):ReactNode {
    if(depth>20)return null;
    const children=n.content?.map((c,i)=>render(c,i,depth+1));
    const align=n.attrs?.textAlign;
    const style:CSSProperties|undefined=['left','center','right','justify'].includes(align)?{textAlign:align}:undefined;
    if(n.type==='text'){
      let text:ReactNode=n.text;
      for(const mark of n.marks||[]){
        if(mark.type==='bold')text=<strong>{text}</strong>;
        else if(mark.type==='italic')text=<em>{text}</em>;
        else if(mark.type==='underline')text=<u>{text}</u>;
        else if(mark.type==='strike')text=<s>{text}</s>;
        else if(mark.type==='code')text=<code>{text}</code>;
        else if(mark.type==='link'&&safeUrl(mark.attrs?.href))text=<a href={safeUrl(mark.attrs?.href)} target="_blank" rel="noopener noreferrer">{text}</a>;
      }
      return <Fragment key={key}>{text}</Fragment>;
    }
    switch(n.type){
      case 'paragraph':return <p style={style} key={key}>{children||<br/>}</p>;
      case 'heading':return n.attrs?.level===3?<h3 style={style} key={key}>{children}</h3>:<h2 style={style} key={key}>{children}</h2>;
      case 'bulletList':return <ul key={key}>{children}</ul>;
      case 'orderedList':return <ol key={key} start={n.attrs?.start||1}>{children}</ol>;
      case 'listItem':return <li key={key}>{children}</li>;
      case 'blockquote':return <blockquote key={key}>{children}</blockquote>;
      case 'horizontalRule':return <hr key={key}/>;
      case 'hardBreak':return <br key={key}/>;
      case 'codeBlock':return <pre key={key}><code>{children}</code></pre>;
      case 'image':return safeUrl(n.attrs?.src,true)?<figure className="article-inline-image" key={key}><img src={safeUrl(n.attrs?.src,true)} alt={n.attrs?.alt||''}/></figure>:null;
      case 'table':return <div className="article-table-scroll" key={key}><table><tbody>{children}</tbody></table></div>;
      case 'tableRow':return <tr key={key}>{children}</tr>;
      case 'tableHeader':return <th key={key} colSpan={n.attrs?.colspan||1} rowSpan={n.attrs?.rowspan||1}>{children}</th>;
      case 'tableCell':return <td key={key} colSpan={n.attrs?.colspan||1} rowSpan={n.attrs?.rowspan||1}>{children}</td>;
      default:return <Fragment key={key}>{children}</Fragment>;
    }
  }
  return <div className="article-prose">{render(articleDocument(body,format),0)}</div>;
}
