/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable indent */

/** *** VARIABLES GLOBALES *****/
let ingrDB;
let calDB;
const uniqueElems = {
  totalIngr: "total-ingredients",
  totalCaloriesElement: "total-calories",
  recipeElement: "recipe",
  resultsElement: "results",
  searchElement: "searched-txt",
  calInput: "calories-input",
  calInputError: "calories-input-error",
  resultCount: "result-count",
  partCount: "nb-parts",
  calPerPart: "calories-per-part",
};

/** *** READ BDD *****/
window.addEventListener("load", () => {
  let parser = new DOMParser();
  ingrDB = parser.parseFromString(alimStringDB, "text/xml");
  document.getElementById(uniqueElems.totalIngr).textContent = getTotalIngr().numberValue;

  calDB = parser.parseFromString(compoStringDB, "text/xml");
});

/** *** LOGIQUE *****/
/**
 * Rechercher des ingredients dans la BDD et les afficher
 */
function searchIngr() {
  const searchTxt = document.getElementById(uniqueElems.searchElement).value;
  const keywords = /\s/.test(searchTxt) ? searchTxt.split(" ") : [searchTxt];
  const resultsList = isIngrContains(keywords[0]);
  const resultsElem = document.getElementById(uniqueElems.resultsElement);
  const nbResultsUnfiltered = resultsList.snapshotLength;
  let nbResultsFiltered = 0;

  // Remise a zero de la liste de resultats, actualisation du nombre de resultats
  resultsElem.replaceChildren();

  if (nbResultsUnfiltered === 0) {
    resultsElem.appendChild(createNoElemRow(3));
  } else {
    for (let i = 0, l = nbResultsUnfiltered; i < l; i++) {
      let currentIngrName;
      let currentIngrCal;

      resultsList.snapshotItem(i).childNodes.forEach((ingrNode) => {
        switch (ingrNode.nodeName) {
          case "alim_nom_fr":
            currentIngrName = capitalizeFirstLetter(ingrNode.textContent.trim());
            break;

          case "alim_code":
            currentIngrCal = getTeneurForIngr(ingrNode.textContent);
            break;
        }
      });

      // Tri sur les autres mots cles
      if (keywords.length > 1) {
        let keywordNotFound = false;
        for (let j = 1, nbKeyWords = keywords.length; j < nbKeyWords; j++) {
          if (!currentIngrName.includes(keywords[j])) keywordNotFound = true;
        }
        if (keywordNotFound) continue;
      }

      // Non affichage des ingredients sans calories renseignees
      if (!currentIngrCal) {
        continue;
      }
      nbResultsFiltered++;

      const tr = document.createElement("tr");
      createTextTd(currentIngrName, tr);
      createTextTd(currentIngrCal, tr);

      const buttonTd = document.createElement("td");
      const button = document.createElement("button");
      button.setAttribute("type", "button");
      button.classList.add("button-primary");
      button.appendChild(document.createTextNode("Ajouter"));
      // eslint-disable-next-line space-before-function-paren
      button.addEventListener("click", function () {
        addIngr(currentIngrName, currentIngrCal);
      });
      buttonTd.appendChild(button);
      tr.appendChild(buttonTd);

      resultsElem.appendChild(tr);
    }
    document.getElementById(uniqueElems.resultCount).textContent = nbResultsFiltered;
  }
}
/**
 * Ajoute un ingredient custom en recuperant le contenu des champs
 */
function addCustomIngr() {
  const customNameInput = document.getElementById(uniqueElems.searchElement);
  const customCalInput = document.getElementById(uniqueElems.calInput);
  const customName = document.getElementById(uniqueElems.searchElement).value;
  const customCal = document.getElementById(uniqueElems.calInput).value;

  if (customName && customCal) {
    addIngr(customName, customCal);
    customNameInput.removeAttribute("aria-invalid");
    customCalInput.removeAttribute("aria-invalid");
    customNameInput.classList.remove("invalid");
    customCalInput.classList.remove("invalid");
    document.getElementById(uniqueElems.calInputError).classList.add("hidden");
  } else {
    customNameInput.setAttribute("aria-invalid", true);
    customCalInput.setAttribute("aria-invalid", true);
    customNameInput.classList.add("invalid");
    customCalInput.classList.add("invalid");
    document.getElementById(uniqueElems.calInputError).classList.remove("hidden");
  }
}

/**
 * Ajout d'un ingredient a la liste d'une recette
 * @param {string} name - Nom de l'ingredient
 * @param {number} cal - Calories de l'ingredient
 */
function addIngr(name, cal) {
  const tr = document.createElement("tr");
  createTextTd(name, tr);
  createTextTd(cal, tr);

  const qtyTd = document.createElement("td");
  const input = document.createElement("input");
  input.setAttribute("type", "number");
  input.setAttribute("step", "1");
  input.value = 0;
  input.addEventListener("input", onchangeQuantity);
  qtyTd.appendChild(input);
  tr.appendChild(qtyTd);

  const buttonTd = document.createElement("td");
  const button = document.createElement("button");
  button.setAttribute("type", "button");
  button.classList.add("button-accent");
  button.appendChild(document.createTextNode("Supprimer"));
  button.addEventListener("click", removeIngr);
  buttonTd.appendChild(button);
  tr.appendChild(buttonTd);

  // Suppression du message affiche quand un element est ajoute
  const recipeElement = document.getElementById(uniqueElems.recipeElement);
  if (recipeElement.getElementsByTagName("td")[0].hasAttribute("colspan")) {
    recipeElement.replaceChildren();
  }
  recipeElement.appendChild(tr);
}

/**
 * Calcul des calories a chaque changement de quantite
 */
function onchangeQuantity() {
  const trList = document.getElementById(uniqueElems.recipeElement).getElementsByTagName("tr");
  const nbPart = document.getElementById(uniqueElems.partCount).value;
  let totalCalCount = 0;

  // passage sur tous les rangs du tableau et produit en croix
  for (let i = 0, l = trList.length; i < l; i++) {
    const ingrRow = trList[i];
    cal = parseInt(ingrRow.getElementsByTagName("td")[1].textContent);
    qty = ingrRow.getElementsByTagName("input")[0].valueAsNumber;

    totalCalCount += (qty * cal) / 100;
  }

  document.getElementById(uniqueElems.totalCaloriesElement).textContent = Math.floor(totalCalCount);
  document.getElementById(uniqueElems.calPerPart).textContent = Math.floor(totalCalCount / nbPart);
}

/**
 * Supprime un ingredient de la recette
 * @param {Event} e - Bouton qui a declenche l'event
 */
function removeIngr(e) {
  e.target.closest("tr").remove();
  onchangeQuantity();
  // S'il n'y a plus d'ingrédients dans la recette, message de 0 élément
  if (document.getElementById(uniqueElems.recipeElement).getElementsByTagName("tr").length === 0) {
    document.getElementById(uniqueElems.recipeElement).appendChild(createNoElemRow(4));
  }
}

/** *** FONCTIONS PRIVEES *****/
/**
 * Cree une case de tableau contenant du texte et l'insere dans un rang
 * @param {string} text - Texte a inserer dans la case du tableau
 * @param {HTMLElement} tr - Rang dans lequel inserer la case
 */
function createTextTd(text, tr) {
  const td = document.createElement("td");
  td.appendChild(document.createTextNode(text));
  tr.appendChild(td);
}

/**
 * Cree une ligne de tableau indiquant l'absence d'éléments
 * @param {number} colCount - Nombre de colonnes du tableau
 * @return {HTMLTableRowElement} - Ligne de tableau
 */
function createNoElemRow(colCount) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.setAttribute("colspan", colCount);
  td.textContent = "Aucun élément à afficher";
  tr.appendChild(td);
  return tr;
}

const capitalizeFirstLetter = ([first, ...rest], locale = navigator.language) =>
  first.toLocaleUpperCase(locale) + rest.join("");

/** *** BDD REQUESTS *****/
/**
 * Retourne le nombre d'aliments en base
 * @return {XPathResult}
 */
function getTotalIngr() {
  return ingrDB.evaluate("count(//alim)", ingrDB, null, XPathResult.ANY_TYPE, null);
}

/**
 * Tous les aliments dont le nom contient txt
 * @param {string} txt - Texte a rechercher
 * @return {XPathResult}
 */
function isIngrContains(txt) {
  return ingrDB.evaluate(
    "//alim[alim_nom_fr[contains(text(),'" + txt.trim().toLowerCase() + "')]]",
    ingrDB,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null,
  );
}

/**
 * Chercher le nombre de calories pour un code d'aliment
 * @param {number} code - Code de l'aliment a rechercher
 * @return {XPathResult}
 */
function getTeneurForIngr(code) {
  return calDB
    .evaluate("//COMPO[alim_code[text()='" + code + "']]/teneur", calDB, null, XPathResult.STRING_TYPE, null)
    .stringValue.trim();
}
