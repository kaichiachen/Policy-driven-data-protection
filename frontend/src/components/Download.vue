<script setup lang="ts">
import { ref } from 'vue';

// fef9251f-dabc-4312-89c3-9ab1a7d01f37
const objectId = ref('');

const uploadSubmit = async (ev: Event) => {
  ev.preventDefault();
  window.open('http://localhost:1039/download/' + objectId.value);
};
</script>

<template>
  <form @submit="uploadSubmit">
    <label>
      <span>Object ID</span>
      <input type="text" name="object_id" v-model="objectId" />
    </label>

    <button type="submit">Download</button>
  </form>
</template>
