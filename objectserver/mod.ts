import { Application } from "https://deno.land/x/oak@v10.6.0/mod.ts";
// import { z } from "https://deno.land/x/zod@v3.17.3/mod.ts";

import { errorHandler, timingMiddleware } from "./middleware.ts";

const app = new Application();

app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: `/data`,
    });
  } catch {
    await next();
  }
});

app.use(errorHandler);
app.use(timingMiddleware);

app.addEventListener(
  "listen",
  (_e) => console.log("Listening on http://localhost:1039"),
);

await app.listen({ hostname: "0.0.0.0", port: 1040 });
