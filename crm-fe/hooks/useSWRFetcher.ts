import useSWR from "swr"
import { apiCall } from "@/lib/api-client"

export function useSWRFetcher<T>(endpoint: string | null) {
  return useSWR<T>(endpoint, (url) => apiCall<T>(url))
}
