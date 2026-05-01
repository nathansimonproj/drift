async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/pages/login.html';
}

function renderAll() {
  renderEventsList();
}

function setupForm() {
  const typeSel = document.getElementById('form-type');
  typeSel.addEventListener('change', updateAmountField);

  document.getElementById('form-add').addEventListener('click', () => {
    const type = typeSel.value;
    const amountEl = document.getElementById('form-amount');
    let amount = amountEl.value;
    if (TYPES[type].amountKind === 'number') {
      amount = parseFloat(amount);
      if (isNaN(amount) || amount < 0) {
        amountEl.focus();
        return;
      }
    }
    const time = document.getElementById('form-time').value || null;
    addEvent(type, amount, time);
  });
}

function init() {
  load();
  renderQuickAdd();
  renderTypeSelect();
  setupForm();
  renderAll();
}

init();
