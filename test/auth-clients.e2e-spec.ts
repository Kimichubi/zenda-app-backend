import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Auth + Clients (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should signup, login and create a client", async () => {
    const signup = await request(app.getHttpServer())
      .post("/auth/signup")
      .send({
        name: "Teste",
        email: "teste@agendapix.com",
        password: "123456",
      })
      .expect(201);

    expect(signup.body.accessToken).toBeDefined();

    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "teste@agendapix.com",
        password: "123456",
      })
      .expect(201);

    const token = login.body.accessToken;

    const client = await request(app.getHttpServer())
      .post("/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente 1",
        phone: "11911111111",
        email: "cliente1@test.com",
      })
      .expect(201);

    expect(client.body.name).toBe("Cliente 1");
  });
});
