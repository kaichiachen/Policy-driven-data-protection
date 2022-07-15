FROM denoland/deno:alpine

WORKDIR /app

COPY . .

RUN deno cache mod.ts

EXPOSE 1039

CMD ["run", "--allow-all", "mod.ts"]
