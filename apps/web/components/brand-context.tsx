'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {api} from '../lib/client-api';
import {brand} from '../lib/brand';
const Context=createContext(brand);
export function BrandProvider({initialBrand,children}:{initialBrand:string;children:React.ReactNode}){const [name,setName]=useState(initialBrand);useEffect(()=>{api('care/public/config').then(c=>setName(c.siteName||initialBrand)).catch(()=>{});},[initialBrand]);return <Context.Provider value={name}>{children}</Context.Provider>;}
export function useBrand(){return useContext(Context);}
