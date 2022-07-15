FROM denoland/deno:alpine

WORKDIR /app

COPY . .

RUN deno cache mod.ts

EXPOSE 1040

CMD ["run", "--allow-all", "mod.ts"]
