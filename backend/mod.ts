import { Application, Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';

const router = new Router();
router.get('/', (ctx) => {
  ctx.response.body = 'Hello world!';
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener('listen', (_e) =>
  console.log('Listening on http://localhost:1039')
);

await app.listen({ hostname: '0.0.0.0', port: 1039 });
