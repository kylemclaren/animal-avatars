import { useCallback, useState } from "react"
import type { AnimalAvatarType } from "cute-avatars"

import { Api } from "@/components/site/api"
import { Footer } from "@/components/site/footer"
import { Gallery } from "@/components/site/gallery"
import { Hero } from "@/components/site/hero"
import { InContext } from "@/components/site/in-context"
import { Nav } from "@/components/site/nav"
import { Playground } from "@/components/site/playground"
import { initialValues, withType, type Values } from "@/lib/playground"

export function App() {
  const [values, setValues] = useState<Values>(() => initialValues())

  /* the gallery hands an animal to the playground and takes you there */
  const tryAnimal = useCallback((type: AnimalAvatarType) => {
    setValues((v) => withType(v, type))
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    document
      .getElementById("playground")
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  }, [])

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Playground values={values} setValues={setValues} />
        <Gallery selected={values.type} onPick={tryAnimal} />
        <InContext />
        <Api />
      </main>
      <Footer />
    </>
  )
}

export default App
