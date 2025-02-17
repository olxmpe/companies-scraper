<script setup lang="ts">
const sectors = ref(["banque"]);
</script>
<template>
  <NuxtLayout>
    <div class="header"><h2>Commencer la moisson</h2></div>
    <div class="input-field">
      <p class="field-label">Secteur à analyser</p>
      <input type="text" />
    </div>

    <div class="input-field">
      <p class="field-label">Code postal</p>
      <input type="number" />
    </div>

    <div class="form-button flex">Lancer la recherche</div>
  </NuxtLayout>
</template>
