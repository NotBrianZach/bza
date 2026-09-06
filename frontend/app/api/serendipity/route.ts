import { NextRequest, NextResponse } from 'next/server'

interface SerendipityCard {
  url: string
  title: string
  caption: string | null
  sourceLabel: string
}

async function fetchCard(source: string): Promise<SerendipityCard> {
  switch (source) {
    case 'dog': {
      const res = await fetch('https://dog.ceo/api/breeds/image/random')
      const data = await res.json() as { message: string }
      return { url: data.message, title: 'Good boy', caption: null, sourceLabel: '🐶 dog.ceo' }
    }
    case 'cat': {
      const res = await fetch('https://api.thecatapi.com/v1/images/search')
      const [img] = await res.json() as { url: string }[]
      return { url: img.url, title: 'Meow', caption: null, sourceLabel: '🐱 thecatapi.com' }
    }
    case 'fox': {
      const res = await fetch('https://randomfox.ca/floof/')
      const data = await res.json() as { image: string }
      return { url: data.image, title: 'A wild fox appeared', caption: null, sourceLabel: '🦊 randomfox.ca' }
    }
    case 'shibe': {
      const res = await fetch('https://shibe.online/api/shibes?count=1')
      const [url] = await res.json() as string[]
      return { url, title: 'Much wow', caption: 'Very reading. So knowledge. Wow.', sourceLabel: '🐕 shibe.online' }
    }
    case 'nasa_apod': {
      // Random date between first APOD (1995-06-16) and today
      const start = new Date('1995-06-16').getTime()
      const end = Date.now()
      const randomDate = new Date(start + Math.random() * (end - start))
      const dateStr = randomDate.toISOString().slice(0, 10)
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${dateStr}`)
      const data = await res.json() as { url: string; title: string; explanation: string; media_type: string }
      if (data.media_type !== 'image') return fetchCard('dog') // video APOD — fall back
      return {
        url: data.url,
        title: data.title,
        caption: data.explanation ? data.explanation.slice(0, 280) + (data.explanation.length > 280 ? '…' : '') : null,
        sourceLabel: '🔭 NASA APOD',
      }
    }
    case 'mars': {
      const res = await fetch('https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=DEMO_KEY')
      const data = await res.json() as { latest_photos: { img_src: string; sol: number; earth_date: string; camera: { full_name: string } }[] }
      const photos = data.latest_photos ?? []
      if (photos.length === 0) return fetchCard('dog')
      const photo = photos[Math.floor(Math.random() * Math.min(photos.length, 25))]
      return {
        url: photo.img_src,
        title: `Mars — Sol ${photo.sol}`,
        caption: `${photo.camera.full_name} · ${photo.earth_date}`,
        sourceLabel: '🔴 NASA Mars Rover',
      }
    }
    case 'xkcd': {
      const currentRes = await fetch('https://xkcd.com/info.0.json')
      const current = await currentRes.json() as { num: number }
      const num = Math.floor(Math.random() * (current.num - 1)) + 1
      const res = await fetch(`https://xkcd.com/${num}/info.0.json`)
      const data = await res.json() as { img: string; title: string; alt: string; num: number }
      return { url: data.img, title: `#${data.num}: ${data.title}`, caption: data.alt, sourceLabel: '🤓 xkcd' }
    }
    case 'art': {
      const page = Math.floor(Math.random() * 500) + 1
      const res = await fetch(
        `https://api.artic.edu/api/v1/artworks?limit=10&fields=id,title,image_id,artist_display&page=${page}`
      )
      const data = await res.json() as { data: { title: string; image_id: string; artist_display: string }[] }
      const artworks = (data.data ?? []).filter(a => a.image_id)
      if (artworks.length === 0) return fetchCard('dog')
      const art = artworks[Math.floor(Math.random() * artworks.length)]
      return {
        url: `https://www.artic.edu/iiif/2/${art.image_id}/full/843,/0/default.jpg`,
        title: art.title,
        caption: art.artist_display ?? null,
        sourceLabel: '🎨 Art Institute of Chicago',
      }
    }
    case 'dilbert': {
      // Random date between first strip (1989-04-16) and last before shutdown (2023-02-25)
      const start = new Date('1989-04-16').getTime()
      const end = new Date('2023-02-25').getTime()
      const d = new Date(start + Math.random() * (end - start))
      const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
      const res = await fetch(`https://www.gocomics.com/dilbert/${dateStr}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bza/1.0; +https://aireadalong.com)' },
      })
      if (!res.ok) return fetchCard('xkcd')
      const html = await res.text()
      const imgUrl = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ??
                     html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1]
      if (!imgUrl) return fetchCard('xkcd')
      return { url: imgUrl, title: `Dilbert — ${dateStr.replace(/\//g, '-')}`, caption: null, sourceLabel: '👔 GoComics / Dilbert' }
    }
    case 'smbc': {
      const res = await fetch('https://www.smbc-comics.com/comic/rss', {
        headers: { 'User-Agent': 'bza/1.0 (aireadalong.com)' },
      })
      const xml = await res.text()
      // Each item's description contains an <img> tag with the comic image
      const descriptions = [...xml.matchAll(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/gi)]
      const titles = [...xml.matchAll(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/gi)]
      const imgUrls = descriptions
        .map(m => m[1].match(/src="(https:\/\/www\.smbc-comics\.com\/comics\/[^"]+)"/)?.[1] ?? null)
        .filter((u): u is string => u !== null)
      if (imgUrls.length === 0) return fetchCard('dog')
      const idx = Math.floor(Math.random() * imgUrls.length)
      return {
        url: imgUrls[idx],
        title: titles[idx + 1]?.[ 1]?.trim() ?? '',  // skip feed title at index 0
        caption: null,
        sourceLabel: '😅 SMBC Comics',
      }
    }
    case 'bugs': {
      const page = Math.floor(Math.random() * 100) + 1
      const res = await fetch(
        `https://api.inaturalist.org/v1/observations?taxon_name=Insecta&quality_grade=research&photos=true&per_page=20&order_by=votes&page=${page}`,
        { headers: { 'User-Agent': 'bza/1.0 (aireadalong.com)' } }
      )
      const data = await res.json() as { results: { taxon?: { name: string; preferred_common_name?: string }; photos: { url: string }[]; place_guess?: string }[] }
      const obs = data.results.filter(r => r.photos.length > 0)
      if (obs.length === 0) return fetchCard('dog')
      const pick = obs[Math.floor(Math.random() * obs.length)]
      const url = pick.photos[0].url.replace('/square.', '/medium.')
      const name = pick.taxon?.preferred_common_name ?? pick.taxon?.name ?? 'Insect'
      return { url, title: name, caption: pick.place_guess ?? null, sourceLabel: '🪲 iNaturalist' }
    }
    case 'plants': {
      const page = Math.floor(Math.random() * 100) + 1
      const res = await fetch(
        `https://api.inaturalist.org/v1/observations?taxon_name=Plantae&quality_grade=research&photos=true&per_page=20&order_by=votes&page=${page}`,
        { headers: { 'User-Agent': 'bza/1.0 (aireadalong.com)' } }
      )
      const data = await res.json() as { results: { taxon?: { name: string; preferred_common_name?: string }; photos: { url: string }[]; place_guess?: string }[] }
      const obs = data.results.filter(r => r.photos.length > 0)
      if (obs.length === 0) return fetchCard('dog')
      const pick = obs[Math.floor(Math.random() * obs.length)]
      const url = pick.photos[0].url.replace('/square.', '/medium.')
      const name = pick.taxon?.preferred_common_name ?? pick.taxon?.name ?? 'Plant'
      return { url, title: name, caption: pick.place_guess ?? null, sourceLabel: '🌿 iNaturalist' }
    }
    case 'fungi': {
      const page = Math.floor(Math.random() * 50) + 1
      const res = await fetch(
        `https://api.inaturalist.org/v1/observations?taxon_name=Fungi&quality_grade=research&photos=true&per_page=20&order_by=votes&page=${page}`,
        { headers: { 'User-Agent': 'bza/1.0 (aireadalong.com)' } }
      )
      const data = await res.json() as { results: { taxon?: { name: string; preferred_common_name?: string }; photos: { url: string }[]; place_guess?: string }[] }
      const obs = data.results.filter(r => r.photos.length > 0)
      if (obs.length === 0) return fetchCard('dog')
      const pick = obs[Math.floor(Math.random() * obs.length)]
      const url = pick.photos[0].url.replace('/square.', '/medium.')
      const name = pick.taxon?.preferred_common_name ?? pick.taxon?.name ?? 'Fungus'
      return { url, title: name, caption: pick.place_guess ?? null, sourceLabel: '🍄 iNaturalist' }
    }
    case 'rocks': {
      const terms = ['mineral+crystal', 'gemstone+specimen', 'geode', 'amethyst', 'quartz+crystal', 'fluorite', 'malachite', 'pyrite']
      const term = terms[Math.floor(Math.random() * terms.length)]
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap+${term}&gsrlimit=30&prop=imageinfo&iiprop=url|extmetadata&iiextmetadatafilter=ImageDescription&format=json&formatversion=2`,
        { headers: { 'User-Agent': 'bza/1.0 (aireadalong.com)' } }
      )
      const data = await res.json() as { query?: { pages: { imageinfo?: { url: string; extmetadata?: { ImageDescription?: { value: string } } }[] }[] } }
      const pages = (data.query?.pages ?? []).filter((p: any) => p.imageinfo?.[0]?.url)
      if (pages.length === 0) return fetchCard('dog')
      const page = (pages as any[])[Math.floor(Math.random() * pages.length)]
      const info = page.imageinfo[0]
      const rawDesc = info.extmetadata?.ImageDescription?.value ?? ''
      const caption = rawDesc.replace(/<[^>]+>/g, '').slice(0, 200) || null
      return { url: info.url, title: term.replace(/\+/g, ' '), caption, sourceLabel: '🪨 Wikimedia Commons' }
    }
    default:
      return fetchCard('dog')
  }
}

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get('source') ?? 'dog'
  // Custom URL: source is a direct image URL
  if (source.startsWith('http')) {
    return NextResponse.json({ url: source, title: '', caption: null, sourceLabel: '🖼️ Custom' })
  }
  try {
    const card = await fetchCard(source)
    return NextResponse.json(card)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'fetch failed' }, { status: 500 })
  }
}
