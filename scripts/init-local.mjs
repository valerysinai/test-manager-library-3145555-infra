import {randomBytes} from 'node:crypto';
import {existsSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const tls=join(root,'.local','tls');
try {
  if(existsSync(join(root,'.env'))||existsSync(tls)) throw new Error();
  const temporary=join(root,'.local','pending-'+randomBytes(8).toString('hex'));
  mkdirSync(temporary,{recursive:true,mode:0o700});
  const gitOpenSsl='C:/Program Files/Git/usr/bin/openssl.exe';
  const openssl=process.env.OPENSSL_BIN||(process.platform==='win32'&&existsSync(gitOpenSsl)?gitOpenSsl:'openssl');
  const run=args=>execFileSync(openssl,args,{cwd:temporary,stdio:'ignore'});
  run(['req','-x509','-newkey','rsa:3072','-nodes','-days','365','-subj','/CN=Manager Library Local CA',
    '-addext','basicConstraints=critical,CA:TRUE','-addext','keyUsage=critical,keyCertSign,cRLSign',
    '-keyout','root-ca-key.pem','-out','root-ca.pem']);
  run(['req','-new','-newkey','rsa:2048','-nodes','-subj','/CN=localhost','-keyout','key.pem','-out','request.csr']);
  writeFileSync(join(temporary,'extensions.cnf'),'subjectAltName=DNS:localhost,DNS:gateway,IP:127.0.0.1\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n',{mode:0o600});
  run(['x509','-req','-in','request.csr','-CA','root-ca.pem','-CAkey','root-ca-key.pem','-CAcreateserial','-days','30','-extfile','extensions.cnf','-out','certificate.pem']);
  const env=['COMPOSE_PROJECT_NAME=manager-library','DB_DATABASE=library','DB_USERNAME=library',
    'DB_PASSWORD='+randomBytes(24).toString('hex'),'JWT_SECRET='+randomBytes(32).toString('hex'),
    'ADMIN_USERNAME=library-admin','ADMIN_PASSWORD='+randomBytes(24).toString('hex'),
    'APP_ENV=production','CLOCK_MODE=system','HTTPS_PORT=8443','PUBLIC_ORIGIN=https://localhost:8443','TLS_DIR=./.local/tls',''];
  writeFileSync(join(root,'.env'),env.join('\n'),{flag:'wx',mode:0o600});
  renameSync(temporary,tls);
  console.log('Configuración local y certificados creados. Credenciales solo en .env; no se instaló confianza global.');
} catch {
  console.error('No se pudo preparar el entorno. Revisa OpenSSL y que .env/.local/tls no existan; no se sobrescribe configuración.');
  process.exitCode=1;
}
