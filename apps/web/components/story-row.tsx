'use client';
import { Story } from '@/lib/types';
export function StoryRow({ stories }: { stories: Story[] }) { if (!stories.length) return <p className="muted">Chưa có story đang hoạt động.</p>; return <div className="story-row">{stories.map((story) => <div key={story.id} style={{ textAlign: 'center', maxWidth: 92 }}><div className="story-avatar"><div className="story-avatar-inner">{(story.user?.displayName || 'U').slice(0,1).toUpperCase()}</div></div><div style={{ marginTop: 8, fontSize: 14 }}>{story.user?.displayName || 'Story'}</div></div>)}</div>; }
