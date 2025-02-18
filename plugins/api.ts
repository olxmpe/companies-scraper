export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const sendRequest: FetchDataMethod = async (endpoint, method, body) => {
    return $fetch(endpoint, {
      method,
      ...(body && { body: body }),
    });
  };

  const getFranceAdministrativeDivision = async (
    endpoint: string
  ): Promise<City[] | Department[]> => {
    return await sendRequest(`https://geo.api.gouv.fr/${endpoint}`, "GET");
  };

  const handler = async (formData: ScrapRequest) => {
    const { cities, sectors } = formData;
    if (!cities.length || !sectors.length) {
      throw new Error("Paramètres invalides");
    }

    const API_KEY = config.public.GOOGLE_API_KEY;
    const CX = config.public.GOOGLE_CX;

    console.log("env vars", CX, API_KEY);

    let results: ScrapResult[] = [];

    for (const city of cities) {
      for (const sector of sectors) {
        const query = `${sector} ${city} contact email`;
        const url = `https://customsearch.googleapis.com/customsearch/v1?q=${encodeURIComponent(
          query
        )}&cx=${CX}&key=${API_KEY}`;

        try {
          const response: { items: any[] } = await $fetch(url);
          const items = response.items || [];

          for (const item of items) {
            if (item.link.includes("@")) {
              results.push({
                name: item.title,
                email: item.link,
                sector,
                city,
              });
            }
          }
        } catch (error) {
          console.error("Erreur de scraping", error);
          throw new Error("Erreur serveur");
        }
      }
    }

    return results;
  };

  return {
    provide: {
      api: {
        sendRequest,
        getFranceAdministrativeDivision,
        handler,
      },
    },
  };
});
