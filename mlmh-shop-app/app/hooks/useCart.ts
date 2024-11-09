import { Cart, CartItem, LocalStorageEnum } from '../types/types'
import useLocalStorage from './useLocalStorage'

export const useCart = () => {
    const [cart, setCart] = useLocalStorage<Cart>(LocalStorageEnum.CART, {
        items: [],
    })

    const addItem = (item: CartItem) => {
        if (!cart) {
            setCart({ items: [item] })
            return
        }

        // Check if item already exists
        const exists = cart.items.some(
            cartItem => cartItem.id === item.id && cartItem.type === item.type,
        )

        if (!exists) {
            setCart({
                items: [...cart.items, item],
            })
        }
    }

    const removeItem = (itemToRemove: CartItem) => {
        if (!cart) return

        const filteredItems = cart.items.filter(
            item =>
                !(
                    item.id === itemToRemove.id &&
                    item.type === itemToRemove.type
                ),
        )

        setCart({
            items: filteredItems,
        })
    }

    const emptyCart = () => {
        setCart({
            items: [],
        })
    }

    const getItems = (): CartItem[] => {
        return cart?.items || []
    }

    const isInCart = (itemToCheck: CartItem): boolean => {
        return (
            cart?.items.some(
                item =>
                    item.id === itemToCheck.id &&
                    item.type === itemToCheck.type,
            ) || false
        )
    }

    return {
        addItem,
        removeItem,
        emptyCart,
        getItems,
        isInCart,
    }
}
