import React from 'react'
import { SectionTitle } from '../Texts'
import HomeLayout from './HomeLayout'

const Title = () => {
    return (
        <div className='flex justify-start items-center'>
            <SectionTitle className='text-black text-center'>
                What they say about&nbsp;me
            </SectionTitle>
        </div>
    )
}

const Card = () => {
    return (
        <div className='w-[300px] xxs:w-[400px] lg:w-[30%] xl:w-full h-[150px] flex items-center justify-center bg-purple-light'></div>
    )
}

const Grid = () => {
    return (
        <div className='@container w-full grid grid-cols-1 xl:grid-cols-3 gap-8 place-items-center'>
            <div className='w-full flex flex-col lg:flex-row gap-8 xl:flex-col justify-center items-center'>
                <Card />
                <Card />
            </div>
            <div className='w-full flex flex-col lg:flex-row gap-8 xl:flex-col justify-center items-center'>
                <Card />
                <Card />
                <Card />
            </div>
            <div className='w-full flex flex-col lg:flex-row gap-8 xl:flex-col justify-center items-center'>
                <Card />
                <Card />
            </div>
        </div>
    )
}

const Recos = () => {
    return (
        <HomeLayout className='bg-white flex flex-col justify-start items-center gap-20 max-w-[100vw]'>
            <Title />
            <Grid />
        </HomeLayout>
    )
}

export default Recos
