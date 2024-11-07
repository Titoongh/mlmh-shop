'use client'
import React from 'react'

interface ProductParams {
    id: string
}

const Product = ({ params }: { params: ProductParams }) => {
    const { id } = params
    React.useEffect(() => {
        // Use the id to fetch product data
        console.log(`Fetching product with id: ${id}`)
        // Add your fetch logic here
    }, [id])

    return <div>Product ID: {id}</div>
}

export default Product
