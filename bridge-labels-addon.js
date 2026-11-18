// =========================================================================
// ADD-ON: MEMBER NAME LABELS + SIMPLE FUNCTION INFO
// PASTE THIS BLOCK right after the "window.onload = function () {...};" block,
// and before the closing </script> tag. No other change is needed.
// =========================================================================
(function () {
  // ---- Styles (injected, so no edit to <style> needed) ----
  const css = `
    #label-layer { position: fixed; inset: 0; z-index: 10; pointer-events: none; overflow: hidden; }
    .bridge-label {
      position: absolute; transform: translate(-50%, -50%);
      pointer-events: auto; cursor: pointer; text-align: left;
      padding: 3px 8px 4px; border-radius: 8px; white-space: nowrap;
      font: 600 11px/1.15 'Inter', sans-serif; color: #fff;
      background: rgba(15,23,42,.86); border: 1.5px solid var(--c);
      box-shadow: 0 4px 14px rgba(0,0,0,.4);
      transition: background .15s, transform .15s;
    }
    .bridge-label span { display: block; font-weight: 500; font-size: 9.5px; color: var(--c); }
    .bridge-label:hover, .bridge-label.active { background: var(--c); transform: translate(-50%, -50%) scale(1.08); }
    .bridge-label:hover span, .bridge-label.active span { color: #0f172a; }
    .bridge-label:hover, .bridge-label.active { color: #0f172a; }
    .bridge-label.tension     { --c: #60a5fa; }
    .bridge-label.compression { --c: #fb923c; }
    .bridge-label.bending     { --c: #c084fc; }
    .bridge-label.reaction    { --c: #fbbf24; }
    @media (max-width: 640px) { .bridge-label { font-size: 9.5px; padding: 2px 6px; } .bridge-label span { display: none; } }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---- Label data: name, force type, plain-words function, 3D anchor point [x, y, z] ----
  const LABELS = [
    { id: 'deck', cat: 'deck', kind: 'bending', name: 'Deck', type: 'Bending & Shear', at: [-1.2, 1.65, 1.35],
      simple: 'The road. Loads sit on it. It bends slightly and passes the weight to the hangers.' },
    { id: 'hangers', cat: 'hangers', kind: 'tension', name: 'Vertical Hangers', type: 'Tension', at: [-3.1, 2.7, 1.4],
      simple: 'Thin threads that hold the deck up from above, like a swing. They are pulled (tension).' },
    { id: 'incl', cat: 'inclinedSticks', kind: 'compression', name: 'Inclined Support Sticks', type: 'Compression & Bending', at: [-3.6, 3.7, 1.4],
      simple: 'Slanted sticks that take the weight from the hangers and push it toward the towers. They are squeezed (compression).' },
    { id: 'tline', cat: 'tensionLine', kind: 'tension', name: 'Tension Line', type: 'Tension', at: [-3.6, 6.0, 1.4],
      simple: 'A long thread joining both tower tops and the peak. It stops the top from spreading apart, like a rope tying two hands together.' },
    { id: 'tower', cat: 'towers', kind: 'compression', name: 'Towers', type: 'Compression', at: [7.2, 5.4, 1.5],
      simple: 'Tall vertical frames at both ends. They hold up the whole bridge and carry the final load down to the ground.' },
    { id: 'braces', cat: 'towers', kind: 'compression', name: 'Cross-beams & Diagonal Braces', type: 'Rigid frame', at: [-7.2, 3.15, 1.5],
      simple: 'Cross-beams keep the two tower legs apart. Diagonal braces form triangles that do not change shape, so the tower stays stiff and does not sway.' },
    { id: 'stays', cat: 'backStays', kind: 'tension', name: 'Anchorage Stays', type: 'Tension', at: [9.4, 3.3, 1.5],
      simple: 'Slanted threads from the tower top outward and down. They stop the towers from falling over, like tent ropes.' },
    { id: 'base', cat: 'towers', kind: 'reaction', name: 'Base Legs (Reaction)', type: 'Ground pushes up', at: [-7.2, 0.35, 1.5],
      simple: 'The tower bottoms rest on the ground. The ground pushes back up with an equal force (the reaction), completing the load path.' }
  ];

  const SIMPLE_BY_CAT = {};
  LABELS.forEach(L => { if (!SIMPLE_BY_CAT[L.cat]) SIMPLE_BY_CAT[L.cat] = L.simple; });

  // ---- Label layer + DOM elements ----
  const layer = document.createElement('div');
  layer.id = 'label-layer';
  document.body.appendChild(layer);

  let labelsOn = true;
  let selectedLabel = null;

  LABELS.forEach(L => {
    const el = document.createElement('button');
    el.className = 'bridge-label ' + L.kind;
    el.innerHTML = '<b>' + L.name + '</b><span>' + L.type + '</span>';
    L.pos = new THREE.Vector3(L.at[0], L.at[1], L.at[2]);
    L.el = el;
    el.addEventListener('click', () => {
      selectedLabel = L.id;
      selectedCategory = L.cat;
      populateInspector(L.cat, true);
      document.getElementById('insp-title').textContent = L.name;
      document.getElementById('insp-action').textContent = 'Force: ' + L.type;
      document.getElementById('insp-desc').textContent = L.simple;
      document.getElementById('btn-clear-selection').classList.remove('hidden');
      updateMemberVisuals();
    });
    layer.appendChild(el);
  });

  // ---- Inspector now also shows the plain-words explanation on hover/click ----
  const originalPopulate = populateInspector;
  populateInspector = function (cat, isPinned) {
    originalPopulate(cat, isPinned);
    if (SIMPLE_BY_CAT[cat]) {
      document.getElementById('insp-desc').textContent = SIMPLE_BY_CAT[cat];
    }
  };

  // ---- "Labels" on/off button (added next to Auto-Orbit) ----
  const toggle = document.createElement('button');
  toggle.className = 'btn-pill px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 flex items-center gap-1.5';
  toggle.innerHTML = '<i class="fa-solid fa-tags"></i><span>Labels</span>';
  toggle.addEventListener('click', () => {
    labelsOn = !labelsOn;
    toggle.classList.toggle('bg-amber-500', labelsOn);
    toggle.classList.toggle('text-slate-950', labelsOn);
    toggle.classList.toggle('text-slate-300', !labelsOn);
  });
  document.getElementById('btn-autorotate').parentElement.prepend(toggle);

  // ---- Keep every label glued to its 3D point ----
  const v = new THREE.Vector3();
  function updateLabels() {
    requestAnimationFrame(updateLabels);
    if (typeof camera === 'undefined' || !camera) return;
    if (!selectedCategory) selectedLabel = null;
    LABELS.forEach(L => {
      v.copy(L.pos).project(camera);
      if (!labelsOn || v.z > 1) { L.el.style.display = 'none'; return; }
      L.el.style.display = '';
      L.el.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      L.el.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      L.el.classList.toggle('active', selectedLabel === L.id);
    });
  }
  updateLabels();
})();
