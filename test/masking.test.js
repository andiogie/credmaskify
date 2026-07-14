// test/masking.test.js
// Jalankan: node test/masking.test.js
// Regression test untuk fungsi maskText() di js/script.js

const assert = require('assert');
const { maskText } = require('../js/script.js');

const ALL_ON = { ip: true, port: true, hostname: true, email: true, cred: true };

let passed = 0;
let failed = 0;

function check(name, input, opts, expectFn) {
  const result = maskText(input, opts);
  try {
    expectFn(result);
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`   input   : ${JSON.stringify(input)}`);
    console.log(`   output  : ${JSON.stringify(result)}`);
    console.log(`   reason  : ${e.message}`);
    failed++;
  }
}

/* ===================== IP ADDRESS ===================== */
check('IP dasar ke-mask penuh', '10.0.5.23', ALL_ON,
  r => assert.strictEqual(r, 'xx.x.x.xx'));

check('IP + port menempel', 'Connecting to 10.0.5.23:5432', ALL_ON,
  r => assert.ok(!/\d/.test(r), 'masih ada digit tersisa: ' + r));

check('IP mati kalau opsi ip dimatikan', '10.0.5.23', { ...ALL_ON, ip: false },
  r => assert.strictEqual(r, '10.0.5.23'));

/* ===================== PORT ===================== */
check('Port setelah titik dua', 'redis://cache:6379', ALL_ON,
  r => assert.ok(r.includes(':xxxx'), 'port tidak ke-mask: ' + r));

check('Port lewat flag -p', 'ssh root@host -p 2222', ALL_ON,
  r => assert.ok(r.includes('-p xxxx'), 'port -p tidak ke-mask: ' + r));

/* ===================== HOSTNAME ===================== */
check('Hostname multi-segmen', 'host: prod-db01.internal.company.com', ALL_ON,
  r => assert.ok(!/[a-wA-WyzYZ]/.test(r.split('host:')[1]), 'masih ada huruf asli (selain x) di hostname: ' + r));

check('Hostname tidak ikut mask IP', 'db.internal.local dan 172.16.0.9', ALL_ON,
  r => assert.ok(!/\d/.test(r), 'IP di dalam kalimat campuran belum ke-mask: ' + r));

/* ===================== EMAIL ===================== */
check('Email standar', 'contact budi.santoso@company.co.id now', ALL_ON,
  r => assert.ok(!r.includes('budi'), 'nama masih kebaca: ' + r));

check('Email subdomain', 'notify: ops-team@sub.domain.example.com', ALL_ON,
  r => assert.ok(!r.includes('ops-team'), 'local-part masih kebaca: ' + r));

/* ===================== CREDENTIALS ===================== */
check('password= tanpa spasi', 'password=SuperSecret123', ALL_ON,
  r => assert.strictEqual(r, 'password=xxxxxxxxxxxxxx'));

check('PASSWORD: dengan spasi setelah titik dua', 'PASSWORD: Sup3r', ALL_ON,
  r => assert.ok(!r.includes('Sup3r'), 'value password masih kebaca: ' + r));

check('api_key= dengan underscore', 'api_key=sk_live_51H8xyz', ALL_ON,
  r => assert.ok(!r.includes('sk_live'), 'api key masih kebaca: ' + r));

check('cred mati -> password tetap plain', 'password=rahasia', { ...ALL_ON, cred: false },
  r => assert.strictEqual(r, 'password=rahasia'));

/* ===================== KNOWN LIMITATIONS (dokumentasi, bukan lolos/gagal keras) ===================== */
check('[KNOWN ISSUE] value berspasi & bertanda kutip cuma ke-mask sebagian',
  'DB_PASSWORD="quoted pass 123"', ALL_ON,
  r => {
    // saat ini regex \S+ berhenti di spasi pertama, jadi "pass 123"" masih polos
    assert.ok(r.includes('pass 123'), 'ternyata sudah fixed, update test ini');
  });

check('[BUG NYATA] regex port collision dengan alamat IPv6', 'fe80::1ff:fe23:4567:890a', ALL_ON,
  r => assert.strictEqual(r, 'fe80::1ff:fe23:4567:890a',
    'regex port (:(\\d{2,5})\\b) salah nangkep ":4567" di tengah IPv6 sebagai port -> ' + r));

check('[KNOWN ISSUE / FALSE POSITIVE] versioning mirip IP ikut ke-mask', 'version 1.2.3.4 release', ALL_ON,
  r => assert.ok(r.includes('x.x.x.x'), 'ternyata sudah tidak false-positive, update test ini'));

/* ===================== BUG FIXES ROUND 2 (dari laporan manual testing) ===================== */
check('[FIXED] spasi setelah separator credential tidak boleh hilang', 'PASSWORD: Sup3r$ecret!', ALL_ON,
  r => assert.strictEqual(r, 'PASSWORD: xxxxx$xxxxx!'));

check('[FIXED] spasi setelah separator token tidak boleh hilang', 'token: abc.def.ghi', ALL_ON,
  r => assert.strictEqual(r, 'token: xxx.xxx.xxx'));

check('[FIXED] -P kapital (mysql style) ikut ke-mask', 'mysql -h host -P 3306', ALL_ON,
  r => assert.ok(r.includes('-P xxxx'), 'port -P kapital tidak ke-mask: ' + r));

check('[FIXED] -pMyPass123 (password nempel tanpa spasi, gaya mysql) ke-mask', 'mysql -u admin -pMyPass123 --host=x', ALL_ON,
  r => assert.ok(!r.includes('MyPass123'), 'password nempel masih kebaca: ' + r));

/* ===================== SUMMARY ===================== */
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
