<script setup lang="ts">
import ThemeSwitcher from './components/ThemeSwitcher.vue';
</script>

<template>
  <h1>Policy Driven Data Protection</h1>

  <h2>Upload File</h2>
  <form>
    <label>
      <span>File</span>
      <input type="file" name="object_id" />
    </label>

    <label>
      <span>Policy</span>

      <select>
        <option value="RAID0">RAID0</option>
        <option value="RAID1">RAID1</option>
      </select>
    </label>

    <button type="submit">Upload File</button>
  </form>

  <h2>Download File</h2>
  <form>
    <label>
      <span>Object ID</span>
      <input type="text" name="object_id" />
    </label>

    <button type="submit">Download</button>
  </form>

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
