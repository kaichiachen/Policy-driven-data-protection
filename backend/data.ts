type DataList = { id: string; policy: "RAID0" | "RAID1" }[];

export const ensureFileData = async () => {
  try {
    await Deno.stat("/data/data.json");
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      await Deno.writeTextFile("/data/data.json", "[]");
    } else {
      throw e;
    }
  }
};

export const addFileData = async (id: string, policy: "RAID0" | "RAID1") => {
  await ensureFileData();

  const data = await Deno.readTextFile("/data/data.json").then((txt) =>
    JSON.parse(txt)
  ) as DataList;

  data.push({ id, policy });

  await Deno.writeTextFile("/data/data.json", JSON.stringify(data));
};

export const readFileData = async (id: string) => {
  await ensureFileData();

  const data = await Deno.readTextFile("/data/data.json").then((txt) =>
    JSON.parse(txt)
  ) as DataList;

  const a = data.filter((r) => r.id === id);

  if (a.length === 0) return null;
  return a[0].policy;
};
