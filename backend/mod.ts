import { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import { addFileData, ensureFileData, readFileData } from "./data.ts";
import { z } from "https://deno.land/x/zod@v3.17.3/mod.ts";

import { errorHandler, timingMiddleware } from "./middleware.ts";

const router = new Router();

const requestData = z.object({
  content: z.string(),
  policy: z.union([z.literal("RAID0"), z.literal("RAID1")]),
});

const upload = async (id: string, content: string, server: string) => {
  await fetch(server + "/upload", {
    method: "POST",
    body: JSON.stringify({ objectId: id, content }),
    headers: {
      "content-type": "application/json",
      "authorization": Deno.env.get("OBJECTSERVER_KEY") ?? "",
    },
  }).then(async (r) => {
    if (!r.ok) throw new Error(await r.json());
  });
};

router.post("/new", async (ctx) => {
  // Parse incoming data
  const body = await ctx.request.body({ type: "json" }).value;
  const parsedBody = requestData.safeParse(body);
  if (!parsedBody.success) {
    ctx.response.status = 400;
    ctx.response.body = { "error": "Bad Request" };
    return;
  }

  // Upload to file servers
  const objectId = crypto.randomUUID();
  if (parsedBody.data.policy === "RAID0") {
    await upload(
      objectId,
      parsedBody.data.content,
      "http://objectserver1:1040",
    );
  } else {
    await upload(
      objectId,
      parsedBody.data.content,
      "http://objectserver1:1040",
    );
    await upload(
      objectId,
      parsedBody.data.content,
      "http://objectserver2:1040",
    );
    await upload(
      objectId,
      parsedBody.data.content,
      "http://objectserver3:1040",
    );
    await upload(
      objectId,
      parsedBody.data.content,
      "http://objectserver4:1040",
    );
    await upload(
      objectId,
      parsedBody.data.content,
      "http://objectserver5:1040",
    );
    await upload(
      objectId,
      parsedBody.data.content,
      "http://objectserver6:1040",
    );
  }

  await addFileData(objectId, parsedBody.data.policy);

  ctx.response.status = 200;
  ctx.response.body = { "id": objectId };
});

router.get("/download/:id", async (ctx) => {
  const { id } = ctx.params;
  const pol = await readFileData(id);

  if (!pol) {
    ctx.response.body = { error: "Not found" };
    ctx.response.status = 404;
    return;
  }

  const fileUrl = `http://127.0.0.1:1040/${id}`;

  const bodyStream = await fetch(fileUrl).then((r) => {
    if (!r.ok) throw new Error("File download failed");
    return r;
  }).then((r) => {
    const b = r.body;
    if (!b) throw new Error("File download failed");
    return b;
  });

  ctx.response.body = bodyStream;
});

router.put("/update/:objectId", (ctx) => {
  const { objectId } = ctx.params;

  // Update the file

  ctx.response.body = { ok: true };
});

router.put("/layout", (ctx) => {
  const objectId = ctx.request.url.searchParams.get("id");

  // Get the layout of the files

  ctx.response.body = { layout: ["1.2.3.4", "5.6.7.8"] };
});

const app = new Application();

app.use(errorHandler);
app.use(timingMiddleware);

app.use(router.routes());
app.use(router.allowedMethods({ throw: true }));

app.addEventListener(
  "listen",
  (_e) => console.log("Listening on http://http://127.0.0.1:1039"),
);

await app.listen({ hostname: "0.0.0.0", port: 1039 });
