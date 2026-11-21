(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const deviceTheme = window.matchMedia('(prefers-color-scheme: dark)');
  function showTheme(dark) {
    root.dataset.theme = dark ? 'dark' : 'light';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeColor.content = dark ? '#131726' : '#f5f6fb';
  }
  showTheme(root.dataset.theme === 'dark');
  function followDeviceTheme(change) {
    if (root.dataset.themeManual !== 'true') showTheme(change.matches);
  }
  if (deviceTheme.addEventListener) deviceTheme.addEventListener('change', followDeviceTheme);
  else deviceTheme.addListener(followDeviceTheme);
  themeButton.hidden = false;
  themeButton.addEventListener('click', () => {
    root.dataset.themeManual = 'true';
    showTheme(root.dataset.theme !== 'dark');
    try { localStorage.setItem('yb-reading-theme', root.dataset.theme); } catch {}
  });

  const menus = [...document.querySelectorAll('.utility-menu')];
  document.addEventListener('click', event => {
    for (const menu of menus) {
      if (!menu.contains(event.target) || event.target.closest('a')) menu.open = false;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = menus.find(menu => menu.open);
    if (open) {
      open.open = false;
      open.querySelector('summary').focus();
    }
  });

  const resume = document.querySelector('.resume-layout');
  const tablist = resume.querySelector('.resume-nav');
  const tabs = [...tablist.querySelectorAll('a')];
  const panels = new Map([...resume.querySelectorAll('[data-pane]')].map(panel => [panel.id, panel]));
  const layout = window.matchMedia('(max-width:44rem)');
  let selected;
  let keepPaneOnLanguageChange = false;
  function setOrientation() {
    tablist.setAttribute('aria-orientation', layout.matches ? 'horizontal' : 'vertical');
  }
  function selectTab(id) {
    selected = id;
    for (const tab of tabs) {
      const panel = panels.get(tab.getAttribute('aria-controls'));
      const active = panel.id === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    }
  }
  function rememberTab(hash) {
    keepPaneOnLanguageChange = true;
    if (location.hash === hash) return;
    try { history.pushState(null, '', hash); }
    catch { location.hash = hash; }
  }
  tablist.setAttribute('role', 'tablist');
  setOrientation();
  if (layout.addEventListener) layout.addEventListener('change', setOrientation);
  for (const tab of tabs) {
    const id = tab.getAttribute('aria-controls');
    const panel = panels.get(id);
    tab.setAttribute('role', 'tab');
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectTab(id);
      rememberTab(tab.hash);
    });
  }
  tablist.addEventListener('keydown', event => {
    const current = tabs.indexOf(event.target);
    if (current < 0) return;
    const rtl = root.dir === 'rtl';
    const step = {ArrowDown:1, ArrowUp:-1, ArrowRight:rtl?-1:1, ArrowLeft:rtl?1:-1};
    let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else if (event.key in step) next = (current + step[event.key] + tabs.length) % tabs.length;
    else return;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });
  function followFragment(align) {
    const anchor = location.hash.slice(1);
    keepPaneOnLanguageChange = panels.has(anchor);
    if (panels.has(anchor)) {
      selectTab(anchor);
      if (align) document.getElementById('journey').scrollIntoView();
    } else if (anchor === 'journey' || !selected) {
      selectTab('education');
    }
    const project = document.getElementById(anchor);
    if (project?.classList.contains('project')) project.querySelector('details').open = true;
  }
  resume.classList.add('enhanced-resume');
  followFragment(false);
  window.addEventListener('hashchange', () => followFragment(true));
  function resumeReadingPosition() {
    keepPaneOnLanguageChange = false;
  }
  window.addEventListener('wheel', resumeReadingPosition, {passive:true});
  window.addEventListener('touchmove', resumeReadingPosition, {passive:true});
  window.addEventListener('keydown', event => {
    if (!tablist.contains(event.target) && ['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].includes(event.key)) {
      resumeReadingPosition();
    }
  });

  const sections = [...document.querySelectorAll('main > section')];
  const headerLinks = [...document.querySelectorAll('.desktop-nav a, .mobile-menu nav a')];
  function readingSection() {
    const line = Math.min(innerHeight * .32, 250);
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top > line) break;
      current = section;
    }
    if (Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }
    return current.id;
  }
  let scheduled = false;
  function updateNav() {
    const id = readingSection();
    for (const link of headerLinks) {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    scheduled = false;
  }
  addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateNav);
    }
  }, {passive:true});
  updateNav();

  for (const link of document.querySelectorAll('[data-language]')) {
    link.addEventListener('click', () => {
      const id = readingSection();
      link.hash = keepPaneOnLanguageChange || id === 'journey' ? selected : (id === 'home' ? '' : id);
    });
  }
})();
