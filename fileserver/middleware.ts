import {
  isHttpError,
  type Middleware,
  Status,
} from "https://deno.land/x/oak@v10.6.0/mod.ts";

export const errorHandler: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (isHttpError(err)) {
      ctx.response.status = err.status;
      ctx.response.body = { "error": `${err.status} ${err.message}` };
    } else {
      throw err;
    }
  }

  if (ctx.response.status === Status.NotFound) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = { "error": `404 Not Found` };
  }
};

export const timingMiddleware: Middleware = async (ctx, next) => {
  const start = performance.now();
  await next();
  const ms = performance.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms.toFixed(2)}ms`);
};
