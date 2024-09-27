import React from 'react'
import LogoImage from './LogoImage'
import LogoText from './LogoText'

const Header = () => {
    return (
        <header className='flex justify-between items-center bg-black w-full p-4 xxs:p-6'>
            <div
                className='w-full flex justify-start items-center gap-4'
                id='logo'
            >
                <LogoImage />
                <LogoText />
            </div>
        </header>
    )
}

export default Header
