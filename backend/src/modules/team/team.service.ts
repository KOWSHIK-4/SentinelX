import { prisma } from '../../config/database';
import { hashPassword } from '../../utils/password';
import { AppError } from '../../middleware/errorHandler';

export class TeamService {
  async list() {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      roles: user.roles.map((ur) => ({ id: ur.role.id, name: ur.role.name })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async create(data: { email: string; password: string; firstName: string; lastName: string; roleName: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const validRoles = ['Admin', 'Analyst', 'Viewer'];
    if (!validRoles.includes(data.roleName)) {
      throw new AppError('Role must be one of: Admin, Analyst, Viewer.', 400);
    }

    const role = await prisma.role.findUnique({ where: { name: data.roleName } });
    if (!role) {
      throw new AppError(`Role '${data.roleName}' not found.`, 400);
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    await prisma.userRole.create({
      data: { userId: user.id, roleId: role.id },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      roles: [{ id: role.id, name: role.name }],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async update(id: string, data: { email?: string; firstName?: string; lastName?: string; roleName?: string; isActive?: boolean }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        throw new AppError('A user with this email already exists.', 409);
      }
    }

    const validRoles = ['Admin', 'Analyst', 'Viewer'];
    if (data.roleName && !validRoles.includes(data.roleName)) {
      throw new AppError('Role must be one of: Admin, Analyst, Viewer.', 400);
    }

    const updateData: Record<string, unknown> = {};
    if (data.email) updateData.email = data.email;
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    if (data.roleName) {
      const role = await prisma.role.findUnique({ where: { name: data.roleName } });
      if (!role) {
        throw new AppError(`Role '${data.roleName}' not found.`, 400);
      }

      await prisma.userRole.deleteMany({ where: { userId: id } });
      await prisma.userRole.create({
        data: { userId: id, roleId: role.id },
      });
    }

    const result = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return {
      id: result!.id,
      email: result!.email,
      firstName: result!.firstName,
      lastName: result!.lastName,
      isActive: result!.isActive,
      lastLogin: result!.lastLogin,
      roles: result!.roles.map((ur) => ({ id: ur.role.id, name: ur.role.name })),
      createdAt: result!.createdAt,
      updatedAt: result!.updatedAt,
    };
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    await prisma.user.delete({ where: { id } });

    return { id };
  }
}