// Transforme les images seules dans un paragraphe Markdown en figures :
//   ![texte alternatif](/histoire/photo.jpg#droite "Légende")
// - le titre entre guillemets devient la légende ;
// - #gauche ou #droite place l'image à gauche ou à droite du texte
//   (centrée sinon).
// Les liens vers d'autres sites s'ouvrent dans un nouvel onglet.

const ALIGN = { gauche: 'left', droite: 'right' };

const isBlank = (node) => node.type === 'text' && node.value.trim() === '';
const isImage = (node) => node.type === 'element' && node.tagName === 'img';

function toFigure(img) {
  const src = String(img.properties.src ?? '');
  const [path, hash] = src.split('#');
  const align = ALIGN[hash] ?? 'center';
  const caption = img.properties.title;
  const image = { ...img, properties: { ...img.properties, src: path, title: undefined, loading: 'lazy' } };
  const children = [image];
  if (caption) children.push({ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] });
  return { type: 'element', tagName: 'figure', properties: { dataAlign: align }, children };
}

function walk(node) {
  if (node.type === 'element' && node.tagName === 'a' && /^https?:/.test(String(node.properties.href))) {
    node.properties.target = '_blank';
    node.properties.rel = 'noopener';
  }
  if (!node.children) return;
  node.children = node.children.flatMap((child) => {
    if (child.type === 'element' && child.tagName === 'p') {
      const content = child.children.filter((c) => !isBlank(c));
      if (content.length && content.every(isImage)) return content.map(toFigure);
    }
    walk(child);
    return [child];
  });
}

export default function rehypeFigures() {
  return (tree) => walk(tree);
}
