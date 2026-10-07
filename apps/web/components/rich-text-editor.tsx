"use client";
import {useState,ReactNode} from 'react';
import {EditorContent,useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {TableKit} from '@tiptap/extension-table';
import {articleDocument} from '../lib/article-document';

const paths:Record<string,string>={undo:'M3 8h10a6 6 0 0 1 0 12 M3 8l5-5 M3 8l5 5',redo:'M21 8H11a6 6 0 0 0 0 12 M21 8l-5-5 M21 8l-5 5',link:'m9 15 6-6 M7 17l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0 M17 7l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',image:'M3 4h18v16H3Z M8 9h.01 M3 17l6-6 4 4 3-3 5 5',table:'M3 4h18v16H3Z M3 10h18 M9 4v16 M15 4v16',left:'M3 5h18 M3 10h12 M3 15h18 M3 20h12',center:'M3 5h18 M6 10h12 M3 15h18 M6 20h12',right:'M3 5h18 M9 10h12 M3 15h18 M9 20h12',quote:'M4 5h6v8H4V5 m0 8c0 5 6 6 6 6 M14 5h6v8h-6V5 m0 8c0 5 6 6 6 6',bullet:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',numbered:'M9 6h12 M9 12h12 M9 18h12 M3 3v5 M2 3h1 M2 8h3 M2 11h3l-3 5h3 M2 19h3v3H2',clear:'m4 4 16 16 M7 5h12 M13 5l-2 14 M7 19h5'};
function ToolIcon({name}:{name:string}){return <svg width="18" height="18" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>}
export function RichTextEditor({value,format,onChange}:{value:string;format?:string;onChange:(body:string)=>void}){
  const [dialog,setDialog]=useState<'link'|'image'|null>(null),[url,setUrl]=useState(''),[description,setDescription]=useState(''),[error,setError]=useState('');
  const editor=useEditor({
    extensions:[StarterKit.configure({heading:{levels:[2,3]},link:{openOnClick:false,protocols:['https','http','mailto']}}),Image.configure({allowBase64:false}),TextAlign.configure({types:['heading','paragraph']}),Placeholder.configure({placeholder:'Write your article…'}),TableKit.configure({table:{resizable:false}})],
    content:articleDocument(value,format),immediatelyRender:false,shouldRerenderOnTransaction:true,
    editorProps:{attributes:{class:'rich-editor-document article-prose',role:'textbox','aria-label':'Article content','aria-multiline':'true'}},
    onUpdate:({editor})=>onChange(JSON.stringify(editor.getJSON())),
  });
  if(!editor)return <div className="rich-editor-loading">Loading editor…</div>;
  const button=(name:string,action:()=>void,content:ReactNode,active=false,unavailable=false)=><button type="button" key={name} title={name} aria-label={name} aria-pressed={active} className={active?'active':''} disabled={unavailable} onMouseDown={e=>e.preventDefault()} onClick={action}>{content}</button>;
  function open(kind:'link'|'image'){setDialog(kind);setUrl(kind==='link'?editor!.getAttributes('link').href||'':'');setDescription('');setError('')}
  function apply(){
    let valid=false;try{valid=(dialog==='image'?['http:','https:']:['http:','https:','mailto:']).includes(new URL(url).protocol)}catch{}
    if(!valid){setError(dialog==='image'?'Enter a direct HTTP(S) image URL.':'Enter an HTTP(S) or email link.');return}
    if(dialog==='link')editor!.chain().focus().extendMarkRange('link').setLink({href:url}).run();
    else editor!.chain().focus().setImage({src:url,alt:description}).run();
    setDialog(null);
  }
  return <div className="rich-editor"><div className="rich-editor-toolbar" role="toolbar" aria-label="Article formatting">
    <div className="rich-tool-group">{button('Undo',()=>editor.chain().focus().undo().run(),<ToolIcon name="undo"/>,false,!editor.can().undo())}{button('Redo',()=>editor.chain().focus().redo().run(),<ToolIcon name="redo"/>,false,!editor.can().redo())}</div>
    <select aria-label="Text style" value={editor.isActive('heading',{level:2})?'h2':editor.isActive('heading',{level:3})?'h3':'paragraph'} onChange={e=>e.target.value==='paragraph'?editor.chain().focus().setParagraph().run():editor.chain().focus().setHeading({level:e.target.value==='h2'?2:3}).run()}><option value="paragraph">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select>
    <div className="rich-tool-group">{button('Bold',()=>editor.chain().focus().toggleBold().run(),<b>B</b>,editor.isActive('bold'))}{button('Italic',()=>editor.chain().focus().toggleItalic().run(),<i>I</i>,editor.isActive('italic'))}{button('Underline',()=>editor.chain().focus().toggleUnderline().run(),<u>U</u>,editor.isActive('underline'))}{button('Strikethrough',()=>editor.chain().focus().toggleStrike().run(),<s>S</s>,editor.isActive('strike'))}</div>
    <div className="rich-tool-group">{button('Bullet list',()=>editor.chain().focus().toggleBulletList().run(),<ToolIcon name="bullet"/>,editor.isActive('bulletList'))}{button('Numbered list',()=>editor.chain().focus().toggleOrderedList().run(),<ToolIcon name="numbered"/>,editor.isActive('orderedList'))}{button('Quote',()=>editor.chain().focus().toggleBlockquote().run(),<ToolIcon name="quote"/>,editor.isActive('blockquote'))}</div>
    <div className="rich-tool-group">{(['left','center','right'] as const).map(a=>button('Align '+a,()=>editor.chain().focus().setTextAlign(a).run(),<ToolIcon name={a}/>,editor.isActive({textAlign:a})))}</div>
    <div className="rich-tool-group">{button('Insert link',()=>open('link'),<ToolIcon name="link"/>,editor.isActive('link'))}{button('Insert image',()=>open('image'),<ToolIcon name="image"/>)}{button('Insert table',()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run(),<ToolIcon name="table"/>,editor.isActive('table'))}{button('Clear formatting',()=>editor.chain().focus().unsetAllMarks().clearNodes().run(),<ToolIcon name="clear"/>)}</div>
  </div>
  {dialog&&<div className="rich-insert-panel" role="group" aria-label={dialog==='link'?'Edit link':'Insert image'}><input autoFocus className="field" aria-label={dialog==='link'?'Link URL':'Inline image URL'} placeholder={dialog==='link'?'Link URL':'Image URL'} value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();apply()}if(e.key==='Escape')setDialog(null)}}/>{dialog==='image'&&<input className="field" placeholder="Image description" aria-label="Inline image description" value={description} onChange={e=>setDescription(e.target.value)}/>}<button className="button small" onClick={apply}>Apply</button>{dialog==='link'&&editor.isActive('link')&&<button className="button secondary small" onClick={()=>{editor.chain().focus().unsetLink().run();setDialog(null)}}>Remove link</button>}<button className="button secondary small" onClick={()=>setDialog(null)}>Cancel</button>{error&&<p className="error" role="alert">{error}</p>}</div>}
  {editor.isActive('table')&&<div className="rich-table-controls">{[['Add row',()=>editor.chain().focus().addRowAfter().run()],['Add column',()=>editor.chain().focus().addColumnAfter().run()],['Remove row',()=>editor.chain().focus().deleteRow().run()],['Remove column',()=>editor.chain().focus().deleteColumn().run()],['Remove table',()=>editor.chain().focus().deleteTable().run()]].map(([label,action])=><button key={String(label)} onClick={action as ()=>void}>{String(label)}</button>)}</div>}
  <EditorContent editor={editor}/><div className="rich-editor-status"><span>{editor.getText().trim().split(/\s+/).filter(Boolean).length} words</span><span>Ctrl+B bold · Ctrl+I italic · Ctrl+Z undo</span></div></div>;
}
