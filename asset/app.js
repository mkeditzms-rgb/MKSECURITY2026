const fileInput = document.getElementById('apkFile');
const fileName = document.getElementById('fileName');
const checkButton = document.getElementById('checkButton');
const trustedInput = document.getElementById('trustedHash');
const result = document.getElementById('result');
const hashValue = document.getElementById('hashValue');
const copyButton = document.getElementById('copyHash');
let latestHash = '';

fileInput.addEventListener('change', () => {
  const file = fileInput.files && fileInput.files[0];
  fileName.textContent = file ? `${file.name} · ${formatBytes(file.size)}` : 'Choose a file from your device';
  latestHash = '';
  hashValue.textContent = 'SHA-256 will appear here';
  copyButton.disabled = true;
  result.className = 'result';
  result.innerHTML = '<span class="result-label">RESULT</span><p>Ready to calculate the selected file fingerprint.</p>';
});

checkButton.addEventListener('click', async () => {
  const file = fileInput.files && fileInput.files[0];
  latestHash = '';
  copyButton.disabled = true;

  if (!file) {
    showResult('Please select an APK file first.', 'error');
    return;
  }
  if (!file.name.toLowerCase().endsWith('.apk')) {
    showResult('Please choose a file with the .apk extension.', 'error');
    return;
  }
  if (!window.crypto || !crypto.subtle) {
    showResult('Secure browser context required. Open the site using its HTTPS GitHub Pages URL.', 'error');
    return;
  }

  checkButton.disabled = true;
  checkButton.textContent = 'Calculating…';
  showResult('Reading file and calculating SHA-256. Please keep this page open.', '');
  try {
    // This is local browser processing; no fetch/upload request is made.
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    latestHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    hashValue.textContent = latestHash;
    copyButton.disabled = false;

    const trusted = trustedInput.value.trim().toLowerCase().replace(/\s+/g, '');
    if (trusted && !/^[a-f0-9]{64}$/.test(trusted)) {
      showResult('Hash calculated, but the trusted reference must be exactly 64 hexadecimal characters.', 'error');
    } else if (trusted && trusted === latestHash) {
      showResult('MATCH — file bytes match the trusted SHA-256 value you entered. This does not prove the APK is safe.', 'success');
    } else if (trusted) {
      showResult('MISMATCH — file bytes do not match the trusted SHA-256 value. Do not install until you verify the source.', 'error');
    } else {
      showResult('Hash calculated. Compare it with a trusted official reference. A hash alone is not a safety scan.', '');
    }
  } catch (error) {
    showResult('Could not calculate the hash. The file may be too large for available browser memory.', 'error');
  } finally {
    checkButton.disabled = false;
    checkButton.textContent = 'Calculate SHA-256';
  }
});

copyButton.addEventListener('click', async () => {
  if (!latestHash) return;
  try {
    await navigator.clipboard.writeText(latestHash);
    copyButton.textContent = 'Copied';
    setTimeout(() => { copyButton.textContent = 'Copy hash'; }, 1500);
  } catch {
    showResult('Clipboard access was blocked. Select the displayed hash and copy it manually.', 'error');
  }
});

function showResult(message, state) {
  result.className = `result${state ? ' ' + state : ''}`;
  result.replaceChildren();
  const label = document.createElement('span');
  label.className = 'result-label';
  label.textContent = 'RESULT';
  const p = document.createElement('p');
  p.textContent = message;
  result.append(label, p);
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; }
  return `${value.toFixed(1)} ${units[index]}`;
}

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
menuToggle.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));
document.getElementById('year').textContent = String(new Date().getFullYear());

// A placeholder # link should not accidentally jump the visitor to the page top.
const downloadLink = document.getElementById('downloadLink');
downloadLink.addEventListener('click', event => {
  if (downloadLink.getAttribute('href') === '#') {
    event.preventDefault();
    document.getElementById('downloadHelp').textContent = 'No APK URL configured yet. Edit index.html and replace the placeholder href with your real download URL.';
  }
});
