<script setup lang="ts">
import ThemeSwitcher from './components/ThemeSwitcher.vue';
import Upload from './components/Upload.vue';
import Download from './components/Download.vue';
</script>

<template>
  <h1>Policy Driven Data Protection</h1>

  <h2>Upload File</h2>
  <Upload />

  <h2>Download File</h2>
  <Download />

  <h2>Update File</h2>
  <form>
    <label>
      <span>Object ID</span>
      <input type="text" name="object_id" />
    </label>
    <input type="file" name="file" />
    <button type="submit">Update</button>
  </form>

  <h2>Query Layout</h2>
  <form>
    <label>
      <span>Object ID</span>
      <input type="text" name="object_id" />
    </label>

    <button type="submit">Query</button>
  </form>

  <ThemeSwitcher />
</template>
