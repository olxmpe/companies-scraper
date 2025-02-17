<script setup lang="ts"></script>
<template>
  <div class="content-wrapper flex">
    <div class="form">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.content-wrapper {
  background-color: var(--sand-background);
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  height: var(--app-height);

  .form {
    padding: 2rem;
    border-radius: 10px;
    background-color: var(--lighter-background);
    width: auto;
    min-width: 300px;
    max-width: 80%;
  }
}
</style>
