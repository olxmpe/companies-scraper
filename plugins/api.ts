export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const sendRequest: FetchDataMethod = async (endpoint, method, body) => {
    return $fetch(endpoint, {
      baseURL: config.public.apiUrl,
      method,
      ...(body && { body: body }),
    });
  };

  return {
    provide: {
      api: {
        sendRequest,
      },
    },
  };
});
