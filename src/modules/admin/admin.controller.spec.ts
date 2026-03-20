import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { UsersRepository } from '../users/users.repository';
import { UserRole, UserPlan } from '../users/users.entity';

describe('AdminController', () => {
  let controller: AdminController;
  let usersRepository: UsersRepository;

  beforeEach(async () => {
    const mockUsersRepository = {
      findAll: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    usersRepository = module.get<UsersRepository>(UsersRepository);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listUsers', () => {
    it('should return mapped users', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Test',
          email: 'test@test.com',
          businessName: 'Business',
          role: 'ADMIN' as UserRole,
          plan: 'PRO' as UserPlan,
          createdAt: new Date(),
          password: 'hash',
        },
      ];
      jest.spyOn(usersRepository, 'findAll').mockResolvedValue(mockUsers as any);

      const result = await controller.listUsers();

      expect(result).toEqual([{
        id: mockUsers[0].id,
        name: mockUsers[0].name,
        email: mockUsers[0].email,
        businessName: mockUsers[0].businessName,
        role: mockUsers[0].role,
        plan: mockUsers[0].plan,
        createdAt: mockUsers[0].createdAt
      }]);
    });
  });

  describe('updatePlan', () => {
    it('should call usersRepository.update with correct plan', async () => {
      const id = 'user-1';
      const plan: UserPlan = 'ENTERPRISE';
      const expected = { id, plan };
      jest.spyOn(usersRepository, 'update').mockResolvedValue(expected as any);

      const result = await controller.updatePlan(id, plan);

      expect(usersRepository.update).toHaveBeenCalledWith(id, { plan });
      expect(result).toBe(expected);
    });
  });

  describe('getStats', () => {
    it('should return correct user stats', async () => {
      const mockUsers = [
        { id: '1', plan: 'PRO' },
        { id: '2', plan: 'PRO' },
        { id: '3', plan: 'ENTERPRISE' },
        { id: '4', plan: 'FREE' },
      ];
      jest.spyOn(usersRepository, 'findAll').mockResolvedValue(mockUsers as any);

      const result = await controller.getStats();

      expect(result).toEqual({
        totalUsers: 4,
        proUsers: 2,
        enterpriseUsers: 1,
        freeUsers: 1,
      });
    });
  });
});