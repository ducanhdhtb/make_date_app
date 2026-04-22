'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BottomNav } from '@/components/layout';
import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { MatchItem } from '@/lib/types';
const FALLBACK='https://placehold.co/240x240/png';
export default function MatchesPage(){ const [matches,setMatches]=useState<MatchItem[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); useEffect(()=>{ if(!getAccessToken()){ window.location.href='/auth/login'; return; } apiFetch<MatchItem[]>('/matches').then(setMatches).catch((err)=>setError(err instanceof Error ? err.message : 'Không tải được matches')).finally(()=>setLoading(false)); },[]);
const openChat=async(targetUserId:string)=>{ try { const conversation = await apiFetch<{ id: string }>('/conversations',{method:'POST',body:JSON.stringify({targetUserId})}); window.location.href=`/chats?conversationId=${conversation.id}`; } catch(err){ alert(err instanceof Error ? err.message : 'Không thể mở chat'); } };
return <div><div className="card"><h1 style={{ marginTop: 0 }}>Matches của bạn</h1>{error ? <p style={{ color: '#be123c' }}>{error}</p> : null}{loading ? <p>Đang tải matches...</p> : null}<div style={{ display: 'grid', gap: 14 }}>{matches.map((match)=><div key={match.id} className="card" style={{ padding: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><Image src={match.user.avatarUrl || FALLBACK} alt={match.user.displayName} width={64} height={64} style={{ borderRadius: 999 }} unoptimized /><div><h3 style={{ margin: 0 }}>{match.user.displayName}</h3><div className="muted">Match lúc {new Date(match.matchedAt).toLocaleString('vi-VN')}</div></div></div><button className="btn btn-primary" type="button" onClick={()=>openChat(match.user.id)}>Nhắn tin</button></div></div>)}</div>{!loading && matches.length===0 ? <p className="muted">Chưa có match nào. Hãy vào trang khám phá để thả tim.</p> : null}</div><BottomNav /></div>; }
