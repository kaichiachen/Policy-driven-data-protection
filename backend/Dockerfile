FROM denoland/deno:alpine

EXPOSE 1039

WORKDIR /app

COPY . .

RUN deno cache mod.ts

CMD ["run", "--allow-net", "mod.ts"]
