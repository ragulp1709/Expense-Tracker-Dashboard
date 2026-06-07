"use strict";

const STORAGE_KEY = "expense-tracker.expenses.v1";
const MAX_TITLE_LENGTH = 80;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const elements = {
  form: document.querySelector("#expense-form"),
  title: document.querySelector("#title"),
  amount: document.querySelector("#amount"),
  date: document.querySelector("#date"),
  error: document.querySelector("#form-error"),
  list: document.querySelector("#expense-list"),
  emptyState: document.querySelector("#empty-state"),
  total: document.querySelector("#total-amount"),
  monthTotal: document.querySelector("#month-amount"),
  count: document.querySelector("#expense-count"),
  search: document.querySelector("#expense-search"),
  sort: document.querySelector("#expense-sort"),
  clearAll: document.querySelector("#clear-all"),
  status: document.querySelector("#app-status"),
};

let expenses = loadExpenses();

function loadExpenses() {
  try {
    const storedExpenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(storedExpenses)) {
      return [];
    }

    return storedExpenses.filter(isValidExpense);
  } catch {
    return [];
  }
}

function isValidExpense(expense) {
  return Boolean(
    expense &&
      typeof expense.id === "string" &&
      typeof expense.title === "string" &&
      expense.title.trim() &&
      expense.title.length <= MAX_TITLE_LENGTH &&
      Number.isFinite(expense.amount) &&
      expense.amount > 0 &&
      isValidDateValue(expense.date)
  );
}

function saveExpenses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {
    setStatus("Your browser could not save the latest changes.");
  }
}

function createExpenseId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTodayValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function parseLocalDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidDateValue(dateValue) {
  if (typeof dateValue !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return false;
  }

  const date = parseLocalDate(dateValue);
  const [year, month, day] = dateValue.split("-").map(Number);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getFormValues() {
  return {
    title: elements.title.value.trim(),
    amount: Number(elements.amount.value),
    date: elements.date.value,
  };
}

function validateExpense({ title, amount, date }) {
  if (!title) {
    return "Enter a title for the expense.";
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return `Keep the title under ${MAX_TITLE_LENGTH} characters.`;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Enter an amount greater than zero.";
  }

  if (!isValidDateValue(date)) {
    return "Choose a valid date.";
  }

  return "";
}

function addExpense(event) {
  event.preventDefault();

  const values = getFormValues();
  const validationMessage = validateExpense(values);

  if (validationMessage) {
    elements.error.textContent = validationMessage;
    return;
  }

  expenses.push({
    id: createExpenseId(),
    ...values,
  });

  saveExpenses();
  elements.form.reset();
  elements.date.value = getTodayValue();
  elements.error.textContent = "";
  renderExpenses();
  setStatus(`${values.title} was added.`);
  elements.title.focus();
}

function deleteExpense(id) {
  const expense = expenses.find((item) => item.id === id);

  if (!expense) {
    return;
  }

  expenses = expenses.filter((item) => item.id !== id);
  saveExpenses();
  renderExpenses();
  setStatus(`${expense.title} was deleted.`);
}

function clearAllExpenses() {
  if (!expenses.length || !window.confirm("Delete all saved expenses?")) {
    return;
  }

  expenses = [];
  saveExpenses();
  renderExpenses();
  setStatus("All expenses were deleted.");
}

function getVisibleExpenses() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const visibleExpenses = expenses.filter((expense) =>
    expense.title.toLocaleLowerCase().includes(query)
  );

  return visibleExpenses.sort((first, second) => {
    switch (elements.sort.value) {
      case "oldest":
        return first.date.localeCompare(second.date);
      case "highest":
        return second.amount - first.amount;
      case "lowest":
        return first.amount - second.amount;
      case "newest":
      default:
        return second.date.localeCompare(first.date);
    }
  });
}

function createExpenseCard(expense) {
  const card = document.createElement("li");
  card.className = "expense-card";

  const info = document.createElement("div");
  info.className = "expense-info";

  const title = document.createElement("strong");
  title.className = "expense-title";
  title.textContent = expense.title;
  title.title = expense.title;

  const date = document.createElement("time");
  date.className = "expense-date";
  date.dateTime = expense.date;
  date.textContent = dateFormatter.format(parseLocalDate(expense.date));

  const amount = document.createElement("span");
  amount.className = "expense-amount";
  amount.textContent = currencyFormatter.format(expense.amount);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.dataset.expenseId = expense.id;
  deleteButton.setAttribute("aria-label", `Delete ${expense.title}`);
  deleteButton.textContent = "Delete";

  info.append(title, date);
  card.append(info, amount, deleteButton);

  return card;
}

function updateSummary() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthTotal = expenses.reduce((sum, expense) => {
    const expenseDate = parseLocalDate(expense.date);
    const isCurrentMonth =
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear;

    return isCurrentMonth ? sum + expense.amount : sum;
  }, 0);

  elements.total.textContent = currencyFormatter.format(total);
  elements.monthTotal.textContent = currencyFormatter.format(monthTotal);
  elements.count.textContent = expenses.length.toLocaleString("en-IN");
}

function renderExpenses() {
  const visibleExpenses = getVisibleExpenses();
  const fragment = document.createDocumentFragment();

  visibleExpenses.forEach((expense) => {
    fragment.append(createExpenseCard(expense));
  });

  elements.list.replaceChildren(fragment);
  elements.clearAll.hidden = expenses.length === 0;
  elements.emptyState.hidden = visibleExpenses.length > 0;
  elements.emptyState.textContent = expenses.length
    ? "No expenses match your search."
    : "No expenses yet. Add your first one above.";

  updateSummary();
}

function setStatus(message) {
  elements.status.textContent = "";
  window.setTimeout(() => {
    elements.status.textContent = message;
  }, 0);
}

elements.form.addEventListener("submit", addExpense);
elements.title.addEventListener("input", () => {
  elements.error.textContent = "";
});
elements.amount.addEventListener("input", () => {
  elements.error.textContent = "";
});
elements.date.addEventListener("input", () => {
  elements.error.textContent = "";
});
elements.search.addEventListener("input", renderExpenses);
elements.sort.addEventListener("change", renderExpenses);
elements.clearAll.addEventListener("click", clearAllExpenses);
elements.list.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-expense-id]");

  if (deleteButton) {
    deleteExpense(deleteButton.dataset.expenseId);
  }
});

elements.date.value = getTodayValue();
renderExpenses();
