let expenses = [];

function addExpense() {
  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;

  if (!title || isNaN(amount) || !date) {
    alert('Please fill all fields correctly.');
    return;
  }

  const expense = {
    id: Date.now(),
    title,
    amount,
    date
  };

  expenses.push(expense);
  renderExpenses();
  clearInputs();
}

function renderExpenses() {
  const list = document.getElementById('expense-list');
  const totalEl = document.getElementById('total-amount');
  list.innerHTML = '';
  let total = 0;

  expenses.forEach(exp => {
    total += exp.amount;

    const card = document.createElement('div');
    card.className = 'expense-card';

    card.innerHTML = `
      <div class="expense-info">
        <strong>${exp.title}</strong>
        <small>₹${exp.amount.toFixed(2)} | ${new Date(exp.date).toLocaleDateString()}</small>
      </div>
      <button class="delete-btn" onclick="deleteExpense(${exp.id})">X</button>
    `;

    list.appendChild(card);
  });

  totalEl.textContent = total.toFixed(2);
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  renderExpenses();
}

function clearInputs() {
  document.getElementById('title').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('date').value = '';
}
