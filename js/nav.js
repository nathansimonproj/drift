function toggleMenu() {
  document.getElementById('menu-dropdown').classList.toggle('open');
}

document.addEventListener('click', function (e) {
  const wrap = document.getElementById('menu-wrap');
  const dropdown = document.getElementById('menu-dropdown');
  if (dropdown && wrap && !wrap.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});
