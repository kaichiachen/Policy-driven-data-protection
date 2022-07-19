interface Data {
  id: string;
  policy: "RAID0" | "RAID1";
  filename: string;
  servers: number[];
}

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

export const addFileData = async (
  inputData: Data,
) => {
  await ensureFileData();

  const data = await Deno.readTextFile("/data/data.json").then((txt) =>
    JSON.parse(txt)
  ) as Data[];

  data.push(inputData);

  await Deno.writeTextFile("/data/data.json", JSON.stringify(data));
};

export const readFileData = async (id: string) => {
  await ensureFileData();

  const data = await Deno.readTextFile("/data/data.json").then((txt) =>
    JSON.parse(txt)
  ) as Data[];

  const a = data.filter((r) => r.id === id);

  if (a.length === 0) return null;
  return a[0];
};
