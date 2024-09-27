// import Link from 'next/link'
// import ProductCard from './components/ProductCard'
// import Image from 'next/image'
import Welcome from './components/Home/Welcome'
import Bio from './components/Home/Bio'
import HandwrittenTabs from './components/Home/HandwrittenTabs'
import Recos from './components/Home/Recos'
import Header from './components/Header'
import Footer from './components/Footer'

export default function Home() {
    return (
        <>
            <Header />
            <main className='w-full h-full flex flex-col'>
                <Welcome />
                <Bio />
                <HandwrittenTabs />
                <Recos />
            </main>
            <Footer />
        </>
    )
}
