'use client'
import React, { useState } from 'react'
import { SectionTitle } from '../Texts'
import HomeLayout from './HomeLayout'
import Image, { StaticImageData } from 'next/image'
import Stars from '../Stars'
import TraumIcon from '../../assets/traum.jpeg'
import GrossmanIcon from '../../assets/Grossman.jpeg'
import EBAIcon from '../../assets/eba.jpeg'

const Title = () => {
    return (
        <div className='flex justify-start items-center'>
            <SectionTitle className='text-black text-center'>
                What they say about&nbsp;me
            </SectionTitle>
        </div>
    )
}

type CardProps = {
    bgColor?: string
    bgColorIcon?: string
    img?: StaticImageData | string
    title?: string
    subtitle?: string
    children: React.ReactNode
}

const Card = (props: CardProps) => {
    const bgColor = props.bgColor || 'bg-white-oldlace'
    const bgColorIcon = props.bgColorIcon || 'bg-orange-khaki'
    const subtitle = props.subtitle || 'France'
    const title = props.title || 'Jean Dupont'

    return (
        <div
            className={`w-[80vw] min-w-[300px] max-w-[600px] xl:w-full min-h-[150px] mb-4 rounded-base border-2 border-black p-5 shadow-base lg:mb-8 ${bgColor}`}
        >
            <div className='flex items-center gap-5'>
                <div className='relative h-12 min-w-12 border-2 border-black'>
                    {props.img ? (
                        <Image
                            src={props.img}
                            alt='recommendation image'
                            fill={true}
                        />
                    ) : (
                        <div
                            className={`${bgColorIcon} font-bold text-[1.5rem] w-full h-full flex justify-center items-center`}
                        >
                            {title[0]}
                        </div>
                    )}
                </div>
                <div>
                    <h4 className='text-lg font-bold'>{title}</h4>
                    <p className='text-sm'>{subtitle}</p>
                </div>
            </div>
            <div className='mt-4 break-words flex flex-col gap-4'>
                {props.children}
            </div>
        </div>
    )
}

const Content = (props: { children: React.ReactNode; initOpen?: boolean }) => {
    const [clamp, setClamp] = useState<boolean>(props.initOpen ? false : true)

    return (
        <div className='w-full'>
            <p
                onClick={() => setClamp(!clamp)}
                style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    WebkitLineClamp: clamp ? 2 : 'unset',
                    cursor: 'pointer',
                }}
            >
                {props.children}
            </p>
        </div>
    )
}

const Grid = () => {
    return (
        <div className='@container w-full grid grid-cols-1 xl:grid-cols-3 gap-8 place-items-center'>
            <div className='w-full flex flex-col gap-8 justify-center items-center'>
                <Card
                    bgColor='bg-purple-light'
                    title='European Blues Association'
                    subtitle='England'
                    img={EBAIcon}
                >
                    <Content>
                        Michel Lelong from Tours, France, is a great guitarist
                        and a highly skilled teacher.
                    </Content>
                </Card>

                <Card title='Julien' subtitle="Michel's student">
                    <Content initOpen={true}>
                        Maître du fingerpicking, Michel n'en reste pas moins un
                        excellent professeur (tous styles confondus), au savoir
                        musical immense et très pédagogue avec ses élèves. Il
                        possède une incroyable quantité de supports (pdf +
                        vidéos Youtube privées) qui viennent parfaitement
                        compléter les cours et vous aideront à travailler
                        efficacement entre deux séances. <br />
                        Une véritable chance d'avoir quelqu'un comme lui dans
                        notre région !
                    </Content>
                </Card>
            </div>
            <div className='w-full flex flex-col gap-8 justify-center items-center'>
                <Card
                    bgColor='bg-purple-light'
                    title='Stefan Grossman'
                    subtitle='Guitar Workshop - USA'
                    img={GrossmanIcon}
                >
                    <Content>
                        Since the beginning of the guitar workshop, I was
                        searched for a musician/teacher who could play as well
                        as explain Merle Travis’s Music. Finally the chemistry
                        came with Michel
                    </Content>
                </Card>
                <Card title='5 stars rating ' subtitle='On Google'>
                    <Content>Based on more than 100 reviews.</Content>
                    <Stars />
                </Card>
                <Card title='Franck M.' subtitle="Michel's student">
                    <Content>
                        De la guitare au ukulele, je fréquente les cours de
                        Michel depuis de nombreuses années maintenant.
                        Passionné, bienveillant Michel transmet les bons outils
                        afin que chacun prenne énormément de plaisir à
                        pratiquer, le tout avec beaucoup de pédagogie. Il fait
                        parti de cette rare catégorie de musiciens qui savent
                        vraiment "enseigner", s'adapter aux besoins des élèves,
                        à leur rythme et chaque cours vient avec son lot de
                        découvertes musicales.
                    </Content>
                </Card>
            </div>
            <div className='w-full flex flex-col gap-8 justify-center items-center'>
                <Card
                    bgColor='bg-purple-light'
                    title='Happy Traum'
                    subtitle='Musocian, pedagog and director of Homepsun Tapes – USA'
                    img={TraumIcon}
                >
                    <Content>
                        The excellent french guitarist Michel Lelong has created
                        a serie of six lessons focusing on many Chet Atkins’s
                        most interesting and challenging solos.
                    </Content>
                </Card>
                <Card title='Dominique S.' subtitle="Michel's student">
                    <Content>
                        Un des meilleurs spécialistes en France du blues
                        acoustique. Mais qui reste ouvert à bien d'autres
                        musiques. Un passionné du son authentique et de l'esprit
                        du blues. Excellent pédagogue multi-instrumentiste, qui
                        fait partager en toute simplicité et son art et sa
                        grande culture musicale.
                    </Content>
                </Card>
            </div>
        </div>
    )
}

const Recos = () => {
    return (
        <HomeLayout
            className='
        flex flex-col justify-start items-center gap-20 max-w-[100vw]
        bg-white bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:70px_70px]
        '
        >
            <Title />
            <Grid />
        </HomeLayout>
    )
}

export default Recos
