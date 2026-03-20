import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "../users.controller";
import { UsersService } from "../users.service";
import { UpdateProfileDto } from "../dto/update-profile.dto";

describe("UsersController", () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockUsersService = {
      me: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("me", () => {
    it("should call usersService.me", async () => {
      const user = { id: "user-id" };
      const expectedResult = { id: "user-id", name: "Test" };
      service.me.mockResolvedValue(expectedResult as any);

      const result = await controller.me(user);

      expect(service.me).toHaveBeenCalledWith("user-id");
      expect(result).toEqual(expectedResult);
    });
  });

  describe("updateProfile", () => {
    it("should call usersService.updateProfile", async () => {
      const user = { id: "user-id" };
      const dto: UpdateProfileDto = { name: "New Name" };
      const expectedResult = { id: "user-id", name: "New Name" };
      service.updateProfile.mockResolvedValue(expectedResult as any);

      const result = await controller.updateProfile(user, dto);

      expect(service.updateProfile).toHaveBeenCalledWith("user-id", dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
