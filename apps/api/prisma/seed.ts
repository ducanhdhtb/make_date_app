import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.share.deleteMany();
  await prisma.story.deleteMany();
  await prisma.match.deleteMany();
  await prisma.like.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.userPhoto.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'linh@example.com',
        passwordHash,
        displayName: 'Linh',
        birthDate: new Date('2000-06-15'),
        gender: 'female',
        interestedIn: 'male',
        bio: 'Thích cafe và du lịch',
        jobTitle: 'Designer',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
        city: 'Ho Chi Minh City',
        latitude: '10.776900',
        longitude: '106.700900',
        interests: { create: [{ interestName: 'coffee' }, { interestName: 'travel' }, { interestName: 'books' }] },
        photos: { create: [{ photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', sortOrder: 1 }] },
        lastActiveAt: new Date()
      }
    }),
    prisma.user.create({
      data: {
        email: 'thu@example.com',
        passwordHash,
        displayName: 'Thu',
        birthDate: new Date('1999-04-12'),
        gender: 'female',
        interestedIn: 'male',
        bio: 'Thích biển và chạy bộ',
        jobTitle: 'Product Designer',
        avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
        city: 'Ho Chi Minh City',
        latitude: '10.780100',
        longitude: '106.699800',
        interests: { create: [{ interestName: 'travel' }, { interestName: 'running' }, { interestName: 'books' }] },
        photos: { create: [{ photoUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80', sortOrder: 1 }] },
        lastActiveAt: new Date()
      }
    }),
    prisma.user.create({
      data: {
        email: 'nam@example.com',
        passwordHash,
        displayName: 'Nam',
        birthDate: new Date('1998-03-03'),
        gender: 'male',
        interestedIn: 'female',
        bio: 'Thích gym và chụp ảnh đường phố',
        jobTitle: 'Frontend Engineer',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
        city: 'Ho Chi Minh City',
        latitude: '10.778500',
        longitude: '106.695100',
        interests: { create: [{ interestName: 'gym' }, { interestName: 'photography' }, { interestName: 'coffee' }] },
        photos: { create: [{ photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', sortOrder: 1 }] },
        lastActiveAt: new Date()
      }
    })
  ]);

  await prisma.story.create({
    data: {
      userId: users[1].id,
      mediaType: 'text',
      textContent: 'Cuối tuần đi biển nhé?',
      caption: 'Ai thích ngắm hoàng hôn không?',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
