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

type Export = {
  id: number;
  name: string;
  created_at: string;
};

interface CsvStatusItem {
  status: "processing" | "success" | "error";
  message: string;
  filename?: string;
}
