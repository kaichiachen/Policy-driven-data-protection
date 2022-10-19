import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { addFileData, readFileData, findFileData } from "./data.ts";
import { encode, decode } from "https://deno.land/std@0.149.0/encoding/base64.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { z } from "https://deno.land/x/zod@v3.17.3/mod.ts";

import { getRandomInt, B64XorCipher } from "./utils.ts";
import { errorHandler, timingMiddleware } from "./middleware.ts";
import * as config from "./_config.ts";
import { sleep } from "https://deno.land/x/sleep/mod.ts"
import { cron } from "https://deno.land/x/deno_cron/cron.ts"


const router = new Router();

const requestData = z.object({
  content: z.string(),
  policy: z.union([z.literal("RAID0"), z.literal("RAID1"), z.literal("RAID5"), z.literal("RAID6")]),
  filename: z.string(),
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

  var servers: number[] = [];

  if (parsedBody.data.policy === "RAID0") {
    const randomServer = getRandomInt(1, 6);

    await upload(
      objectId,
      parsedBody.data.content,
      `http://objectserver${randomServer}:1040`,
    );

    servers.push(randomServer);

    await addFileData({
      id: objectId,
      policy: parsedBody.data.policy,
      filename: parsedBody.data.filename,
      servers,
      version: "v0",
      orders: [randomServer],
    });
    console.log("Upload content RAID0:", parsedBody.data.filename);

  } else if (parsedBody.data.policy === "RAID1"){
    const uploadToRandomServer = async () => {
      var serverId = getRandomInt(1, 6);
      while (servers.indexOf(serverId) >=0){
        serverId = getRandomInt(1, 6);
      }

      await upload(
        objectId,
        parsedBody.data.content,
        `http://objectserver${serverId}:1040`,
      );

      servers.push(serverId);
    };

    for (let i = 1; i <= 3; i++) {
      await uploadToRandomServer();
    }

    console.log("Upload content RAID1:", parsedBody.data.filename);

    await addFileData({
      id: objectId,
      policy: parsedBody.data.policy,
      filename: parsedBody.data.filename,
      servers,
      version: "v0",
      orders: [servers[0], servers[1], servers[2]],
    });

  } else if (parsedBody.data.policy === "RAID5"){
    const b64 = parsedBody.data.content
    const xor = B64XorCipher

    console.log(b64.length)

    const piece = b64.length/2

    var A = b64.slice(0,piece)
    var B = b64.slice(piece, b64.length)
    var A_xor_B = xor.encode(A, B)

    const uploadToRandomServer = async (i : number) => {
      var serverId = getRandomInt(1, 6);
      while (servers.indexOf(serverId) >=0){
        serverId = getRandomInt(1, 6);
      }
      servers.push(serverId);

      if (i == 1 ){
        await upload(
          objectId,
          A,
          `http://objectserver${serverId}:1040`,
        );
      } else if (i == 2){
        await upload(
          objectId,
          B,
          `http://objectserver${serverId}:1040`,
        );
      } else {
        await upload(
          objectId,
          A_xor_B,
          `http://objectserver${serverId}:1040`,
        );
      }
    };

    for (let i = 1; i <= 3; i++) {
      uploadToRandomServer(i);
    }
    console.log("Upload content RAID5:", parsedBody.data.filename);

    await addFileData({
      id: objectId,
      policy: parsedBody.data.policy,
      filename: parsedBody.data.filename,
      servers,
      version: "v0",
      orders: [servers[0], servers[1], servers[2]],
    }) 
  } else {
    const b64 = parsedBody.data.content
    const xor = B64XorCipher

    console.log(b64.length)

    const piece = b64.length/4
    const step = 4
    
    var A1 = b64.slice(0,piece)
    var B1 = b64.slice(piece, 2*piece)
    var A2 = b64.slice(2*piece, 3*piece)
    var B2 = b64.slice(3*piece, b64.length)

    var P1 = xor.encode( A1, B1)
    var P2 = xor.encode( A2, B2)
    var Q1 = xor.encode( A1, B2)
    var Q2 = xor.encode( B1, P2)

    var A = A1.concat(A2)
    var B = B1.concat(B2)
    var P = P1.concat(P2)
    var Q = Q1.concat(Q2)

    const uploadToRandomServer = async (i : number) => {
      var serverId = getRandomInt(1, 6);
      while (servers.indexOf(serverId) >=0){
        serverId = getRandomInt(1, 6);
      }
      servers.push(serverId);
      if (i == 1 ){
        await upload(
          objectId,
          A,
          `http://objectserver${serverId}:1040`,
        );
      } else if (i == 2){
        await upload(
          objectId,
          B,
          `http://objectserver${serverId}:1040`,
        );
      } else if ( i== 3){
        await upload(
          objectId,
          P,
          `http://objectserver${serverId}:1040`,
        );
      } else {
        await upload(
          objectId,
          Q,
          `http://objectserver${serverId}:1040`,
        );
      }
    };

    for (let i = 1; i <= 4; i++) {
      uploadToRandomServer(i);
    }
    console.log("Upload content RAID6:", parsedBody.data.filename);

    await addFileData({
      id: objectId,
      policy: parsedBody.data.policy,
      filename: parsedBody.data.filename,
      servers,
      version: "v0",
      orders: [servers[0], servers[1], servers[2], servers[3]],
      lengthQ1: Q1.length,
    })
  }
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

  if (pol.policy == "RAID0" || pol.policy == "RAID1"){ 
    const firstServer = 
      pol.servers[Math.floor(Math.random() * pol.servers.length)];
    const fileUrl =  `http://objectserver${firstServer}:1040/${pol.id}`;

    console.log("Downloading the file for policy", pol.policy, fileUrl);

    const bodyStream = await fetch(fileUrl).then(async (r) => {
      if (!r.ok){
        console.log("not ok")
        return r;
      } else {
        return r;
      }
    }).then( (r) => {
      const b = r.body;
      if (!b) throw new Error("Fail to download the file");
      return b;
    });

    ctx.response.body = bodyStream;
    ctx.response.headers.set(
      "Content-Disposition",
      `attachment; filename="${pol.filename}"`,
    );
  } else if (pol.policy == "RAID5"){
    const index_A = pol.orders[0];
    const index_B = pol.orders[1];
    const fileUrl_A = `http://objectserver${index_A}:1040/${pol.id}`;
    const fileUrl_B = `http://objectserver${index_B}:1040/${pol.id}`;

    console.log("Downloading the file for policy RAID5", fileUrl_A, fileUrl_B);
    
    const r_A = fetch(fileUrl_A);
    const r_B = fetch(fileUrl_B);

    const A = await r_A.then( (r_A) => r_A.blob()).then( (blob) =>
      blob.arrayBuffer()
    );
    const B = await r_B.then( (r_B) => r_B.blob()).then( (blob) =>
      blob.arrayBuffer()
    );

    const recovered_content = encode(A).concat(encode(B));

    ctx.response.body = decode(recovered_content);
    ctx.response.headers.set(
      "Content-Disposition",
      `attachment; filename="${pol.filename}"`,
    );

  } else {
    const index_A = pol.orders[0];
    const index_B = pol.orders[1];
    const fileUrl_A = `http://objectserver${index_A}:1040/${pol.id}`;
    const fileUrl_B = `http://objectserver${index_B}:1040/${pol.id}`;

    console.log("Downloading the file for policy RAID6", fileUrl_A, fileUrl_B);

    const r_A = fetch(fileUrl_A);
    const r_B = fetch(fileUrl_B);

    const A = await r_A.then( (r_A) => r_A.blob()).then( (blob) =>
      blob.arrayBuffer()
    );
    const B = await r_B.then( (r_B) => r_B.blob()).then( (blob) =>
      blob.arrayBuffer()
    );

    const piece = encode(A).length/2;
    var A1 = encode(A).slice(0, piece);
    var A2 = encode(A).slice(piece, encode(A).length);
    var B1 = encode(B).slice(0, piece);
    var B2 = encode(B).slice(piece, encode(B).length);

    const recovered_content = A1.concat(B1).concat(A2).concat(B2);

    ctx.response.body = decode(recovered_content);
    ctx.response.headers.set(
      "Content-Disposition",
      `attachment; filename="${pol.filename}"`,
    );
  }
});

const updateData = z.object({
  content: z.string(),
  filename: z.string(),
});

router.put("/update/:objectId", async (ctx) => {
  const { objectId } = ctx.params;
  const parsedBody = updateData.safeParse(
    await ctx.request.body({ type: "json" }).value,
  );

  if (!parsedBody.success) {
    ctx.throw(400);
    return;
  }

  if (!objectId) {
    ctx.throw(400);
    return;
  }

  const pol = await readFileData(objectId);

  if (!pol) {
    ctx.throw(400);
    return;
  }

  pol.filename = parsedBody.data.filename;

  await addFileData(pol);

  for (const server of pol.servers) {
    await upload(
      pol.id,
      parsedBody.data.content,
      `http://objectserver${server}:1040`,
    );
  }

  ctx.response.body = { ok: true };
  ctx.response.status = 200;
});

router.get("/layout", async (ctx) => {
  const objectId = ctx.request.url.searchParams.get("objectId");

  if (!objectId) {
    ctx.response.body = { error: "Bad Request" };
    ctx.response.status = 400;
    return;
  }

  console.log({ objectId });

  const pol = await readFileData(objectId);

  if (!pol) {
    ctx.response.body = { error: "Not found" };
    ctx.response.status = 404;
    return;
  }

  // Get the layout of the files

  ctx.response.body = { layout: pol.servers.sort() };
});

const app = new Application();

var survived_server: number[] = [1, 2, 3, 4, 5, 6];

cron('*/20 * * * * *', async () => {
  var RAID6_mode: number[] = []
  var j = 0;
  for ( let i of survived_server ){
    var url = `http://objectserver${i}:1040/flag`;
    const xor = B64XorCipher;
    const res = await fetch(url).then(async (r) =>{
      return r.ok;
    })

    // console.log(res)
    if ( res == false){ 
      survived_server.splice(survived_server.indexOf(i), 1)
      console.log("Repairing server", i);
      const pol = await findFileData(i);
      if ( pol.length == 0){
        continue;
      }
      else {
        const num_recover = pol.length;
        console.log(num_recover)

        for ( j = 0; j< num_recover; j++){
          if (pol[j].policy == "RAID0"){
            console.log("File on", i, "unable to recover.")
          } else if (pol[j].policy == "RAID1"){
            var recover_server_id = getRandomInt(1, 6);
            while (pol[j].servers.indexOf(recover_server_id) >= 0 ){
              recover_server_id = getRandomInt(1, 6);
            }

            pol[j].servers.push(recover_server_id);
            var order_index = pol[j].orders.indexOf(i);
            pol[j].orders[order_index] = recover_server_id;

            var from_index = (order_index + 1) % 3;

            const r = fetch(`http://objectserver${pol[j].orders[from_index]}:1040/${pol[j].id}`)
            const b = await r.then( (r) => r.blob()).then((blob) =>
              blob.arrayBuffer()
            );
            await upload(
              pol[j].id,
              encode(b),
              `http://objectserver${recover_server_id}:1040`
            );
            await addFileData({
              id: pol[j].id,
              policy: pol[j].policy,
              filename: pol[j].filename,
              servers: pol[j].servers,
              version: "v0",
              orders: pol[j].orders,
            });
          } else if (pol[j].policy == "RAID5"){
            var recover_server_id = getRandomInt(1, 6);
            while (pol[j].servers.indexOf(recover_server_id) >= 0 ){
              recover_server_id = getRandomInt(1, 6);
            }  
            var order_index = pol[j].orders.indexOf(i);
            if (order_index == 0){
              const r_B = fetch(`http://objectserver${pol[j].orders[1]}:1040/${pol[j].id}`)
              const r_A_xor_B = fetch(`http://objectserver${pol[j].orders[2]}:1040/${pol[j].id}`)

              const B = await r_B.then( (r)=> r.blob()).then((blob) =>
                blob.arrayBuffer()
              );
              const A_xor_B = await r_A_xor_B.then( (r)=> r.blob()).then((blob) =>
                blob.arrayBuffer()
              );
              const A = xor.decode(encode(B), encode(A_xor_B))

              await upload(
                pol[j].id,
                A,
                `http://objectserver${recover_server_id}:1040`
              );
              pol[j].orders[0] = recover_server_id;
              pol[j].servers.push(recover_server_id);
              await addFileData({
                id: pol[j].id,
                policy: pol[j].policy,
                filename: pol[j].filename,
                servers: pol[j].servers,
                version: "v0",
                orders: pol[j].orders,
              });
            } else if ( order_index == 1){
              const r_A = fetch(`http://objectserver${pol[j].orders[0]}:1040/${pol[j].id}`)
              const r_A_xor_B = fetch(`http://objectserver${pol[j].orders[2]}:1040/${pol[j].id}`)

              const A = await r_A.then( (r)=> r.blob()).then((blob) =>
                blob.arrayBuffer()
              );
              const A_xor_B = await r_A_xor_B.then( (r)=> r.blob()).then((blob) =>
                blob.arrayBuffer()
              );
              const B = xor.decode(encode(A), encode(A_xor_B))

              await upload(
                pol[j].id,
                B,
                `http://objectserver${recover_server_id}:1040`
              );
              pol[j].orders[1] = recover_server_id;
              pol[j].servers.push(recover_server_id);
              await addFileData({
                id: pol[j].id,
                policy: pol[j].policy,
                filename: pol[j].filename,
                servers: pol[j].servers,
                version: "v0",
                orders: pol[j].orders,
              });
            } else {
              const r_A = fetch(`http://objectserver${pol[j].orders[0]}:1040/${pol[j].id}`)
              const r_B = fetch(`http://objectserver${pol[j].orders[1]}:1040/${pol[j].id}`)

              const A = await r_A.then( (r)=> r.blob()).then((blob) =>
                blob.arrayBuffer()
              );
              const B = await r_B.then( (r)=> r.blob()).then((blob) =>
                blob.arrayBuffer()
              );
              const A_xor_B = xor.encode(encode(A), encode(B))

              await upload(
                pol[j].id,
                A_xor_B,
                `http://objectserver${recover_server_id}:1040`
              );
              pol[j].orders[2] = recover_server_id;
              pol[j].servers.push(recover_server_id);
              await addFileData({
                id: pol[j].id,
                policy: pol[j].policy,
                filename: pol[j].filename,
                servers: pol[j].servers,
                version: "v0",
                orders: pol[j].orders,
              });
            }
          } else { 
            var recover_server_id = getRandomInt(1, 6);
            while (pol[j].servers.indexOf(recover_server_id) >= 0 ){
              recover_server_id = getRandomInt(1, 6);
            }
            var order_index = pol[j].orders.indexOf(i);
            pol[j].servers.push(recover_server_id);
            pol[j].orders[order_index] = recover_server_id;

            if (order_index == 0){
              const r_B = fetch(`http://objectserver${pol[j].orders[1]}:1040/${pol[j].id}`)
              const r_P = fetch(`http://objectserver${pol[j].orders[2]}:1040/${pol[j].id}`)
              const r_Q = fetch(`http://objectserver${pol[j].orders[3]}:1040/${pol[j].id}`)

              if ((await r_B).ok && (await r_P).ok){
                const B = await r_B.then( (r_B) => r_B.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const P = await r_P.then( (r_P) => r_P.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const piece_B = encode(B).length/2;
                const piece_P = encode(P).length/2;

                var B1 = encode(B).slice(0, piece_B);
                var B2 = encode(B).slice(piece_B, encode(B).length);
                var P1 = encode(P).slice(0, piece_P);
                var P2 = encode(P).slice(piece_P, encode(P).length);

                var A1 = xor.decode(B1, P1);
                var A2 = xor.decode(B2, P2);

                var A = A1.concat(A2);
                await upload(
                  pol[j].id,
                  A,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                }); 
            
              } else if ((await r_B).ok && (await r_Q).ok){
                const B = await r_B.then( (r_B) => r_B.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const Q = await r_Q.then( (r_Q) => r_Q.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const piece_B = encode(B).length/2;
                const piece_Q = pol[j].lengthQ1;

                var B1 = encode(B).slice(0, piece_B);
                var B2 = encode(B).slice(piece_B, encode(B).length);
                var Q1 = encode(Q).slice(0, piece_Q);
                var Q2 = encode(Q).slice(piece_Q, encode(Q).length);

                var P2 = xor.decode(B1, Q2);
                var A2 = xor.decode(B2, P2);
                var A1 = xor.decode(B2, Q1);

                var A = A1.concat(A2);
                await upload(
                  pol[j].id,
                  A,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                }); 
                
              } else if ((await r_P).ok && (await r_Q).ok){
                const P = await r_P.then( (r_P) => r_P.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const Q = await r_Q.then( (r_Q) => r_Q.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                
                const piece_P = encode(P).length/2;
                const piece_Q = pol[j].lengthQ1;

                var P1 = encode(P).slice(0, piece_P);
                var P2 = encode(P).slice(piece_P, encode(P).length);
                var Q1 = encode(Q).slice(0, piece_Q);
                var Q2 = encode(Q).slice(piece_Q, encode(Q).length);
                
                var B1 = xor.decode(P2, Q2);
                var A1 = xor.decode(B1, P1);
                var B2 = xor.decode(A1, Q1);
                var A2 = xor.decode(B2, P2);
            
                var A = A1.concat(A2);
                await upload(
                  pol[j].id,
                  A,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                }); 
              }              

            } else if (order_index == 1){
              const r_A = fetch(`http://objectserver${pol[j].orders[0]}:1040/${pol[j].id}`)
              const r_P = fetch(`http://objectserver${pol[j].orders[2]}:1040/${pol[j].id}`)
              const r_Q = fetch(`http://objectserver${pol[j].orders[3]}:1040/${pol[j].id}`)

              if ((await r_A).ok && (await r_P).ok){
                const A = await r_A.then( (r_A) => r_A.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const P = await r_P.then( (r_P) => r_P.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );

                const piece_A = encode(A).length/2;
                const piece_P = encode(P).length/2;

                var A1 = encode(A).slice(0, piece_A);
                var A2 = encode(A).slice(piece_A, encode(A).length);
                var P1 = encode(P).slice(0, piece_P);
                var P2 = encode(P).slice(piece_P, encode(P).length);

                var B1 = xor.decode(A1, P1);
                var B2 = xor.decode(A2, P2);

                var B = B1.concat(B2);
                await upload(
                  pol[j].id,
                  B,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                }); 

              } else if ((await r_A).ok && (await r_Q).ok){
                const A = await r_A.then( (r_A) => r_A.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const Q = await r_Q.then( (r_Q) => r_Q.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );

                const piece_A = encode(A).length/2;
                const piece_Q = pol[j].lengthQ1;

                var A1 = encode(A).slice(0, piece_A);
                var A2 = encode(A).slice(piece_A, encode(A).length);
                var Q1 = encode(Q).slice(0, piece_Q);
                var Q2 = encode(Q).slice(piece_Q, encode(Q).length);

                var B2 = xor.decode(A1, Q1);
                var P2 = xor.encode(A2, B2);
                var B1 = xor.decode(P2, Q2);
                
                var B = B1.concat(B2);
                await upload(
                  pol[j].id,
                  B,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                });

              } else if ((await r_P).ok && (await r_Q).ok){
                const P = await r_P.then( (r_P) => r_P.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const Q = await r_Q.then( (r_Q) => r_Q.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                
                const piece_P = encode(P).length/2;
                const piece_Q = pol[j].lengthQ1;

                var P1 = encode(P).slice(0, piece_P);
                var P2 = encode(P).slice(piece_P, encode(P).length);
                var Q1 = encode(Q).slice(0, piece_Q);
                var Q2 = encode(Q).slice(piece_Q, encode(Q).length);

                var B1 = xor.decode(P2, Q2);
                var A1 = xor.decode(B1, P1);
                var B2 = xor.decode(A1, Q1);
                var A2 = xor.decode(B2, P2);

                var B = B1.concat(B2);
                await upload(
                  pol[j].id,
                  B,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                });
              }
            } else if (order_index == 2){
              const r_A = fetch(`http://objectserver${pol[j].orders[0]}:1040/${pol[j].id}`)
              const r_B = fetch(`http://objectserver${pol[j].orders[1]}:1040/${pol[j].id}`)
              const r_Q = fetch(`http://objectserver${pol[j].orders[3]}:1040/${pol[j].id}`)
              if ((await r_A).ok && (await r_B).ok){
                const A = await r_A.then( (r_A) => r_A.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const B = await r_B.then( (r_B) => r_B.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );

                const piece_A = encode(A).length/2;
                const piece_B = encode(B).length/2;

                var A1 = encode(A).slice(0, piece_A);
                var A2 = encode(A).slice(piece_A, encode(A).length);
                var B1 = encode(B).slice(0, piece_B);
                var B2 = encode(B).slice(piece_B, encode(B).length);

                var P1 = xor.encode(A1, B1);
                var P2 = xor.encode( A2, B2)
                var P = P1.concat(P2);

                await upload(
                  pol[j].id,
                  P,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                });


              } else if ((await r_A).ok && (await r_Q).ok){
                const A = await r_A.then( (r_A) => r_A.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const Q = await r_Q.then( (r_Q) => r_Q.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );

                const piece_A = encode(A).length/2;
                const piece_Q = pol[j].lengthQ1;
          
                var A1 = encode(A).slice(0, piece_A);
                var A2 = encode(A).slice(piece_A, encode(A).length);
                var Q1 = encode(Q).slice(0, piece_Q);
                var Q2 = encode(Q).slice(piece_Q, encode(Q).length);

                var B2 = xor.decode(A1, Q1);
                var P2 = xor.encode(A2, B2);
                var B1 = xor.decode(P2, Q2);
                var P1 = xor.encode(A1, B1);

                var P = P1.concat(P2);
                await upload(
                  pol[j].id,
                  P,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                });

              } else if ((await r_B).ok && (await r_Q).ok){
                const B = await r_B.then( (r_B) => r_B.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const Q = await r_Q.then( (r_Q) => r_Q.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const piece_B = encode(B).length/2;
                const piece_Q = pol[j].lengthQ1;

                var B1 = encode(B).slice(0, piece_B);
                var B2 = encode(B).slice(piece_B, encode(B).length);
                var Q1 = encode(Q).slice(0, piece_Q);
                var Q2 = encode(Q).slice(piece_Q, encode(Q).length);

                var P2 = xor.decode(B1, Q2);
                var A2 = xor.decode(B2, P2);
                var A1 = xor.decode(B2, Q1);
                var P1 = xor.encode(A1, B1);

                var P = P1.concat(P2);
                await upload(
                  pol[j].id,
                  P,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                });

              }

            } else {
              const r_A = fetch(`http://objectserver${pol[j].orders[0]}:1040/${pol[j].id}`)
              const r_B = fetch(`http://objectserver${pol[j].orders[1]}:1040/${pol[j].id}`)
              const r_P = fetch(`http://objectserver${pol[j].orders[2]}:1040/${pol[j].id}`)

              if ((await r_A).ok && (await r_B).ok){
                const A = await r_A.then( (r_A) => r_A.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const B = await r_B.then( (r_B) => r_B.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );

                const piece_A = encode(A).length/2;
                const piece_B = encode(B).length/2;

                var A1 = encode(A).slice(0, piece_A);
                var A2 = encode(A).slice(piece_A, encode(A).length);
                var B1 = encode(B).slice(0, piece_B);
                var B2 = encode(B).slice(piece_B, encode(B).length);

                var P1 = xor.encode(A1, B1);
                var P2 = xor.encode(A2, B2);
                var Q1 = xor.encode(A1, B2);
                var Q2 = xor.encode(B1, P2);

                var Q = Q1.concat(Q2)

                await upload(
                  pol[j].id,
                  Q,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                });

              } else if ((await r_A).ok && (await r_P).ok){
                const A = await r_A.then( (r_A) => r_A.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const P = await r_P.then( (r_P) => r_P.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );

                const piece_A = encode(A).length/2;
                const piece_P = encode(P).length/2;

                var A1 = encode(A).slice(0, piece_A);
                var A2 = encode(A).slice(piece_A, encode(A).length);
                var P1 = encode(P).slice(0, piece_P);
                var P2 = encode(P).slice(piece_P, encode(P).length);

                var B1 = xor.decode(A1, P1);
                var B2 = xor.decode(A2, P2);
                var Q1 = xor.encode(A1, B2);
                var Q2 = xor.encode(B1, P2);

                var Q = Q1.concat(Q2);
                await upload(
                  pol[j].id,
                  Q,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                });

              } else if ((await r_B).ok && (await r_P).ok){
                const B = await r_B.then( (r_B) => r_B.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const P = await r_P.then( (r_P) => r_P.blob()).then( (blob) =>
                  blob.arrayBuffer()
                );
                const piece_B = encode(B).length/2;
                const piece_P = encode(P).length/2;

                var B1 = encode(B).slice(0, piece_B);
                var B2 = encode(B).slice(piece_B, encode(B).length);
                var P1 = encode(P).slice(0, piece_P);
                var P2 = encode(P).slice(piece_P, encode(P).length);

                var A1 = xor.decode(B1, P1);
                var A2 = xor.decode(B2, P2);
                var Q1 = xor.encode(A1, B2);
                var Q2 = xor.encode(B1, P2);

                var Q = Q1.concat(Q2);
                await upload(
                  pol[j].id,
                  Q,
                  `http://objectserver${recover_server_id}:1040`
                );
                await addFileData({
                  id: pol[j].id,
                  policy: pol[j].policy,
                  filename: pol[j].filename,
                  servers: pol[j].servers,
                  version: "v0",
                  orders: pol[j].orders,
                  lengthQ1: pol[j].lengthQ1,
                });     
              }
            }
          }
        }
        console.log("Server", i, "repaired");
        continue;
      }
    }
  }
  console.log("......Heart Beating......");
});

app.use(oakCors({ origin: "*" }));
app.use(errorHandler);
app.use(timingMiddleware);

app.use(router.routes());
app.use(router.allowedMethods({ throw: true }));

app.addEventListener(
  "listen",
  (_e) => console.log("Listening on http://127.0.0.1:1039"),
);

await app.listen({ hostname: "0.0.0.0", port: 1039 });
