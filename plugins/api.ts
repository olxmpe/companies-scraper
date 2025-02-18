export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const sendRequest: FetchDataMethod = async (endpoint, method, body) => {
    return $fetch(endpoint, {
      baseURL: config.public.apiUrl,
      method,
      ...(body && { body: body }),
    });
  };

  const getFranceAdministrativeDivision = async (
    endpoint: string
  ): Promise<City[] | Department[]> => {
    return await sendRequest(`https://geo.api.gouv.fr/${endpoint}`, "GET");
  };

  return {
    provide: {
      api: {
        sendRequest,
        getFranceAdministrativeDivision,
      },
    },
  };
});
