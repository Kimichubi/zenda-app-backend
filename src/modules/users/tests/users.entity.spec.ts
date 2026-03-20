import { UserRole, UserPlan } from "../users.entity";

describe("UsersEntity", () => {
  it("should import UserRole and UserPlan correctly", () => {
    expect(UserRole).toBeDefined();
    expect(UserPlan).toBeDefined();
  });
});
