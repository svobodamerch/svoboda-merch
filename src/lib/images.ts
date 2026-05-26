/** Проверенные Unsplash ID — единый формат URL для Next/Image */
export function unsplash(id: string, width = 800): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}

export const images = {
  hero: unsplash("1558769132-cb1aea3c8e27", 1200),
  team: unsplash("1522071820081-009f0129c71c", 1200),
  hoodie: unsplash("1556821840-3a63f95609a7", 900),
  tee: unsplash("1521572163474-6864f9cf17ab", 800),
  fashion: unsplash("1503342217505-b0a15ec3261c", 900),
  coffee: unsplash("1495474472287-4d71bcdd2085", 900),
  office: unsplash("1497366216548-37526070297c", 900),
  event: unsplash("1540575467063-178a50c2df87", 900),
  sweater: unsplash("1576566588028-4147f3842f27", 800),
  tote: unsplash("1590874103328-eac38a683ce7", 800),
  cap: unsplash("1588850561407-ed78c282e89b", 800),
  bag: unsplash("1548036328-c9fa89d12836", 800),
  knit: unsplash("1434389677669-e08b4cac3105", 800),
  gifts: unsplash("1549465220-1a8b9238cd48", 900),
  studio: unsplash("1558769132-cb1aea3c8e27", 1000),
  print: unsplash("1576566588028-4147f3842f27", 800),
  embroidery: unsplash("1556821840-3a63f95609a7", 800),
  custom: unsplash("1503342217505-b0a15ec3261c", 800),
  packaging: unsplash("1549465220-1a8b9238cd48", 800),
} as const;
