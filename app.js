const CATEGORY_KEY = "spendwise.categories";
const TRANSACTION_KEY = "spendwise.transactions";
const THEME_KEY = "spendwise.theme";

const DEFAULT_CATEGORIES = [
  { id: 1, nom: "Alimentation", type: "depense" },
  { id: 2, nom: "Transport", type: "depense" },
  { id: 3, nom: "Loisirs", type: "depense" },
  { id: 4, nom: "Logement", type: "depense" },
  { id: 5, nom: "Salaire", type: "revenu" },
  { id: 6, nom: "Freelance", type: "revenu" },
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 1,
    categorie_id: 5,
    montant: 7200,
    date_transaction: "2026-04-01",
    description: "Salaire avril",
    type_transaction: "revenu",
  },
  {
    id: 2,
    categorie_id: 1,
    montant: 45.9,
    date_transaction: "2026-04-10",
    description: "Courses supermarch",
    type_transaction: "depense",
  },
  {
    id: 3,
    categorie_id: 2,
    montant: 160,
    date_transaction: "2026-04-12",
    description: "Carte transport",
    type_transaction: "depense",
  },
  {
    id: 4,
    categorie_id: 3,
    montant: 95,
    date_transaction: "2026-04-18",
    description: "Cinema",
    type_transaction: "depense",
  },
  {
    id: 5,
    categorie_id: 6,
    montant: 1200,
    date_transaction: "2026-04-21",
    description: "Mission design",
    type_transaction: "revenu",
  },
  {
    id: 6,
    categorie_id: 4,
    montant: 2100,
    date_transaction: "2026-05-03",
    description: "Loyer",
    type_transaction: "depense",
  },
];

const state = {
  categories: loadCollection(CATEGORY_KEY, DEFAULT_CATEGORIES),
  transactions: loadCollection(TRANSACTION_KEY, DEFAULT_TRANSACTIONS),
  chart: null,
};

function loadCollection(key, fallback) {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return [...fallback];
  }

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return [...fallback];
  }
}

function persistTransactions() {
  localStorage.setItem(TRANSACTION_KEY, JSON.stringify(state.transactions));
}

function money(value) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
  }).format(value);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return today().slice(0, 7);
}

function monthValueFromDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function monthLabel(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const label = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getMonthValues() {
  const values = new Set([currentMonth()]);
  state.transactions.forEach((transaction) => values.add(transaction.date_transaction.slice(0, 7)));

  const now = new Date();
  for (let offset = -2; offset <= 2; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    values.add(monthValueFromDate(date));
  }

  return [...values].sort((a, b) => b.localeCompare(a));
}

function fillMonthSelect(select, selectedValue = currentMonth(), includeAll = false) {
  if (!select) return;

  const monthOptions = getMonthValues()
    .map((month) => {
      const selected = month === selectedValue ? "selected" : "";
      return `<option value="${month}" ${selected}>${monthLabel(month)}</option>`;
    })
    .join("");

  select.innerHTML = includeAll ? `<option value="">Tous les mois</option>${monthOptions}` : monthOptions;
  select.value = selectedValue;
}

function byMonth(transaction, month) {
  return !month || transaction.date_transaction.slice(0, 7) === month;
}

function getCategory(id) {
  return state.categories.find((category) => category.id === Number(id));
}

function fillCategorySelect(select, type = "all", selectedId = null) {
  if (!select) return;

  const categories = state.categories.filter((category) => type === "all" || category.type === type);
  select.innerHTML = categories
    .map((category) => {
      const selected = Number(selectedId) === category.id ? "selected" : "";
      return `<option value="${category.id}" ${selected}>${category.nom}</option>`;
    })
    .join("");
}

function signedAmount(transaction) {
  return transaction.type_transaction === "revenu" ? transaction.montant : -transaction.montant;
}

function allBalance() {
  return state.transactions.reduce((total, transaction) => total + signedAmount(transaction), 0);
}

function monthStats(month) {
  const monthTransactions = state.transactions.filter((transaction) => byMonth(transaction, month));
  const revenus = monthTransactions
    .filter((transaction) => transaction.type_transaction === "revenu")
    .reduce((total, transaction) => total + transaction.montant, 0);
  const depenses = monthTransactions
    .filter((transaction) => transaction.type_transaction === "depense")
    .reduce((total, transaction) => total + transaction.montant, 0);

  return { monthTransactions, revenus, depenses, solde: revenus - depenses };
}

function expenseByCategory(transactions) {
  return transactions
    .filter((transaction) => transaction.type_transaction === "depense")
    .reduce((groups, transaction) => {
      const category = getCategory(transaction.categorie_id);
      const label = category?.nom || "Sans categorie";
      groups[label] = (groups[label] || 0) + transaction.montant;
      return groups;
    }, {});
}

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initTheme() {
  applyTheme(getInitialTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      applyTheme(currentTheme === "dark" ? "light" : "dark");
    });
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  updateThemeButtons(theme);
  updateChartTheme();
}

function updateThemeButtons(theme) {
  const darkMode = theme === "dark";

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-label", darkMode ? "Desactiver le mode sombre" : "Activer le mode sombre");
    button.setAttribute("title", darkMode ? "Mode clair" : "Mode sombre");

    const label = button.querySelector("span");
    if (label) {
      label.textContent = darkMode ? "Mode clair" : "Mode sombre";
    }

    const icon = button.querySelector("i");
    if (icon) {
      icon.setAttribute("data-lucide", darkMode ? "sun" : "moon");
    }
  });

  initIcons();
}

function updateChartTheme() {
  if (!state.chart) return;

  state.chart.options.plugins.legend.labels.color = cssVar("--text");
  state.chart.data.datasets.forEach((dataset) => {
    dataset.borderColor = cssVar("--surface");
  });
  state.chart.update();
}

function initMobileNavigation() {
  const menuButton = document.querySelector("[data-menu-toggle]");
  const backdrop = document.querySelector("[data-nav-backdrop]");
  const navLinks = document.querySelectorAll(".nav-link");

  const setOpen = (open) => {
    document.body.classList.toggle("nav-open", open);

    if (menuButton) {
      menuButton.setAttribute("aria-expanded", String(open));
      const icon = menuButton.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", open ? "x" : "menu");
      }
      initIcons();
    }
  };

  menuButton?.addEventListener("click", () => setOpen(!document.body.classList.contains("nav-open")));
  backdrop?.addEventListener("click", () => setOpen(false));
  navLinks.forEach((link) => link.addEventListener("click", () => setOpen(false)));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
      setOpen(false);
    }
  });
}

function initDashboard() {
  const monthInput = document.getElementById("dashboardMonth");
  fillMonthSelect(monthInput, currentMonth());
  monthInput.addEventListener("change", () => renderDashboard(monthInput.value));
  renderDashboard(monthInput.value);
}

function renderDashboard(month) {
  const stats = monthStats(month);
  const categoryTotals = expenseByCategory(stats.monthTransactions);

  setText("balanceValue", money(allBalance()));
  setText("incomeValue", money(stats.revenus));
  setText("expenseValue", money(stats.depenses));
  setText("countValue", String(stats.monthTransactions.length));
  setText("chartTotal", money(stats.depenses));

  renderRecent(stats.monthTransactions);
  renderChart(categoryTotals);
}

function renderRecent(transactions) {
  const target = document.getElementById("recentList");
  if (!target) return;

  const recent = [...transactions]
    .sort((a, b) => b.date_transaction.localeCompare(a.date_transaction))
    .slice(0, 6);

  if (!recent.length) {
    target.innerHTML = '<p class="empty-state show">Aucun mouvement pour ce mois.</p>';
    return;
  }

  target.innerHTML = recent
    .map((transaction) => {
      const category = getCategory(transaction.categorie_id);
      const amountClass = transaction.type_transaction === "revenu" ? "amount-positive" : "amount-negative";
      const sign = transaction.type_transaction === "revenu" ? "+" : "-";

      return `
        <article class="recent-item">
          <span>
            <strong>${escapeHtml(transaction.description)}</strong>
            <small>${transaction.date_transaction} - ${category?.nom || "Sans categorie"}</small>
          </span>
          <strong class="${amountClass}">${sign}${money(transaction.montant)}</strong>
        </article>
      `;
    })
    .join("");
}

function renderChart(categoryTotals) {
  const canvas = document.getElementById("categoryChart");
  const fallback = document.getElementById("chartFallback");
  if (!canvas || !fallback) return;

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);
  const colors = [cssVar("--accent"), cssVar("--green"), cssVar("--blue"), cssVar("--amber"), cssVar("--violet"), cssVar("--red")];

  fallback.innerHTML = buildFallbackBars(labels, values, colors);
  fallback.classList.toggle("show", !window.Chart || !labels.length);

  if (!window.Chart) return;

  if (state.chart) {
    state.chart.destroy();
  }

  state.chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labels.length ? labels : ["Aucune depense"],
      datasets: [
        {
          data: values.length ? values : [1],
          backgroundColor: labels.length ? colors : [cssVar("--line")],
          borderColor: cssVar("--surface"),
          borderWidth: 4,
        },
      ],
    },
    options: {
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            color: cssVar("--text"),
            font: { family: "Inter, sans-serif", weight: "700" },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${money(context.raw)}`,
          },
        },
      },
    },
  });
}

function buildFallbackBars(labels, values, colors) {
  if (!labels.length) {
    return '<p class="empty-state show">Aucune depense a afficher.</p>';
  }

  const max = Math.max(...values);
  return labels
    .map((label, index) => {
      const width = max ? Math.max((values[index] / max) * 100, 4) : 0;
      return `
        <div class="bar-row">
          <strong>${escapeHtml(label)}</strong>
          <span class="bar-track">
            <span class="bar-fill" style="width:${width}%; background:${colors[index % colors.length]}"></span>
          </span>
          <span>${money(values[index])}</span>
        </div>
      `;
    })
    .join("");
}

function initTransactionsPage() {
  const month = document.getElementById("filterMonth");
  const type = document.getElementById("filterType");
  const category = document.getElementById("filterCategory");
  const search = document.getElementById("filterSearch");

  fillMonthSelect(month, currentMonth(), true);
  fillFilterCategories(category);

  [month, type, category, search].forEach((input) => input.addEventListener("input", renderTransactions));
  document.getElementById("resetFilters").addEventListener("click", () => {
    month.value = "";
    type.value = "all";
    category.value = "all";
    search.value = "";
    renderTransactions();
  });
  document.getElementById("exportCsv").addEventListener("click", exportCsv);

  setupEditDialog();
  renderTransactions();
}

function fillFilterCategories(select) {
  const options = state.categories
    .map((category) => `<option value="${category.id}">${category.nom}</option>`)
    .join("");
  select.innerHTML = '<option value="all">Toutes</option>' + options;
}

function getFilteredTransactions() {
  const month = document.getElementById("filterMonth")?.value || "";
  const type = document.getElementById("filterType")?.value || "all";
  const categoryId = document.getElementById("filterCategory")?.value || "all";
  const search = (document.getElementById("filterSearch")?.value || "").trim().toLowerCase();

  return state.transactions
    .filter((transaction) => byMonth(transaction, month))
    .filter((transaction) => type === "all" || transaction.type_transaction === type)
    .filter((transaction) => categoryId === "all" || Number(categoryId) === transaction.categorie_id)
    .filter((transaction) => !search || transaction.description.toLowerCase().includes(search))
    .sort((a, b) => b.date_transaction.localeCompare(a.date_transaction));
}

function renderTransactions() {
  const body = document.getElementById("transactionsBody");
  if (!body) return;

  const transactions = getFilteredTransactions();
  const total = transactions.reduce((sum, transaction) => sum + signedAmount(transaction), 0);

  setText("transactionCount", `${transactions.length} transaction${transactions.length > 1 ? "s" : ""}`);
  setText("filteredTotal", money(total));
  document.getElementById("emptyTransactions").classList.toggle("show", !transactions.length);

  body.innerHTML = transactions
    .map((transaction) => {
      const category = getCategory(transaction.categorie_id);
      const amountClass = transaction.type_transaction === "revenu" ? "amount-positive" : "amount-negative";
      const sign = transaction.type_transaction === "revenu" ? "+" : "-";

      return `
        <tr>
          <td>${transaction.date_transaction}</td>
          <td>${escapeHtml(transaction.description)}</td>
          <td>${category?.nom || "Sans categorie"}</td>
          <td><span class="type-pill ${transaction.type_transaction}">${transaction.type_transaction}</span></td>
          <td class="amount-cell ${amountClass}">${sign}${money(transaction.montant)}</td>
          <td class="actions-cell">
            <span class="row-actions">
              <button class="icon-button" type="button" data-edit="${transaction.id}" aria-label="Modifier">
                <i data-lucide="pencil"></i>
              </button>
              <button class="icon-button" type="button" data-delete="${transaction.id}" aria-label="Supprimer">
                <i data-lucide="trash-2"></i>
              </button>
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  body.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openEditDialog(Number(button.dataset.edit)));
  });
  body.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteTransaction(Number(button.dataset.delete)));
  });
  initIcons();
}

function setupEditDialog() {
  const dialog = document.getElementById("editDialog");
  const form = document.getElementById("editTransactionForm");
  const type = document.getElementById("editType");
  const closeButtons = document.querySelectorAll("[data-close-dialog]");

  type.addEventListener("change", () => fillCategorySelect(document.getElementById("editCategory"), type.value));
  closeButtons.forEach((button) => button.addEventListener("click", () => dialog.close()));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEditedTransaction();
    dialog.close();
  });
}

function openEditDialog(id) {
  const transaction = state.transactions.find((item) => item.id === id);
  const dialog = document.getElementById("editDialog");
  if (!transaction || !dialog) return;

  document.getElementById("editId").value = transaction.id;
  document.getElementById("editType").value = transaction.type_transaction;
  fillCategorySelect(document.getElementById("editCategory"), transaction.type_transaction, transaction.categorie_id);
  document.getElementById("editAmount").value = transaction.montant;
  document.getElementById("editDate").value = transaction.date_transaction;
  document.getElementById("editDescription").value = transaction.description;
  dialog.showModal();
  initIcons();
}

function saveEditedTransaction() {
  const id = Number(document.getElementById("editId").value);
  const index = state.transactions.findIndex((transaction) => transaction.id === id);
  if (index === -1) return;

  const categoryId = Number(document.getElementById("editCategory").value);
  const category = getCategory(categoryId);

  state.transactions[index] = {
    id,
    categorie_id: categoryId,
    montant: Number(document.getElementById("editAmount").value),
    date_transaction: document.getElementById("editDate").value,
    description: document.getElementById("editDescription").value.trim(),
    type_transaction: category?.type || document.getElementById("editType").value,
  };

  persistTransactions();
  renderTransactions();
}

function deleteTransaction(id) {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) return;

  const confirmed = window.confirm(`Supprimer "${transaction.description}" ?`);
  if (!confirmed) return;

  state.transactions = state.transactions.filter((item) => item.id !== id);
  persistTransactions();
  renderTransactions();
}

function exportCsv() {
  const rows = getFilteredTransactions();
  const headers = ["id", "categorie", "montant", "date_transaction", "description", "type_transaction"];
  const lines = rows.map((transaction) => {
    const category = getCategory(transaction.categorie_id);
    return [
      transaction.id,
      category?.nom || "",
      transaction.montant.toFixed(2),
      transaction.date_transaction,
      transaction.description,
      transaction.type_transaction,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",");
  });

  const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "spendwise-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function initAddPage() {
  const form = document.getElementById("transactionForm");
  const typeInputs = document.querySelectorAll('input[name="transactionType"]');
  const categoryInput = document.getElementById("categoryInput");
  const amountInput = document.getElementById("amountInput");
  const dateInput = document.getElementById("dateInput");
  const descriptionInput = document.getElementById("descriptionInput");

  dateInput.value = today();
  fillCategorySelect(categoryInput, getSelectedTransactionType());
  typeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      fillCategorySelect(categoryInput, getSelectedTransactionType());
      updatePreview();
    });
  });
  [amountInput, categoryInput].forEach((input) => input.addEventListener("input", updatePreview));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const category = getCategory(Number(categoryInput.value));
    const transaction = {
      id: nextTransactionId(),
      categorie_id: Number(categoryInput.value),
      montant: Number(amountInput.value),
      date_transaction: dateInput.value,
      description: descriptionInput.value.trim(),
      type_transaction: category?.type || getSelectedTransactionType(),
    };

    state.transactions.push(transaction);
    persistTransactions();
    form.reset();
    dateInput.value = today();
    fillCategorySelect(categoryInput, getSelectedTransactionType());
    updatePreview();
    showToast("Transaction ajoutee avec succes.");
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      dateInput.value = today();
      fillCategorySelect(categoryInput, getSelectedTransactionType());
      updatePreview();
    });
  });

  updatePreview();
}

function getSelectedTransactionType() {
  return document.querySelector('input[name="transactionType"]:checked')?.value || "depense";
}

function nextTransactionId() {
  return state.transactions.reduce((max, transaction) => Math.max(max, transaction.id), 0) + 1;
}

function updatePreview() {
  const amount = Number(document.getElementById("amountInput")?.value || 0);
  const type = getSelectedTransactionType();
  const preview = allBalance() + (type === "revenu" ? amount : -amount);

  setText("previewBalance", money(preview));
  setText("previewCount", String(state.transactions.length));
}

function showToast(message) {
  const toast = document.getElementById("formMessage");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  initTheme();
  initMobileNavigation();

  if (page === "dashboard") initDashboard();
  if (page === "transactions") initTransactionsPage();
  if (page === "add") initAddPage();

  initIcons();
});
