import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';
import { UpdateGroupConversationDto } from './dto/update-group-conversation.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ListGroupsQueryDto } from './dto/list-groups.query.dto';
import { ListMembersQueryDto } from './dto/list-members.query.dto';

@Injectable()
export class GroupConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(
    currentUserId: string,
    dto: CreateGroupConversationDto,
  ) {
    // Validate members
    if (!dto.memberIds || dto.memberIds.length < 1) {
      throw new BadRequestException('Group must have at least 1 other member');
    }

    // Check if all members exist
    const members = await this.prisma.user.findMany({
      where: { id: { in: dto.memberIds } },
    });

    if (members.length !== dto.memberIds.length) {
      throw new BadRequestException('Some members do not exist');
    }

    // Create group
    const group = await this.prisma.groupConversation.create({
      data: {
        name: dto.name,
        description: dto.description,
        avatarUrl: dto.avatarUrl,
        createdByUserId: currentUserId,
        members: {
          create: [
            // Add creator as owner
            {
              userId: currentUserId,
              role: 'owner',
            },
            // Add other members
            ...dto.memberIds.map((userId) => ({
              userId,
              role: 'member' as const,
            })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Emit group created event to all members
    this.realtimeGateway.emitGroupUpdated(group.id, {
      groupConversationId: group.id,
      group,
      action: 'created',
    });

    return group;
  }

  async findById(currentUserId: string, groupId: string) {
    const group = await this.prisma.groupConversation.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is member
    const isMember = group.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return group;
  }

  async findAll(currentUserId: string, query: ListGroupsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      members: {
        some: {
          userId: currentUserId,
        },
      },
    };

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [groups, total] = await Promise.all([
      this.prisma.groupConversation.findMany({
        where,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              textContent: true,
              createdAt: true,
              sender: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: query.sortBy === 'name' ? { name: 'asc' } : { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.groupConversation.count({ where }),
    ]);

    return {
      data: groups,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async update(
    currentUserId: string,
    groupId: string,
    dto: UpdateGroupConversationDto,
  ) {
    const group = await this.findById(currentUserId, groupId);

    // Check if user is owner or admin
    const member = group.members.find((m) => m.userId === currentUserId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new ForbiddenException('Only owner or admin can update group');
    }

    const updatedGroup = await this.prisma.groupConversation.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        description: dto.description,
        avatarUrl: dto.avatarUrl,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Emit group updated event
    this.realtimeGateway.emitGroupUpdated(groupId, {
      groupConversationId: groupId,
      group: updatedGroup,
      action: 'updated',
    });

    return updatedGroup;
  }

  async delete(currentUserId: string, groupId: string) {
    const group = await this.findById(currentUserId, groupId);

    // Check if user is owner
    const member = group.members.find((m) => m.userId === currentUserId);
    if (!member || member.role !== 'owner') {
      throw new ForbiddenException('Only owner can delete group');
    }

    await this.prisma.groupConversation.delete({
      where: { id: groupId },
    });
  }

  async addMember(
    currentUserId: string,
    groupId: string,
    dto: AddMemberDto,
  ) {
    const group = await this.findById(currentUserId, groupId);

    // Check if user is owner or admin
    const member = group.members.find((m) => m.userId === currentUserId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new ForbiddenException('Only owner or admin can add members');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already member
    const existingMember = group.members.find((m) => m.userId === dto.userId);
    if (existingMember) {
      throw new BadRequestException('User is already a member');
    }

    const newMember = await this.prisma.groupConversationMember.create({
      data: {
        groupConversationId: groupId,
        userId: dto.userId,
        role: 'member',
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    // Emit member added event
    this.realtimeGateway.emitGroupMemberAdded(groupId, {
      groupConversationId: groupId,
      member: newMember,
      user: newMember.user,
    });

    return newMember;
  }

  async removeMember(
    currentUserId: string,
    groupId: string,
    userId: string,
  ) {
    const group = await this.findById(currentUserId, groupId);

    // Check if user is owner or admin
    const member = group.members.find((m) => m.userId === currentUserId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new ForbiddenException('Only owner or admin can remove members');
    }

    // Cannot remove owner
    const memberToRemove = group.members.find((m) => m.userId === userId);
    if (!memberToRemove) {
      throw new NotFoundException('Member not found');
    }
    if (memberToRemove.role === 'owner') {
      throw new BadRequestException('Cannot remove owner from group');
    }

    await this.prisma.groupConversationMember.delete({
      where: {
        groupConversationId_userId: {
          groupConversationId: groupId,
          userId,
        },
      },
    });

    // Emit member removed event
    this.realtimeGateway.emitGroupMemberRemoved(groupId, {
      groupConversationId: groupId,
      userId,
    });

    // If group has no members, delete it
    const remainingMembers = await this.prisma.groupConversationMember.count({
      where: { groupConversationId: groupId },
    });

    if (remainingMembers === 0) {
      await this.prisma.groupConversation.delete({
        where: { id: groupId },
      });
    }
  }

  async getMembers(
    currentUserId: string,
    groupId: string,
    query: ListMembersQueryDto,
  ) {
    const group = await this.findById(currentUserId, groupId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      groupConversationId: groupId,
    };

    if (query.search) {
      where.user = {
        displayName: {
          contains: query.search,
          mode: 'insensitive',
        },
      };
    }

    const [members, total] = await Promise.all([
      this.prisma.groupConversationMember.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              email: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.groupConversationMember.count({ where }),
    ]);

    return {
      data: members,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async leaveGroup(currentUserId: string, groupId: string) {
    const group = await this.findById(currentUserId, groupId);

    // Check if user is owner
    const member = group.members.find((m) => m.userId === currentUserId);
    if (!member) {
      throw new NotFoundException('You are not a member of this group');
    }
    if (member.role === 'owner') {
      throw new BadRequestException('Owner cannot leave group. Transfer ownership first.');
    }

    await this.prisma.groupConversationMember.delete({
      where: {
        groupConversationId_userId: {
          groupConversationId: groupId,
          userId: currentUserId,
        },
      },
    });

    // Emit member removed event
    this.realtimeGateway.emitGroupMemberRemoved(groupId, {
      groupConversationId: groupId,
      userId: currentUserId,
    });

    // If group has no members, delete it
    const remainingMembers = await this.prisma.groupConversationMember.count({
      where: { groupConversationId: groupId },
    });

    if (remainingMembers === 0) {
      await this.prisma.groupConversation.delete({
        where: { id: groupId },
      });
    }
  }
}
