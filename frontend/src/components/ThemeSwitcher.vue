<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core';
import { SunIcon, MoonIcon } from '@heroicons/vue/solid';

const isDark = useDark();
const toggleDark = useToggle(isDark);

const buttonClick = () => {
  toggleDark();
};
</script>

<template>
  <button class="theme-button" @click="buttonClick">
    <SunIcon class="w-4 h-4" v-if="!isDark" />
    <MoonIcon class="w-4 h-4" v-else />
  </button>
</template>
