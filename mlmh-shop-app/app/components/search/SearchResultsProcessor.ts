import { ArtistWithTablaturesAndContents } from '../../types/types'

export interface FuseOptions {
    keys: string[]
    threshold: number
}

export interface ProcessedSearchData {
    tablatureSearchData: ArtistWithTablaturesAndContents[]
    fuseArtistOptions: FuseOptions
    fuseTablatureOptions: FuseOptions
}

export class SearchResultsProcessor {
    private initialData: ArtistWithTablaturesAndContents[]
    private tablatureSearchData: ArtistWithTablaturesAndContents[]

    constructor(initialData: ArtistWithTablaturesAndContents[]) {
        this.initialData = initialData
        this.tablatureSearchData = this.processTablatures()
    }

    private processTablatures(): ArtistWithTablaturesAndContents[] {
        return this.initialData.flatMap(
            (artist: ArtistWithTablaturesAndContents) => {
                return artist.tablatures.map(tablature => {
                    return {
                        ...artist,
                        tablatures: [tablature],
                    }
                })
            },
        )
    }

    public getProcessedData(): ProcessedSearchData {
        const fuseArtistOptions: FuseOptions = {
            keys: ['name'],
            threshold: 0.4,
        }

        const fuseTablatureOptions: FuseOptions = {
            keys: ['tablatures.title'],
            threshold: 0.4,
        }

        return {
            tablatureSearchData: this.tablatureSearchData,
            fuseArtistOptions,
            fuseTablatureOptions,
        }
    }

    public getArtistData(): ArtistWithTablaturesAndContents[] {
        return this.initialData
    }

    public getTablatureData(): ArtistWithTablaturesAndContents[] {
        return this.tablatureSearchData
    }
}
