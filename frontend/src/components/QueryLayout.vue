<script setup lang="ts">
import { ref } from 'vue';

const objectId = ref('');

const uploadSubmit = async (ev: Event) => {
  ev.preventDefault();
  await fetch(`http://localhost:1039/layout?objectId=${objectId.value}`)
    .then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    })
    .then((data) => {
      prompt('Layout:', (data.layout as number[]).join(', '));
    });
};
</script>

<template>
  <form @submit="uploadSubmit">
    <label>
      <span>Object ID</span>
      <input type="text" name="object_id" v-model="objectId" />
    </label>

    <button type="submit">Query</button>
  </form>
</template>
