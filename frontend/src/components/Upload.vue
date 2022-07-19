<script setup lang="ts">
import { ref } from 'vue';
import { bytesToBase64 } from 'byte-base64';

const policy = ref('RAID0');
const fileInput = ref<HTMLInputElement | null>(null);

const uploadSubmit = async (e: Event) => {
  e.preventDefault();
  const f = fileInput.value?.files?.item(0);
  if (!f) return;

  const policyV = policy.value;

  let data: number[] = [];
  const fileData = f.stream().getReader();

  const readData = async () => {
    const chunk = await fileData.read();
    if (chunk.done) return;
    data = data.concat([...chunk.value]);
    await readData();
  };

  await readData();

  const b64 = bytesToBase64(data);

  await fetch('http://localhost:1039/new', {
    method: 'POST',
    body: JSON.stringify({ content: b64, policy: policyV, filename: f.name }),
    headers: { 'content-type': 'application/json' },
  })
    .then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    })
    .then((data) => {
      prompt('Object ID:', data.id);
    });
};
</script>

<template>
  <form @submit="uploadSubmit">
    <label>
      <span>File</span>
      <input type="file" name="object_id" ref="fileInput" />
    </label>

    <label>
      <span>Policy</span>

      <select v-model="policy">
        <option value="RAID0">RAID0</option>
        <option value="RAID1">RAID1</option>
      </select>
    </label>

    <button type="submit">Upload File</button>
  </form>
</template>
