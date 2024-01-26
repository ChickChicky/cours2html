# Cours 2 HTML

Un petit projet visant à créer un site assez simple avec les cours.

# Quick Start

* Téléchargez le projet (`git clone git@github.com:ChickChicky/cours2html.git`) ou [depuis le site](https://github.com/ChickChicky/cours2html/).
* Installez une version récente de [Node.js](https://nodejs.org/)
* Ouvrez un terminal dans le dossier où le projet a été téléchargé et lancez `node processor.js` pour générer les pages à partir des cours

# Les cours

Les cours sont écrits dans un format XML qui permet de les structurer d'une manière plus flexible, les différentes parties des cours peuvent être placées dans différents dossiers et fichiers.

Seuls les fichiers dans le dossier *cours* seront pris en compte pour la génération des pages.

Toutes les parties d'un cours (matière , chapitre , partie) sont identifiées par un ID plus que leur hiérarchie, ce qui permet de les agencer de manière plus libre. Celui-ci se compose de l'ID de la matière, du numéro du chapitre, puis des sous-parties séparés par des tirets, ex `SES-3-1` pourrait signifier la première partie du 3ème chapitre de SES.

Exemple: (*/cours/SES/Chap1.xml* par exemple, mais le chemin après le */cours/* n'est pas pris en compte)
```xml
<!-- Ici un cours avec l'ID SES et le nom d'affichage `Sciences Economiques et Sociales` est créé, les propriétés sur les blocs comme leur nom ou autres ne sont pas obligatoires partout, il ne le faut que dans un fichier -->
<cours id="SES" nom="Sciences Economiques et Sociales">

    <!-- Ici on créé un chapitre, la propriété `key` permet de remplacer le numéro indiqué avant le titre du chapitre dans les pages, qui est par défaut le numéro du chapitre dans l'ID -->
    <chap id="SES-1" titre="Introduction à l'économie" key="I">

        <!-- Un tag spécifique pour formatter les introductions -->
        <intro> ... </intro>

        <!-- Un tag spécifique pour formatter les problématiques -->
        <pb> ... </pb>

        <!-- Ici on créé une sous-partie du cours, l'attribut `key` peut également s'appliquer ici -->
        <pt id="SES-1-1" titre="Qu'est-ce que l'économie ?" key="A">

            <!-- Un tag spécifique pour formatter les paragraphes -->
            <p> ... </p>

            <!-- Un tag spécifique pour formatter les définitions -->
            <def nom="La science économique"> Les sciences économiques s'intéressent aux choix qui affectent... </def>

        </pt>

        <pt id="SES-1-2" titre="Déplacements de courbes" key="B">

            <!-- Un tag spécifique pour formatter les exemples -->
            <exemple> ... </exemple>

            <!-- Un tag qui permet de noter des éléments à rajouter plus tard -->
            <TODO> ... </TODO>

        </pt>
    
    </chap>

</cours>
```