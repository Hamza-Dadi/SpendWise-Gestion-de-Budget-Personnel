CREATE DATABASE IF NOT EXISTS spendwise
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE spendwise;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(50) NOT NULL,
  type ENUM('depense', 'revenu') NOT NULL,
  UNIQUE KEY uq_categories_nom_type (nom, type)
);

CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  categorie_id INT NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  date_transaction DATE NOT NULL,
  description VARCHAR(255) NOT NULL,
  type_transaction ENUM('depense', 'revenu') NOT NULL,
  CONSTRAINT chk_transactions_montant CHECK (montant > 0),
  CONSTRAINT fk_transactions_categories
    FOREIGN KEY (categorie_id) REFERENCES categories(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_transactions_date (date_transaction),
  INDEX idx_transactions_type (type_transaction),
  INDEX idx_transactions_categorie (categorie_id)
);

INSERT INTO categories (nom, type) VALUES
  ('Alimentation', 'depense'),
  ('Transport', 'depense'),
  ('Loisirs', 'depense'),
  ('Logement', 'depense'),
  ('Salaire', 'revenu'),
  ('Freelance', 'revenu');

INSERT INTO transactions (categorie_id, montant, date_transaction, description, type_transaction) VALUES
  (5, 7200.00, '2026-04-01', 'Salaire avril', 'revenu'),
  (1, 45.90, '2026-04-10', 'Courses supermarch', 'depense'),
  (2, 160.00, '2026-04-12', 'Carte transport', 'depense'),
  (3, 95.00, '2026-04-18', 'Cinema', 'depense'),
  (6, 1200.00, '2026-04-21', 'Mission design', 'revenu');

-- Ajout d'une depense.
INSERT INTO transactions (
  categorie_id,
  montant,
  date_transaction,
  description,
  type_transaction
) VALUES (
  2,
  45.90,
  '2026-04-10',
  'Courses supermarch',
  'depense'
);

-- Total des depenses par categorie pour le mois courant.
SELECT
  c.nom,
  SUM(t.montant) AS total
FROM transactions t
JOIN categories c ON t.categorie_id = c.id
WHERE t.type_transaction = 'depense'
  AND MONTH(t.date_transaction) = MONTH(CURRENT_DATE)
  AND YEAR(t.date_transaction) = YEAR(CURRENT_DATE)
GROUP BY c.id, c.nom
ORDER BY total DESC;

-- Calcul du solde courant.
SELECT
  SUM(
    CASE
      WHEN type_transaction = 'revenu' THEN montant
      ELSE -montant
    END
  ) AS solde_courant
FROM transactions;

-- Liste des transactions avec categorie.
SELECT
  t.id,
  t.date_transaction,
  t.description,
  c.nom AS categorie,
  t.type_transaction,
  t.montant
FROM transactions t
JOIN categories c ON t.categorie_id = c.id
ORDER BY t.date_transaction DESC, t.id DESC;

-- Modification du montant d'une transaction.
UPDATE transactions
SET montant = 50.00
WHERE id = 7;

-- Suppression d'une transaction.
DELETE FROM transactions
WHERE id = 7;
