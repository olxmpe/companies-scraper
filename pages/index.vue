<script setup lang="ts">
import { ref, computed } from "vue";
import PlusIcon from "~/assets/PlusIcon.vue";

const { $api } = useNuxtApp();

const allSectors: string[] = [
  "Banque",
  "Assurance",
  "Informatique",
  "Santé",
  "Éducation",
  "Commerce",
  "Transport",
  "Immobilier",
];

const sectorInput = ref<string>("");
const selectedSectors = ref<string[]>([]);
const zipCode = ref<number>();

const filteredSectors = computed(() => {
  if (!sectorInput.value) return [];
  const normalizedInput = normalizeString(sectorInput.value);
  return allSectors.filter(
    (sector) =>
      normalizeString(sector).startsWith(normalizedInput) &&
      !selectedSectors.value.includes(sector)
  );
});

const selectSector = (sector: string) => {
  if (!selectedSectors.value.includes(sector)) {
    selectedSectors.value.push(sector);
  }
  sectorInput.value = "";
};

const removeSector = (sector: string) => {
  selectedSectors.value = selectedSectors.value.filter((s) => s !== sector);
};

const isFormDisabled = computed(() => {
  return !zipCode.value || selectedSectors.value.length === 0;
});

const startScraping = () => {
  let formData = {
    zipCode: zipCode.value,
    sectors: selectedSectors.value,
  };

  // $api.sendRequest("/scrap", "POST", formData);
  console.log(formData);
};
</script>

<template>
  <NuxtLayout>
    <div class="header">
      <h2>Commencer la moisson</h2>
    </div>

    <div class="input-field relative">
      <p class="field-label">Secteurs à analyser</p>
      <input v-model="sectorInput" type="text" class="input" />
      <ul v-if="filteredSectors.length" class="autocomplete-list">
        <li
          v-for="sector in filteredSectors"
          :key="sector"
          @click="selectSector(sector)"
          class="autocomplete-item"
        >
          {{ sector }}
        </li>
      </ul>
    </div>

    <div class="sectors tags flex">
      <div
        v-for="sector in selectedSectors"
        :key="sector"
        class="tag flex"
        @click="removeSector(sector)"
      >
        <p>{{ sector }}</p>
        <PlusIcon style="transform: rotate(45deg)" />
      </div>
    </div>

    <div class="input-field">
      <p class="field-label">Code postal</p>
      <input type="number" class="input" v-model="zipCode" />
    </div>

    <div
      class="form-button flex"
      @click="startScraping()"
      :class="{ disabled: isFormDisabled }"
    >
      Lancer la recherche
    </div>
  </NuxtLayout>
</template>

<style scoped lang="scss">
.input-field {
  position: relative;

  .autocomplete-list {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    list-style: none;
    padding: 0;
    margin: 0;
    z-index: 10;

    .autocomplete-item {
      padding: 8px;
      cursor: pointer;
      &:hover {
        background: #f0f0f0;
      }
    }
  }
}

.sectors {
  border-radius: 5px;
  background-color: white;
  margin: 1rem 0;
}
</style>
