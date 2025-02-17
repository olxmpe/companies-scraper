type FetchDataMethod = <T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: Record<string, any>
) => Promise<T>;

interface User {
  id: number;
  email: string;
  password: string;
  lastName: string;
  firstName: string;
}
