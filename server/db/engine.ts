import { PrismaClient, Role, Plan, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class DatabaseEngine {
  // Use a single transaction for complex operations
  public async createProjectWithInitialChat(userId: string, projectName: string) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: projectName,
          userId,
        }
      });

      const conversation = await tx.conversation.create({
        data: {
          title: "New Chat",
          projectId: project.id,
          userId,
        }
      });

      return { project, conversation };
    });
  }

  // Optimized query to prevent N+1
  public async getFullProjectDetails(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        conversations: {
          include: {
            messages: {
              take: 50,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        files: true,
        folders: true
      }
    });
  }

  // Soft Delete implementation
  public async softDeleteProject(projectId: string) {
    return prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() }
    });
  }

  // Auto-timestamp management is handled by Prisma @updatedAt
  public async updateConversationTitle(id: string, title: string) {
    return prisma.conversation.update({
      where: { id },
      data: { title }
    });
  }
}

export const db = new DatabaseEngine();
