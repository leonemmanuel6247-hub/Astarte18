export const MATIERES = {
  "mathématiques": ["math", "maths", "algèbre", "géométrie", "calcul", "dérivée", "intégrale", "équation", "fonction", "trigonométrie", "probabilité", "statistique", "merlin", "caiman", "cayman"],
  "physique": ["physique", "mécanique", "électricité", "optique", "thermodynamique", "pc", "force", "énergie"],
  "chimie": ["chimie", "réaction", "molécule", "atome", "acide", "base"],
  "français": ["français", "littérature", "grammaire", "orthographe"],
  "histoire": ["histoire", "géographie", "hg"],
  "anglais": ["anglais", "english"],
  "svt": ["svt", "biologie", "géologie", "sciences", "cellule"]
};

export const NIVEAUX = ["terminale", "première", "seconde", "bac", "tle", "1ère", "2nde", "collège", "lycée", "supérieur", "licence", "master"];

export const STOP_WORDS = ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "le", "la", "les", "un", "une", "des", "du", "de", "pour", "par", "sur", "dans", "avec", "sans", "ou", "et", "donc", "or", "ni", "car", "veux", "cherche", "moi", "toi", "est", "sont", "avoir", "être", "propose", "livre", "site", "conseil", "suggestion"];

export function rechercherDocuments(requete, bibliotheque) {
  if (!requete || !bibliotheque) return [];

  const requeteLower = requete.toLowerCase().trim();
  const motsRecherche = requeteLower
    .split(/\s+/)
    .filter(m => !STOP_WORDS.includes(m) && m.length > 1);

  const resultats = [];

  for (let doc of bibliotheque) {
    const titreLower = doc.titre.toLowerCase();
    if (titreLower === requeteLower) resultats.push({ ...doc, score: 10000 });
  }

  if (resultats.length === 0) {
    for (let doc of bibliotheque) {
      const titreLower = doc.titre.toLowerCase();
      if (titreLower.includes(requeteLower)) resultats.push({ ...doc, score: 5000 });
    }
  }

  if (resultats.length === 0 && motsRecherche.length > 0) {
    for (let doc of bibliotheque) {
      const titreLower = doc.titre.toLowerCase();
      const matchCount = motsRecherche.filter(m => titreLower.includes(m)).length;
      if (matchCount > 0) resultats.push({ ...doc, score: matchCount * 100 });
    }
  }

  return resultats.sort((a, b) => b.score - a.score).slice(0, 5);
}
