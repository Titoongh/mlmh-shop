// Renders a schema.org JSON-LD block. Server component (no client JS shipped).
// `<` is escaped to < so the payload can never break out of the <script> tag.
export default function JsonLd({ data }: { data: object | object[] }) {
    const json = JSON.stringify(data).replace(/</g, '\\u003c')
    return (
        <script
            type='application/ld+json'
            dangerouslySetInnerHTML={{ __html: json }}
        />
    )
}
