import { DashboardRepository } from "../dashboard.repository";

describe("DashboardRepository", () => {
  it("should be defined", () => {
    class MockRepo extends DashboardRepository {
      summary = jest.fn();
    }
    const repo = new MockRepo();
    expect(repo).toBeDefined();
  });
});
