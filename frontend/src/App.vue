<script setup lang="ts">
import ThemeSwitcher from './components/ThemeSwitcher.vue';
import Upload from './components/Upload.vue';
import Download from './components/Download.vue';
import QueryLayout from './components/QueryLayout.vue';
import Update from './components/Update.vue';
</script>

<template>
  <h1>Policy Driven Data Protection</h1>

  <h2>Upload File</h2>
  <Upload />

  <h2>Download File</h2>
  <Download />

  <h2>Update File</h2>
  <Update />

  <h2>Query Layout</h2>
  <QueryLayout />

  <ThemeSwitcher />
</template>
