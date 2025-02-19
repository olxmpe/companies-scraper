<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import PlusIcon from "~/assets/PlusIcon.vue";

const { $api } = useNuxtApp();

const sectors: string[] = [
  "Restaurant", "Hôtel", "Café", "Bar", "Boulangerie", "Pâtisserie", "Boucherie", "Traiteur",
  "Coiffeur", "Salon de beauté", "Institut de beauté", "Spa", "Salle de sport", "Gymnase",
  "Salle de cinéma", "Théâtre", "Musée", "Galerie d'art", "Bibliothèque", "Bureau de poste",
  "Pharmacie", "Clinique", "Hôpital", "Cabinet médical", "Dentiste", "Opticien", "Laboratoire",
  "Supermarché", "Magasin de vêtements", "Magasin de chaussures", "Quincaillerie", "Jardinage",
  "Animalerie", "Papeterie", "Marché", "Camping", "Auberge", "Chambre d'hôtes", "Gîte",
  "Agence de voyage", "Bureau de change", "Agence immobilière", "Banque", "Commissariat de police",
  "Station-service", "Garage automobile", "Concession automobile", "Atelier de réparation",
  "Laverie", "Pressing", "Photographe", "Salle de jeux", "Karaoké", "Discothèque", "Casino",
  "Parc d'attractions", "Zoo", "Aquarium", "Gare", "Aéroport", "Port maritime", "Cabinet d'avocats",
  "Notaire", "Entreprise de nettoyage", "Entreprise de construction", "École", "Université",
  "Établissement scolaire privé", "Crèche", "Centre de loisirs", "Centre de rééducation",
  "Centre de formation professionnelle", "Coaching", "Cabinet de conseil", "Cabinet de recrutement",
  "Centre médical", "Centre dentaire", "Pharmacie vétérinaire", "Bureau d'études", "Agence de publicité",
  "Agence de communication", "Agence web", "Centre d'appel", "Centre de data", "Espace de coworking",
  "Ferme", "Domaine viticole", "Brasserie", "Distillerie", "Laboratoire pharmaceutique",
  "Éditeur de logiciels", "Tiers-lieu", "Épicerie fine", "Vente en ligne", "Magasin d'électronique",
  "Magasin de meubles", "Bricolage", "Service de livraison", "Transport de marchandises",
  "Taxi", "VTC", "Service de location de voitures", "Centre de bien-être", "Salle de massage",
  "Club de sport", "École de danse", "Ecole de musique", "Réseau de télécommunication",
  "Entrepreneur individuel", "Startup", "Incubateur", "Laboratoire de recherche", "Centre scientifique",
  "Hôpital vétérinaire", "Clinique vétérinaire", "Médiathèque", "Centre communautaire",
  "Lieu de culte", "Église", "Mosquée", "Temple", "Synagogue", "Gîte d'étape", "Auberge de jeunesse",
  "Pépinière d'entreprises", "Atelier de création", "Ferme pédagogique", "Maison de retraite",
  "Château", "Lieu de mariage", "Bar à cocktails", "Restaurant gastronomique", "Fast food",
  "Brewpub", "Distributeur automatique", "Cave à vin", "Salons professionnels", "Espace événementiel",
  "Parc naturel", "Observatoire", "Chapelle", "Cimetière", "Motel", "Hostel", "Taverne", "Brewery",
  "Studio photo", "Galerie de peinture", "Exposition d'art", "Entreprise de transport",
  "Service d'entretien", "Société d'assurance", "Plateforme de crowdfunding", "Vente de détail en ligne",
  "Banque en ligne", "Entreprise de télécommunications", "Société de gestion d'actifs", "Cabinet fiscaliste",
  "Entrepreneur social", "Service d'accompagnement à domicile", "Centre d'hébergement",
  "Service de médiation", "Maison de santé", "Enseignement supérieur", "Centre d'expertise",
  "Entreprise de sécurité", "Entreprise de conseil en management", "Entreprise de recrutement",
  "Entreprise de marketing digital", "Société de marketing d'influence", "Société de production audiovisuelle",
  "École d'architecture", "Service de traduction", "Centre d'enseignement des langues", "Atelier d'artisanat"
];
const departments = ref([]);

const sectorInput = ref<string>("");
const departmentInput = ref<string>("");
const cityInput = ref<string>("");
const nameInput = ref<string>("");

const selectedSectors = ref<string[]>([]);
const selectedCities = ref<string[]>([]);
const selectedDepartments = ref<string[]>([]);
const searchByDepartment = ref<boolean>(true);
const name = ref<string>("");

const exports = ref([]);
const csvStatus = ref({});

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
const csvWs = new WebSocket("ws://localhost:3002");

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
  let formData: { cities: string[]; sectors: string[], export_name: string } = {
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

const fetchExports = async () => {
  try {
    const response = await fetch('/api/exports');
    const data = await response.json();
    exports.value = data.body;

    // Vérifiez si les fichiers CSV existent déjà
    for (const exportItem of exports.value) {
      const filename = `export_${exportItem.name}_${new Date(exportItem.created_at).toISOString().split('T')[0]}.csv`.replace(/[^a-z0-9_.-]/gi, '_');
      const filepath = `/downloads/${filename}`;

      try {
        const fileResponse = await fetch(filepath);
        if (fileResponse.ok) {
          csvStatus.value[exportItem.id] = { status: 'success', message: 'CSV déjà généré.', filename };
        }
      } catch (error) {
        console.error(`Fichier non trouvé : ${filename}`, error);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des exports :", error);
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString.replace(' ', 'T') + 'Z');
  return isNaN(date.getTime()) ? "Date invalide" : date.toLocaleString();
};

const requestCSV = (exportId: number) => {
  csvStatus.value[exportId] = { status: 'processing', message: 'Génération en cours...' };
  csvWs.send(JSON.stringify({ exportId }));
};

csvWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const { exportId, status, message, filename } = data;

  // Log pour vérifier la réception du message de succès
  console.log(`Message reçu : ${status} pour l'export ${exportId}`);

  if (status === 'success') {
    csvStatus.value[exportId] = { status, message, filename };
  } else {
    csvStatus.value[exportId] = { status, message };
  }
};

onMounted(() => {
  fetchExports();
});
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
      <input type="text" class="input" v-model="nameInput" />
    </div>

    <div
        class="form-button flex"
        @click="startScraping()"
        :class="{ disabled: isFormDisabled }"
    >
      Lancer la recherche
    </div>

    <div class="exports-list">
      <h3>Liste des exports</h3>
      <ul>
        <li v-for="exportItem in exports" :key="exportItem.id">
          {{ exportItem.name }} - {{ formatDate(exportItem.created_at) }}
          <button
              v-if="!csvStatus[exportItem.id] || csvStatus[exportItem.id].status === 'error'"
              @click="requestCSV(exportItem.id)"
          >
            Générer le CSV
          </button>
          <span v-if="csvStatus[exportItem.id]?.status === 'processing'">
            <i class="spinner"></i> Génération en cours...
          </span>
          <a
              v-if="csvStatus[exportItem.id]?.status === 'success'"
              :href="`/downloads/${csvStatus[exportItem.id].filename}`"
              download
          >
            Télécharger
          </a>
        </li>
      </ul>
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

.exports-list {
  margin-top: 2rem;

  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  ul {
    list-style-type: none;
    padding: 0;

    li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;

      &:last-child {
        border-bottom: none;
      }

      button, a {
        margin-left: 1rem;
        padding: 0.5rem 1rem;
        background-color: #007bff;
        color: white;
        border-radius: 4px;
        text-decoration: none;
      }

      a {
        background-color: #28a745;
      }

      .spinner {
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        width: 14px;
        height: 14px;
        animation: spin 1s linear infinite;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
