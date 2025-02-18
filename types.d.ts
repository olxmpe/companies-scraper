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

interface City {
  code: string;
  nom: string;
}

interface Department {
  code: string;
  nom: string;
}

interface ScrapRequest {
  cities: string[];
  sectors: string[];
}

interface ScrapResult {
  name: string;
  email: string;
  sector: string;
  city: string;
}
