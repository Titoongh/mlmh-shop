import { Cart, CartItem, LocalStorageEnum } from '../types/types'
import useLocalStorage from './useLocalStorage'

export const useCart = () => {
    const [cart, setCart] = useLocalStorage<Cart>(LocalStorageEnum.CART, {
        items: [],
    })

    const getLatestCart = (): Cart => {
        try {
            const storedCart = window.localStorage.getItem(
                LocalStorageEnum.CART,
            )
            return storedCart ? JSON.parse(storedCart) : { items: [] }
        } catch (error) {
            return { items: [] }
        }
    }

    const addItem = (item: CartItem) => {
        const currentCart = getLatestCart()

        // Check if item already exists
        const exists = currentCart.items.some(
            cartItem => cartItem.id === item.id && cartItem.type === item.type,
        )

        if (!exists) {
            setCart({
                items: [...currentCart.items, item],
            })
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('cartUpdate'))
            }
        }
    }

    const removeItem = (itemToRemove: CartItem) => {
        const currentCart = getLatestCart()

        const filteredItems = currentCart.items.filter(
            item =>
                !(
                    item.id === itemToRemove.id &&
                    item.type === itemToRemove.type
                ),
        )

        setCart({
            items: filteredItems,
        })
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cartUpdate'))
        }
    }

    const emptyCart = () => {
        setCart({
            items: [],
        })
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cartUpdate'))
        }
    }

    const getItems = (): CartItem[] => {
        const currentCart = getLatestCart()
        return currentCart.items
    }

    const isInCart = (itemToCheck: CartItem): boolean => {
        const currentCart = getLatestCart()
        return (
            currentCart.items.some(
                item =>
                    item.id === itemToCheck.id &&
                    item.type === itemToCheck.type,
            ) || false
        )
    }

    const getItemById = (id: string): CartItem | undefined => {
        return cart?.items.find(item => item.id === id)
    }

    return {
        addItem,
        removeItem,
        emptyCart,
        getItems,
        isInCart,
        getItemById,
    }
}
