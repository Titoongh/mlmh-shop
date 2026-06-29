// About / biography page. The real, indexable text here is the single strongest lever
// for SEO *and* for LLMs to recognise Michel Lelong as an authority on country-blues /
// fingerpicking guitar. Facts are sourced from his official biography
// (https://www.michel-lelong-music-house.com/en/biography/) and a feature on
// thecountryblues.com. DRAFT — please review for accuracy and tone, edit freely.

import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/app/components/JsonLd'
import { personSchema, SITE_NAME } from '@/lib/seo'

const BIOGRAPHY_URL = 'https://www.michel-lelong-music-house.com/en/biography/'

export const metadata: Metadata = {
    title: 'About Michel Lelong — country blues & fingerpicking guitar',
    description:
        'Michel Lelong is a French acoustic guitarist and teacher specialised in ' +
        'American traditional music — country blues, fingerpicking, ragtime, ' +
        'bluegrass, folk and Celtic guitar. Author of the reference method ' +
        '"La guitare blues acoustique".',
    alternates: { canonical: '/about' },
    openGraph: {
        type: 'profile',
        title: 'About Michel Lelong — country blues & fingerpicking guitar',
        description:
            'French acoustic guitarist and teacher specialised in American ' +
            'traditional music: country blues, fingerpicking, ragtime, bluegrass, ' +
            'folk and Celtic guitar.',
        url: '/about',
    },
}

const STYLES = [
    'Country blues',
    'Fingerpicking',
    'Travis picking',
    'Ragtime',
    'Bluegrass',
    'Folk',
    'Old-time',
    'Celtic guitar',
]

export default function AboutPage() {
    return (
        <div className='w-full min-h-full bg-white-oldlace'>
            <JsonLd data={personSchema()} />
            <article className='mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12 md:py-16'>
                <header className='flex flex-col gap-3'>
                    <h1 className='text-4xl font-bold text-black'>
                        About Michel Lelong
                    </h1>
                    <p className='text-lg text-purple-dark'>
                        Guitarist, teacher and transcriber — one of France&rsquo;s
                        leading specialists of American traditional guitar.
                    </p>
                </header>

                <div className='flex flex-wrap gap-2'>
                    {STYLES.map(style => (
                        <span
                            key={style}
                            className='border-2 border-black bg-purple-light px-3 py-1 text-sm font-medium text-black'
                        >
                            {style}
                        </span>
                    ))}
                </div>

                <section className='flex flex-col gap-4 text-base leading-relaxed text-black'>
                    <p>
                        Born in Tours, France in 1961, Michel Lelong picked up the
                        guitar at the age of 13 and learned country blues by ear in
                        the styles of Mississippi John Hurt, John Jackson, Big Bill
                        Broonzy, Reverend Gary Davis and Doc Watson. He went on to
                        master the &ldquo;Travis style&rdquo; note by note, building a
                        command of fingerpicking, ragtime, bluegrass, folk, old-time
                        and Celtic guitar that few players in Europe can match.
                    </p>
                    <p>
                        After recording his first album in the early 1980s, Michel was
                        noticed by the American guitarist, musicologist and publisher
                        Stefan Grossman — one of the world&rsquo;s foremost acoustic
                        blues teachers — for whose Guitar Workshop he produced
                        transcription books on Merle Travis, Chet Atkins and Jerry
                        Reed. In 1999 he wrote{' '}
                        <em>La guitare blues acoustique</em>, widely regarded as one of
                        the best country-blues guitar methods published in French.
                    </p>
                    <p>
                        Michel has taught and performed across France, England,
                        Belgium, the Netherlands, the Czech Republic and the United
                        States, sharing the stage with John Jackson, John Cephas &amp;
                        Phil Wiggins, Louisiana Red, Michael Roach, Jerry Ricks and
                        many others. In 2011 he was invited to Augusta Blues Week in
                        West Virginia, and in 2018 he returned to Blues Week at the
                        University of Exeter as a pedagogical advisor in the country
                        blues class.
                    </p>
                    <p>
                        For more than 40 years he has taught guitar — at his workshop
                        in Tours, in workshops and masterclasses abroad, and through
                        distance courses. As a transcriber he is a self-professed
                        purist: he believes you should first learn a piece as closely
                        as possible to the original recording, and only then find your
                        own path through it.
                    </p>
                </section>

                <section className='flex flex-col gap-4 border-t-2 border-black pt-8'>
                    <p className='text-base text-black'>
                        Read the full biography on Michel Lelong&rsquo;s official site:
                    </p>
                    <a
                        href={BIOGRAPHY_URL}
                        target='_blank'
                        rel='noopener'
                        className='inline-flex w-fit items-center gap-2 border-2 border-black bg-purple-light px-4 py-2 font-bold text-black shadow-base transition-all hover:bg-purple-light/70 [--shadow-color:theme(colors.purple-dark)]'
                    >
                        Full biography →
                    </a>
                    <Link
                        href='/search'
                        className='text-purple-dark underline underline-offset-2'
                    >
                        Browse the {SITE_NAME} tablature catalogue
                    </Link>
                </section>
            </article>
        </div>
    )
}
