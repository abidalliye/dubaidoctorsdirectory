const serverless = require("serverless-http");
const { createApplication } = require("../../apps/api/dist/app");
let handlerPromise;
async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = createApplication()
      .then(async (app) => {
        await app.init();
        return serverless(app.getHttpAdapter().getInstance());
      })
      .catch((error) => {
        handlerPromise = undefined;
        throw error;
      });
  }
  return handlerPromise;
}
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const handler = await getHandler();
    const path =
      event.path.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, "") || "/";
    return await handler({ ...event, path }, context);
  } catch {
    return {
      statusCode: 503,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
      body: JSON.stringify({ message: "Directory temporarily unavailable" }),
    };
  }
};
