const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if certs directory exists
const certsDir = './certs';
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

console.log('Generating self-signed SSL certificates...');

try {
  // Generate private key
  execSync('openssl genrsa -out certs/key.pem 2048', { stdio: 'inherit' });
  
  // Generate certificate
  execSync('openssl req -new -x509 -key certs/key.pem -out certs/cert.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
  
  console.log('✅ SSL certificates generated successfully!');
  console.log('📁 Certificates saved in: ./certs/');
  console.log('🔐 Key file: certs/key.pem');
  console.log('📜 Cert file: certs/cert.pem');
  
} catch (error) {
  console.error('❌ Error generating certificates:', error.message);
  console.log('\n📋 Alternative methods:');
  console.log('1. Install OpenSSL: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('2. Use mkcert: https://github.com/FiloSottile/mkcert');
  console.log('3. Use online certificate generators');
  
  // Create dummy certificates for development
  console.log('\n🔄 Creating dummy certificates for development...');
  
  const dummyKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu
NMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ
-----END PRIVATE KEY-----`;

  const dummyCert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK7L5Jj5QkMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTkwNzE5MTQ0NzQ5WhcNMjAwNzE4MTQ0NzQ5WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAu1SU1LfVLPHCozMxH2Mo4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onL
Rnrq0/IzW7yWR7QkrmBL7jTKEn5u+qKhbwKfBstIs+bMY2Zkp18gnTxKLxoS2tFc
zGkPLPgizskuemMghRniWQIDAQABo1AwTjAdBgNVHQ4EFgQU8tCRr5R9yJqXvEj
pFmWiYEF0rIwHwYDVR0jBBgwFoAU8tCRr5R9yJqXvEjpFmWiYEF0rIwDAYDVR0T
BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAk8Vc3J5I5h+6z6fCxCwLJ8fSAyLm
-----END CERTIFICATE-----`;

  fs.writeFileSync('certs/key.pem', dummyKey);
  fs.writeFileSync('certs/cert.pem', dummyCert);
  
  console.log('✅ Dummy certificates created for development');
  console.log('⚠️  Note: These are dummy certificates for development only');
  console.log('🌐 For production, use proper SSL certificates');
}
