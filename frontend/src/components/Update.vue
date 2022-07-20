<script setup lang="ts">
import { ref } from 'vue';
import { bytesToBase64 } from 'byte-base64';

const idRef = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const uploadSubmit = async (e: Event) => {
  e.preventDefault();
  const f = fileInput.value?.files?.item(0);
  if (!f) return;

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

  await fetch('http://localhost:1039/update/' + idRef.value, {
    method: 'PUT',
    body: JSON.stringify({
      content: b64,
      filename: f.name,
    }),
    headers: { 'content-type': 'application/json' },
  })
    .then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    })
    .then((_data) => {
      alert('OK');
    });
};
</script>

<template>
  <form @submit="uploadSubmit">
    <label>
      <span>File</span>
      <input type="file" name="file_upload" ref="fileInput" />
    </label>

    <label>
      <span>Object ID</span>
      <input type="text" name="object_id" v-model="idRef" />
    </label>

    <button type="submit">Upload File</button>
  </form>
</template>
