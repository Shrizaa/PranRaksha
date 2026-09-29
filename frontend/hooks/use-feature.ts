"use client"

import useSWR from "swr"
import { callFeature } from "@/lib/api-client"
import { useAppLocation } from "@/components/app-provider"

export function useFeature<T = unknown>(endpoint: string) {
  const { location } = useAppLocation()
  const key = [
    endpoint,
    location.latitude,
    location.longitude,
    location.relief_days,
  ] as const

  const { data, error, isLoading, mutate } = useSWR<T>(
    key,
    () =>
      callFeature<T>(endpoint, {
        latitude: location.latitude,
        longitude: location.longitude,
        relief_days: location.relief_days,
      }),
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  return {
    data,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    loading: isLoading,
    refresh: () => mutate(),
    location,
  }
}
