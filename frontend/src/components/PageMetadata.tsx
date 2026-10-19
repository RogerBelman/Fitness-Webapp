import { useEffect } from 'react'

type PageMetadataProps = {
  title: string
  description: string
  canonicalPath?: string
  robots?: string
}

const SITE_URL = 'https://workouts.rogerbelman.com'

export function PageMetadata({
  title,
  description,
  canonicalPath,
  robots = 'noindex, nofollow',
}: PageMetadataProps) {
  useEffect(() => {
    document.title = title
    setMeta('description', description)
    setMeta('robots', robots)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    if (canonicalPath) {
      setMeta('og:url', `${SITE_URL}${canonicalPath}`, 'property')
      setLink('canonical', `${SITE_URL}${canonicalPath}`)
    } else {
      document.head.querySelector('meta[property="og:url"]')?.remove()
      document.head.querySelector('link[rel="canonical"]')?.remove()
    }
  }, [canonicalPath, description, robots, title])

  return null
}

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.append(element)
  }
  element.content = content
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.append(element)
  }
  element.href = href
}
