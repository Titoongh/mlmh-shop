'use client'
import Product from '@/app/components/Product'
import React from 'react'

interface ProductParams {
    id: string
}

const ProductPage = ({ params }: { params: ProductParams }) => {
    const { id } = params
    React.useEffect(() => {
        // Use the id to fetch product data
        console.log(`Fetching product with id: ${id}`)
        // Add your fetch logic here
    }, [id])

    return <Product />
}

export default ProductPage
