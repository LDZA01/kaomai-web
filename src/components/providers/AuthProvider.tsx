'use client';
import { createContext, useContext } from 'react';
import useAuth, { type OrgInfo } from '@/hooks/useAuth';
import type { UserProfile } from '@/types';

type AuthValue = { user: UserProfile|null; org: OrgInfo; loading:boolean; login:(email:string,password:string)=>Promise<{user:unknown;error:null|{message:string}}> ; signUp:(email:string,password:string,role:UserProfile['role'],displayName:string,orgInfo?:{shelterName?:string;shelterAddress?:string;businessName?:string;industry?:string})=>Promise<{user:unknown;error:null|{message:string}}> ; signOut:()=>Promise<void>; updateProfile:(values:{displayName:string;email:string;organization:string;phone:string;address?:string;latitude?:number;longitude?:number})=>Promise<{error:null|{message:string}}> };
const AuthContext=createContext<AuthValue|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}){const value=useAuth();return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
export function useAuthContext(){const value=useContext(AuthContext);if(!value)throw new Error('useAuthContext must be used in AuthProvider');return value}
