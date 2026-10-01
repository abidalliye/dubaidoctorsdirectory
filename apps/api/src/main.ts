import { createApplication } from "./app";
async function bootstrap() {
  const app = await createApplication();
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 4000), "0.0.0.0");
}
bootstrap();
