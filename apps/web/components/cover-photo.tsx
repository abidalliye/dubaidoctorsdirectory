"use client";
import {useState} from 'react';
import {coverPosition} from '../lib/blog';
export function CoverPhoto({src,alt='',position='center'}:{src:string;alt?:string;position?:string}){
  const [failed,setFailed]=useState(false);
  return <figure className="post-cover-frame">{failed?<div className="cover-photo-error">This image could not load. Try uploading a photo or use a direct image URL.</div>:<img className="post-cover-photo" src={src} alt={alt} style={{objectPosition:coverPosition(position)}} onError={()=>setFailed(true)}/>}</figure>;
}
