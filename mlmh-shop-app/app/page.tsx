// import Link from 'next/link'
// import ProductCard from './components/ProductCard'
// import Image from 'next/image'
import LogoImage from './components/LogoImage'
import LogoText from './components/LogoText'
import Welcome from './components/Home/Welcome'

export default function Home() {
    return (
        <>
        <header className='flex justify-between items-center bg-black w-full p-4'>
                <div className='flex justify-center items-center gap-4 pb-1 pt-1' id='logo'>
                    <LogoImage />
                    <LogoText/>
               </div>
        </header>
        <main className='w-full h-full flex flex-col'>
            <Welcome />
            {/* <h1>Hello Work</h1>
            <Link href='/users' className='border-2'>
                Users
            </Link>
            <ProductCard /> */}
        </main>
        </>
    )
}
