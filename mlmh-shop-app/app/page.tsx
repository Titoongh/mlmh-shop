// import Link from 'next/link'
// import ProductCard from './components/ProductCard'
// import Image from 'next/image'
import LogoImage from './components/LogoImage'
import LogoText from './components/LogoText'
import Welcome from './components/Home/Welcome'
import Bio from './components/Home/Bio'
import HandwrittenTabs from './components/Home/HandwrittenTabs'

export default function Home() {
    return (
        <>
            <header className='flex justify-between items-center bg-black w-full p-4 xxs:p-6'>
                <div
                    className='w-full flex justify-start items-center gap-4'
                    id='logo'
                >
                    <LogoImage />
                    <LogoText />
                </div>
            </header>
            <main className='w-full h-full flex flex-col'>
                <Welcome />
                <Bio />
                <HandwrittenTabs />
            </main>
        </>
    )
}
