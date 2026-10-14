import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
try {
  const config=JSON.parse(execFileSync('docker',['compose','config','--format','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  const {services:s,networks:n}=config;
  assert.deepEqual(Object.keys(s).sort(),['api','app','db','gateway','migrate']);
  for(const service of ['api','app','db','migrate']) assert.equal(s[service].ports,undefined);
  assert.equal(s.gateway.ports.length,1);assert.equal(s.gateway.ports[0].host_ip,'127.0.0.1');assert.equal(s.gateway.ports[0].target,443);
  assert.equal(n.data.internal,true);assert.equal(n.services.internal,true);
  assert.equal(s.api.depends_on.migrate.condition,'service_completed_successfully');
  assert.equal(s.migrate.depends_on.db.condition,'service_healthy');
  assert.deepEqual(s.migrate.command,['php','artisan','migrate','--force','--no-interaction']);
  assert(s.db.image.startsWith('postgres:16@sha256:'));
  assert(s.db.volumes.every(v=>v.type==='volume'&&v.target==='/var/lib/postgresql/data'));
  assert(s.api.volumes.some(v=>v.type==='volume'&&v.target==='/app/storage/app/private/covers'));
  assert(s.gateway.volumes.every(v=>v.read_only));assert(s.gateway.volumes.every(v=>!v.source.includes('root-ca-key')));
  assert.equal(s.app.environment,undefined);
  assert.equal(s.api.environment.CORS_ORIGIN,s.api.environment.APP_URL);
  assert.equal(s.api.environment.APP_DEBUG,'false');
  const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
  const ddl=new RegExp('\\b(?:CREATE|ALTER|DROP)\\s+(?:TABLE|SCHEMA|INDEX|EXTENSION)\\b','i');
  for(const path of tracked) assert(!ddl.test(readFileSync(path,'utf8')),'Infra must delegate schema ownership');
  assert(!readFileSync('compose.yaml','utf8').includes('docker-entrypoint-initdb.d'));
  console.log('Compose: isolated ports/networks, persistent volumes, API-owned migrations and tracked DDL boundary verified.');
} catch {
  console.error('Compose configuration or ownership verification failed. Expanded configuration is intentionally not printed.');
  process.exitCode=1;
}
