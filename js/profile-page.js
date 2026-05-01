async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/pages/login.html';
}

function renderAll() {}

function populateForm() {
  const s = STATE.settings;
  document.getElementById('field-name').value        = s.name        || '';
  document.getElementById('field-sex').value         = s.sex         || '';
  document.getElementById('field-height').value      = s.height      || '';
  document.getElementById('field-height-unit').value = s.heightUnit  || 'cm';
  document.getElementById('field-weight').value      = s.weight      || '';
  document.getElementById('field-weight-unit').value = s.weightUnit  || 'kg';
  document.getElementById('field-bedtime').value     = s.targetBedtime || '23:00';
}

async function loadProfile() {
  load(); // load localStorage baseline first
  try {
    const res = await fetch('/profile');
    if (!res.ok) return populateForm();
    const data = await res.json();
    if (Object.keys(data).length === 0) return populateForm(); // no profile row yet
    STATE.settings.name          = data.name          ?? '';
    STATE.settings.sex           = data.sex           ?? '';
    STATE.settings.height        = data.height        ?? '';
    STATE.settings.heightUnit    = data.height_unit   ?? 'cm';
    STATE.settings.weight        = data.weight        ?? '';
    STATE.settings.weightUnit    = data.weight_unit   ?? 'kg';
    STATE.settings.targetBedtime = data.target_bedtime ?? '23:00';
    save(); // keep localStorage in sync so other pages see the latest bedtime
  } catch (err) {
    console.warn('Could not load profile from server', err);
  }
  populateForm();
}

async function saveProfile() {
  const payload = {
    name:         document.getElementById('field-name').value.trim(),
    sex:          document.getElementById('field-sex').value,
    height:       document.getElementById('field-height').value,
    heightUnit:   document.getElementById('field-height-unit').value,
    weight:       document.getElementById('field-weight').value,
    weightUnit:   document.getElementById('field-weight-unit').value,
    targetBedtime: document.getElementById('field-bedtime').value || '23:00',
  };

  Object.assign(STATE.settings, payload);
  save(); // keep localStorage in sync for forecast page

  try {
    await fetch('/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Could not save profile to server', err);
  }

  const confirm = document.getElementById('save-confirm');
  confirm.classList.add('visible');
  setTimeout(() => confirm.classList.remove('visible'), 2000);
}

async function init() {
  await loadProfile();
}

init();
