'use client'
import Product from '@/app/components/Product'
import React from 'react'

interface ProductParams {
    id: string
}

const ProductPage = ({ params }: { params: ProductParams }) => {
    const { id } = params
    return <Product id={id} />
}

export default ProductPage
