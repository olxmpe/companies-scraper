<script setup lang="ts">
import { ref, computed } from "vue";
import PlusIcon from "~/assets/PlusIcon.vue";

const { $api } = useNuxtApp();

const sectors: string[] = [
  "Banque",
  "Assurance",
  "Informatique",
  "Santé",
  "Éducation",
  "Commerce",
  "Transport",
  "Immobilier",
];
const departments = ref([]);

const sectorInput = ref<string>("");
const departmentInput = ref<string>("");
const cityInput = ref<string>("");

const selectedSectors = ref<string[]>([]);
const selectedCities = ref<string[]>([]);
const selectedDepartments = ref<string[]>([]);
const searchByDepartment = ref<boolean>(true);

const filteredSectors = computed(() => {
  if (!sectorInput.value) return [];
  const normalizedInput = normalizeString(sectorInput.value);
  return sectors.filter(
    (sector) =>
      normalizeString(sector).startsWith(normalizedInput) &&
      !selectedSectors.value.includes(sector)
  );
});

const filteredCities = ref<City[]>([]);
const filteredDepartments = ref<Department[]>([]);

const ws = new WebSocket("ws://localhost:3001");

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
  return (
    selectedSectors.value.length === 0 ||
    (searchByDepartment.value
      ? selectedDepartments.value.length === 0
      : selectedCities.value.length === 0)
  );
});

const startScraping = async () => {
  let formData: { cities: string[]; sectors: string[] } = {
    cities: [],
    sectors: selectedSectors.value,
  };

  if (searchByDepartment.value && selectedDepartments.value.length) {
    for (const departmentCode of selectedDepartments.value) {
      try {
        const citiesInDepartment = await $api.getFranceAdministrativeDivision(
          `departements/${departmentCode}/communes`
        );

        if (Array.isArray(citiesInDepartment)) {
          formData.cities.push(
            ...citiesInDepartment.map((city: City) => city.nom)
          );
        }
      } catch (error) {
        console.error(
          `Erreur lors de la récupération des villes pour ${departmentCode}`,
          error
        );
      }
    }
  } else {
    formData.cities = [...selectedCities.value];
  }

  console.log("📤 Envoi des données :", formData);
  ws.send(JSON.stringify(formData));

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.status === "success") {
      console.log("✅ Résultats reçus :", data.results);
    } else {
      console.error("❌ Erreur :", data.message);
    }
  };

  selectedCities.value.length = 0;
  selectedDepartments.value.length = 0;
  selectedSectors.value.length = 0;
};

const getCities = async (input: string) => {
  try {
    const response = await $api.getFranceAdministrativeDivision(
      `communes?nom=${encodeURIComponent(input)}&fields=nom,code`
    );
    filteredCities.value = response.map((city: City) => ({
      nom: city.nom,
      code: city.code,
    }));
  } catch (error) {
    console.error(error);
    filteredCities.value = [];
  }
};

const getDepartments = async (input: string) => {
  try {
    const response = await $api.getFranceAdministrativeDivision(
      `departements?code=${input}`
    );

    filteredDepartments.value = response.map((department: Department) => ({
      nom: department.nom,
      code: department.code,
    }));
  } catch (error) {
    console.error(error);
  }
};

const selectCity = (city: string) => {
  selectedCities.value.push(city);
  cityInput.value = "";
};

const removeCity = (city: string) => {
  selectedCities.value = selectedCities.value.filter((c) => c !== city);
};

const selectDepartment = (department: Department["code"]) => {
  selectedDepartments.value.push(department);
  departmentInput.value = "";
};

const removeDepartment = (department: string) => {
  selectedDepartments.value = selectedDepartments.value.filter(
    (d) => d !== department
  );
};

const toggleSearchMode = () => {
  searchByDepartment.value = !searchByDepartment.value;
  selectedCities.value = [];
  selectedDepartments.value = [];
  cityInput.value = "";
  departmentInput.value = "";
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
      <ul
        v-if="filteredSectors.length && sectorInput"
        class="autocomplete-list"
      >
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

    <div @click="toggleSearchMode" class="form-button flex toggle">
      {{
        searchByDepartment
          ? "Rechercher par nom de commune"
          : "Rechercher par n° de département"
      }}
    </div>

    <div v-if="searchByDepartment">
      <div class="input-field relative">
        <input
          v-model="departmentInput"
          class="input"
          placeholder="Numéro de entre 01 et 95"
          @input="getDepartments(departmentInput)"
        />
        <ul
          v-if="filteredDepartments.length && departmentInput"
          class="autocomplete-list"
        >
          <li
            v-for="department in filteredDepartments"
            :key="department.code"
            @click="selectDepartment(department.code)"
            class="autocomplete-item"
          >
            {{ department.nom }} ({{ department.code }})
          </li>
        </ul>
      </div>

      <div class="sectors tags flex">
        <div
          v-for="department in selectedDepartments"
          :key="department"
          class="tag flex"
          @click="removeSector(department)"
        >
          <p>{{ department }}</p>
          <PlusIcon style="transform: rotate(45deg)" />
        </div>
      </div>
    </div>

    <div v-else>
      <div class="input-field relative">
        <input
          v-model="cityInput"
          type="text"
          class="input"
          @input="getCities(cityInput)"
        />
        <ul v-if="filteredCities.length && cityInput" class="autocomplete-list">
          <li
            v-for="city in filteredCities"
            :key="city.code"
            @click="selectCity(city.nom)"
            class="autocomplete-item"
          >
            {{ city.nom }} ({{ city.code }})
          </li>
        </ul>
      </div>

      <div class="sectors tags flex">
        <div
          v-for="city in selectedCities"
          :key="city"
          class="tag flex"
          @click="removeSector(city)"
        >
          <p>{{ city }}</p>
          <PlusIcon style="transform: rotate(45deg)" />
        </div>
      </div>
    </div>

    <div class="input-field">
      <p class="field-label">Nom de l'export</p>
      <input type="text" class="input" />
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
    max-height: 150px;
    overflow: scroll;

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

.toggle {
  margin: 1rem 0;
}
</style>
