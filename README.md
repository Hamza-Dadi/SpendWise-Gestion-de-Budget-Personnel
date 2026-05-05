# SpendWise

SpendWise est un mini-projet de gestion de budget personnel 

## Contenu

- `index.html` : dashboard avec solde, revenus, depenses et graphique par categorie.
- `transactions.html` : liste des transactions avec filtres, modification, suppression et export CSV.
- `ajouter.html` : formulaire d'ajout d'une depense ou d'un revenu.
- `app.js` : logique JavaScript et stockage local.
- `database.sql` : schema MySQL, donnees de test et requetes importantes.

## Utilisation

Ouvrir `index.html` dans un navigateur. Les donnees sont stockees dans `localStorage`, ce qui permet de tester l'interface sans serveur.

Pour la partie base de donnees, importer `database.sql` dans MySQL ou MariaDB.
