import { useState, useCallback } from 'react'
import { LocalStorageEnum } from '../types/types'

export default function useLocalStorage<T>(
    key: LocalStorageEnum,
    initialValue?: T,
): [T | undefined, (v: T | undefined) => void] {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T | undefined>(() => {
        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key)
            // Parse stored json or if none return initialValue
            const value: T = item ? JSON.parse(item) : initialValue
            return value
        } catch (error) {
            // If error also return initialValue
            console.log(error)
            return initialValue
        }
    })

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = useCallback(
        (value: T | undefined) => {
            try {
                if (value === undefined)
                    return window.localStorage.removeItem(key)

                // Allow value to be a function so we have same API as useState
                const valueToStore: T =
                    value instanceof Function ? value(storedValue) : value
                // Save state
                setStoredValue(valueToStore)
                // Save to local storage
                window.localStorage.setItem(key, JSON.stringify(valueToStore))
            } catch (error) {
                // A more advanced implementation would handle the error case
                console.log(error)
            }
        },
        [key, storedValue],
    )

    return [storedValue, setValue]
}
