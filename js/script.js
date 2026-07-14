if (typeof document !== 'undefined') {
  document.getElementById('yr').textContent = new Date().getFullYear();
}

let lang = 'id';
let dark = false;

/* ===== i18n ===== */
const T = {
  id: {
    'h-sub': 'Samarkan IP, port, hostname &amp; password dari teks, log, atau config apa pun',
    'lbl-options': 'Samarkan:',
    'opt-ip': 'IP address',
    'opt-port': 'Port (:1234)',
    'opt-hostname': 'Hostname / domain',
    'opt-email': 'Email',
    'opt-cred': 'password / token / key=value',
    'lbl-input': 'Tempel teks, log, config, atau hasil terminal kamu di sini',
    'lbl-input-sub': 'original',
    'btn-generate': 'Generate',
    'btn-clear': 'Clear',
    'lbl-output': 'Output',
    'lbl-output-sub': 'bisa diedit manual',
    'copyLabel': 'Copy hasil',
    'copiedMsg': '✓ tersalin',
    'hint-bold': 'Cara kerja:',
    'hint-text-rest': ' setiap huruf/angka pada bagian yang cocok diganti dengan <b>x</b> (panjang &amp; tanda baca tetap sama), sisanya dibiarkan apa adanya. Output tetap bisa diedit manual kapan saja. Semua proses berjalan lokal di browser kamu.',
    'footer-issue-label': 'Ada bug atau saran? Email:',
    'donateLabel': 'Dukung Project Ini',
    'ph-input': 'ssh admin@192.168.1.10 -p 2222\nhost: prod-db01.internal.company.com\nDB_PASSWORD=SuperSecret123\ncontact: budi@company.com',
    'ph-output': 'hasil masking akan muncul di sini...'
  },
  en: {
    'h-sub': 'Mask IPs, ports, hostnames &amp; passwords from any text, log, or config',
    'lbl-options': 'Mask:',
    'opt-ip': 'IP address',
    'opt-port': 'Port (:1234)',
    'opt-hostname': 'Hostname / domain',
    'opt-email': 'Email',
    'opt-cred': 'password / token / key=value',
    'lbl-input': 'Paste your text, log, config, or terminal output here',
    'lbl-input-sub': 'original',
    'btn-generate': 'Generate',
    'btn-clear': 'Clear',
    'lbl-output': 'Output',
    'lbl-output-sub': 'manually editable',
    'copyLabel': 'Copy result',
    'copiedMsg': '✓ copied',
    'hint-bold': 'How it works:',
    'hint-text-rest': ' every letter/digit in a matched section is replaced with <b>x</b> (length &amp; punctuation stay the same), everything else is left untouched. The output box can always be edited manually. Everything runs locally in your browser.',
    'footer-issue-label': 'Found a bug or have a suggestion? Email:',
    'donateLabel': 'Support This Project',
    'ph-input': 'ssh admin@192.168.1.10 -p 2222\nhost: prod-db01.internal.company.com\nDB_PASSWORD=SuperSecret123\ncontact: budi@company.com',
    'ph-output': 'masked result will appear here...'
  }
};
function t(k) { return T[lang][k] || k; }

function setLang(l) {
  lang = l;
  document.getElementById('lb-id').classList.toggle('on', l === 'id');
  document.getElementById('lb-en').classList.toggle('on', l === 'en');
  document.documentElement.lang = l;

  document.getElementById('h-sub').innerHTML = t('h-sub');
  document.getElementById('lbl-options').textContent = t('lbl-options');
  document.getElementById('opt-ip').textContent = t('opt-ip');
  document.getElementById('opt-port').textContent = t('opt-port');
  document.getElementById('opt-hostname').textContent = t('opt-hostname');
  document.getElementById('opt-email').textContent = t('opt-email');
  document.getElementById('opt-cred').textContent = t('opt-cred');
  document.getElementById('lbl-input').textContent = t('lbl-input');
  document.getElementById('lbl-input-sub').textContent = t('lbl-input-sub');
  document.getElementById('btn-generate').textContent = t('btn-generate');
  document.getElementById('btn-clear').textContent = t('btn-clear');
  document.getElementById('lbl-output').textContent = t('lbl-output');
  document.getElementById('lbl-output-sub').textContent = t('lbl-output-sub');
  document.getElementById('copyLabel').textContent = t('copyLabel');
  document.getElementById('copiedMsg').textContent = t('copiedMsg');
  document.getElementById('hint-bold').textContent = t('hint-bold');
  document.getElementById('footer-issue-label').textContent = t('footer-issue-label');
  document.getElementById('donateLabel').textContent = t('donateLabel');

  const hintText = document.getElementById('hint-text');
  hintText.innerHTML = '<b id="hint-bold">' + t('hint-bold') + '</b>' + t('hint-text-rest');

  document.getElementById('input').placeholder = t('ph-input');
  document.getElementById('output').placeholder = t('ph-output');
}

function toggleDark() {
  dark = !dark;
  document.getElementById('app').classList.toggle('dark', dark);
  document.body.style.background = dark ? '#1c1c1e' : '';
  document.getElementById('dmIcon').className = dark ? 'ti ti-sun' : 'ti ti-moon';
}

/* ===== Masking logic ===== */
function maskAlnum(str) {
  return str.replace(/[a-zA-Z0-9]/g, 'x');
}

function getOpts() {
  const opts = {};
  document.querySelectorAll('#optionsCard input[type=checkbox]').forEach(cb => {
    opts[cb.dataset.opt] = cb.checked;
  });
  return opts;
}

function maskText(text, opts) {
  let result = text;

  if (opts.ip) {
    result = result.replace(/\b(\d{1,3}\.){3}\d{1,3}\b/g, m => maskAlnum(m));
  }
  if (opts.port) {
    result = result.replace(/\b(?<![:.\w-])(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9.-]+):(\d{2,5})\b/g,
      (m, host, p) => host + ':' + maskAlnum(p));
    // -p 2222 / -P 2222 (dengan spasi)
    result = result.replace(/(-[pP]\s+)(\d{2,5})\b/g, (m, p1, p2) => p1 + maskAlnum(p2));
  }
  if (opts.cred) {
    // -pMyPass123 gaya mysql/postgres: password nempel langsung ke flag, tanpa spasi
    result = result.replace(/(\s-p)([^\s\d][^\s]*)/g, (m, flag, val) => flag + maskAlnum(val));
  }
  if (opts.hostname) {
    result = result.replace(/\b(?=[a-zA-Z0-9-]*[a-zA-Z])[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+\b/g, m => maskAlnum(m));
  }
  if (opts.email) {
    result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, m => maskAlnum(m));
  }
  if (opts.cred) {
    result = result.replace(/(password|passwd|pwd|token|secret|api[_-]?key|apikey|auth)(\s*[:=]\s*)(\S+)/gi,
      (m, key, sep, val) => key + sep + maskAlnum(val)
    );
  }
  return result;
}

function generateMask() {
  const input = document.getElementById('input');
  const output = document.getElementById('output');
  output.value = maskText(input.value, getOpts());
}

function clearAll() {
  document.getElementById('input').value = '';
  document.getElementById('output').value = '';
}

function copyOutput() {
  const output = document.getElementById('output');
  const copiedMsg = document.getElementById('copiedMsg');
  const finish = () => {
    copiedMsg.classList.add('show');
    setTimeout(() => copiedMsg.classList.remove('show'), 1400);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(output.value).then(finish).catch(() => {
      output.select();
      document.execCommand('copy');
      finish();
    });
  } else {
    output.select();
    document.execCommand('copy');
    finish();
  }
}

/* Export for Node.js automated testing (no-op in the browser) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { maskText, maskAlnum };
}
