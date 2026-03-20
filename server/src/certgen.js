const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

const CERTS_DIR = path.join(__dirname, '..', 'certs');
const KEY_PATH = path.join(CERTS_DIR, 'server.key');
const CERT_PATH = path.join(CERTS_DIR, 'server.cert');

function ensureCerts() {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    return {
      key: fs.readFileSync(KEY_PATH, 'utf8'),
      cert: fs.readFileSync(CERT_PATH, 'utf8'),
    };
  }

  console.log('Generating self-signed SSL certificate...');
  fs.mkdirSync(CERTS_DIR, { recursive: true });

  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 10);

  const attrs = [
    { name: 'commonName', value: 'hussle-terminal' },
    { name: 'organizationName', value: 'Hussle' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  cert.setExtensions([
    { name: 'subjectAltName', altNames: [
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' },
    ]},
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  const pemKey = forge.pki.privateKeyToPem(keys.privateKey);
  const pemCert = forge.pki.certificateToPem(cert);

  fs.writeFileSync(KEY_PATH, pemKey);
  fs.writeFileSync(CERT_PATH, pemCert);
  console.log('SSL certificate generated.');

  return { key: pemKey, cert: pemCert };
}

module.exports = { ensureCerts };
