import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Platform } from "react-native";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:3000")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // If we are on web, we can use a relative URL or the public domain
  if (Platform.OS === 'web') {
    return '/';
  }

  // For native, we use the configured domain
  const host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    // Fallback for development if domain is not set
    return 'http://localhost:5000/';
  }

  // Ensure the URL ends with a slash
  const url = host.startsWith('http') ? host : `https://${host}`;
  return url.endsWith('/') ? url : `${url}/`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  // Remove leading slash from route if baseUrl ends with one
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
  const url = new URL(cleanRoute, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const route = queryKey.join("/");
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
    const url = new URL(cleanRoute, baseUrl);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
