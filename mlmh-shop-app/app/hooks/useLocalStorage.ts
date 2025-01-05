import { useState, useCallback } from 'react'
import { LocalStorageEnum } from '../types/types'

export default function useLocalStorage<T>(
    key: LocalStorageEnum,
    initialValue?: T,
): [T | undefined, (v: T | undefined) => void] {
    const [storedValue, setStoredValue] = useState<T | undefined>(() => {
        try {
            const item = window.localStorage.getItem(key)
            const value: T = item ? JSON.parse(item) : initialValue
            return value
        } catch (error) {
            return initialValue
        }
    })

    const setValue = useCallback(
        (value: T | undefined) => {
            try {
                if (value === undefined)
                    return window.localStorage.removeItem(key)

                const valueToStore: T =
                    value instanceof Function ? value(storedValue) : value
                setStoredValue(valueToStore)
                window.localStorage.setItem(key, JSON.stringify(valueToStore))
            } catch (error) {
                return
            }
        },
        [key, storedValue],
    )

    return [storedValue, setValue]
}
