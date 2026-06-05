import { useEffect } from "react";

type SEOProps = {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

const BASE_URL = "https://forza.zik-music.fr";
const SITE_NAME = "FH6 Tracker";
const DEFAULT_DESC = "Suis ta progression dans Forza Horizon 6, gère ton garage avec 600+ voitures, rejoins les events, partage tes builds et participe aux défis hebdomadaires.";

export function useSEO({ title, description, ogTitle, ogDescription, canonical }: SEOProps) {
  useEffect(() => {
    const fullTitle = `${title} — ${SITE_NAME}`;
    const desc = description ?? DEFAULT_DESC;
    const ogT = ogTitle ?? fullTitle;
    const ogD = ogDescription ?? desc;

    document.title = fullTitle;
    setMeta("description", desc);
    setMeta("og:title", ogT, "property");
    setMeta("og:description", ogD, "property");
    setMeta("twitter:title", ogT);
    setMeta("twitter:description", ogD);
    if (canonical) setCanonical(`${BASE_URL}${canonical}`);
  }, [title, description, ogTitle, ogDescription, canonical]);
}
