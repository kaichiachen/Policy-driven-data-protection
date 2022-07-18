import { Application } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import { join } from "https://deno.land/std@0.148.0/path/mod.ts";
import { decode } from "https://deno.land/std@0.148.0/encoding/base64.ts";
import { z } from "https://deno.land/x/zod@v3.17.3/mod.ts";

import { errorHandler, timingMiddleware } from "./middleware.ts";

const app = new Application();

const zz = z.object({
  objectId: z.string(),
  content: z.string(),
});

app.use(async (ctx, next) => {
  if (ctx.request.url.pathname !== "/upload") {
    await next();
    return;
  }
  if (ctx.request.method !== "POST") {
    await next();
    return;
  }
  if (
    ctx.request.headers.get("Authorization") !==
      Deno.env.get("OBJECTSERVER_KEY")
  ) {
    ctx.response.body = { "error": "Unauthorized" };
    ctx.response.status = 403;
    return;
  }

  const b = await ctx.request.body({ type: "json" }).value;
  const p = zz.safeParse(b);

  if (!p.success) {
    ctx.response.body = { error: "Bad request" };
    ctx.response.status = 400;
    return;
  }

  const d = p.data;

  await Deno.writeFile(join("/data", d.objectId), decode(d.content));
});

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
  (e) => console.log(`Listening on http://${e.hostname}:${e.port}`),
);

await app.listen({ hostname: "0.0.0.0", port: 1040 });
