import { Injectable } from '@nestjs/common';

@Injectable()
export class DbService {
  private users = [
    {
      id: 'u1',
      email: 'linh@example.com',
      passwordHash: '$2b$10$mockhash',
      displayName: 'Linh',
      birthDate: '2000-06-15',
      gender: 'female',
      interestedIn: 'male',
      bio: 'Thích cafe và du lịch',
      jobTitle: 'Designer',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
      city: 'Ho Chi Minh City',
      latitude: 10.7769,
      longitude: 106.7009,
      interests: ['coffee', 'travel', 'books'],
      lastActiveAt: new Date().toISOString()
    },
    {
      id: 'u2',
      email: 'thu@example.com',
      passwordHash: '$2b$10$mockhash',
      displayName: 'Thu',
      birthDate: '1999-04-12',
      gender: 'female',
      interestedIn: 'male',
      bio: 'Thích biển và chạy bộ',
      jobTitle: 'Product Designer',
      avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
      city: 'Ho Chi Minh City',
      latitude: 10.7801,
      longitude: 106.6998,
      interests: ['travel', 'running', 'books'],
      lastActiveAt: new Date().toISOString()
    }
  ];

  private likes: Array<{ id: string; fromUserId: string; toUserId: string; createdAt: string }> = [];
  private matches: Array<{ id: string; user1Id: string; user2Id: string; status: string; matchedAt: string }> = [];
  private stories: Array<any> = [];
  private shares: Array<any> = [];

  getUsers() { return this.users; }
  setUsers(users: any[]) { this.users = users; }
  getLikes() { return this.likes; }
  getMatches() { return this.matches; }
  getStories() { return this.stories; }
  getShares() { return this.shares; }
}
