import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+naEAAAAASUVORK5CYII=','base64');
test('Real React Laravel PostgreSQL journey',async({page},info)=>{
  const stage=name=>info.annotations.push({type:'stage',description:name});
  const runtimeErrors=[];page.on('pageerror',()=>runtimeErrors.push(true));
  const login=async(username,password)=>{await page.getByLabel('Usuario',{exact:true}).fill(username);await page.getByLabel('Contraseña',{exact:true}).fill(password);await page.getByRole('button',{name:'Entrar a la biblioteca'}).click();await expect(page.getByRole('heading',{name:'Catálogo de libros'})).toBeVisible();};
  stage('trusted-tls-login');
  const response=await page.goto('/');expect(response.ok()).toBe(true);expect((await response.securityDetails()).issuer).toBe('Manager Library Local CA');
  await login(process.env.ADMIN_USERNAME,process.env.ADMIN_PASSWORD);

  stage('book-create');
  await page.getByRole('button',{name:'Nuevo libro',exact:true}).click();
  const create=page.locator('section.panel').filter({has:page.getByRole('heading',{name:'Nuevo libro',exact:true})});
  const title='Lecturas de integración';
  await create.getByLabel('Título',{exact:true}).fill(title);await create.getByLabel('Autor',{exact:true}).fill('Autora de prueba');
  await create.getByLabel('ISBN (13 dígitos)').fill(String(Date.now()).slice(-13));
  await create.getByLabel('Categoría',{exact:true}).selectOption({label:'Novela'});
  await create.getByLabel('Total de ejemplares').fill('2');
  const created=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/api/v1/books');
  await create.getByRole('button',{name:'Guardar',exact:true}).click();
  const bookResponse=await created;expect(bookResponse.status()).toBe(201);const book=await bookResponse.json();
  await page.getByRole('button').filter({has:page.getByRole('heading',{name:title,exact:true})}).click();
  stage('cover-upload');
  await page.getByLabel('Portada JPEG o PNG · máximo 2 MB').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:png});
  const uploaded=page.waitForResponse(r=>r.request().method()==='PUT'&&new URL(r.url()).pathname===`/api/v1/books/${book.id}/cover`);
  await page.getByRole('button',{name:'Guardar portada'}).click();expect((await uploaded).status()).toBe(200);
  await expect(page.getByAltText(`Portada de ${title}`)).toBeVisible();

  stage('member-create');
  await page.getByRole('link',{name:'Socios',exact:true}).click();await page.getByRole('button',{name:'Nuevo socio'}).click();
  await page.getByLabel('Nombre completo').fill('Socia de integración');await page.getByLabel('Documento',{exact:true}).fill('INTEGRATION-1');
  const memberCreated=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/api/v1/members');
  await page.getByRole('button',{name:'Guardar',exact:true}).click();const memberResponse=await memberCreated;expect(memberResponse.status()).toBe(201);const member=await memberResponse.json();

  stage('loan-return');
  await page.getByRole('link',{name:'Préstamos',exact:true}).click();await page.getByRole('button',{name:'Nuevo préstamo'}).click();
  await page.getByLabel('Buscar socio para el préstamo').fill('Socia de integración');
  await page.getByRole('button',{name:/Socia de integración INTEGRATION-1/}).click();
  await page.getByLabel('Buscar libro para prestar').fill('Lecturas de integración');
  const choice=page.getByRole('button',{name:/Lecturas de integración Autora de prueba/});await choice.click();await choice.click();
  await expect(page.getByText('1 de 3 libros seleccionados')).toBeVisible();
  const loanCreated=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/api/v1/loans');
  await page.getByRole('button',{name:'Confirmar préstamo'}).click();const loanResponse=await loanCreated;expect(loanResponse.status()).toBe(201);const loan=await loanResponse.json();
  await page.getByRole('button',{name:'Devolver ejemplar'}).click();await expect(page.getByRole('button',{name:'Devolver ejemplar'})).toHaveCount(0);
  await expect(page.getByText('Cerrado',{exact:true}).first()).toBeVisible();

  stage('report');
  await page.getByRole('link',{name:'Reporte',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Libros más prestados',exact:true})).toBeVisible();
  const from=new Date(Date.now()-86400000).toISOString().slice(0,10),to=new Date(Date.now()+86400000).toISOString().slice(0,10);
  await page.getByLabel('Desde',{exact:true}).fill(from);await page.getByLabel('Hasta',{exact:true}).fill(to);
  const reportReady=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/v1/reports/most-borrowed');
  await page.getByRole('button',{name:'Consultar reporte'}).click();
  const reportResponse=await reportReady;
  console.log('::notice::Report HTTP status: '+reportResponse.status());
  expect(reportResponse.status()).toBe(200);
  const reportBody=await reportResponse.json();
  console.log('::notice::Report row count: '+(Array.isArray(reportBody.rows)?reportBody.rows.length:0));
  expect(reportBody.rows.some(row=>row.book_title===title)).toBe(true);
  await expect(page.getByRole('cell',{name:title,exact:true})).toBeVisible();

  stage('librarian-account');
  await page.getByRole('link',{name:'Bibliotecarios',exact:true}).click();
  await page.getByLabel('Nombre de usuario').fill('integration-librarian');await page.getByLabel('Contraseña inicial').fill(process.env.TEST_PASSWORD);
  await page.getByRole('button',{name:'Crear cuenta'}).click();await expect(page.getByText('Cuenta creada: integration-librarian.')).toBeVisible();
  await page.getByRole('button',{name:'Cerrar sesión'}).click();await login('integration-librarian',process.env.TEST_PASSWORD);
  await expect(page.getByRole('link',{name:'Reporte',exact:true})).toHaveCount(0);await expect(page.getByRole('link',{name:'Bibliotecarios',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Nuevo libro',exact:true})).toHaveCount(0);

  stage('desktop-mobile-layout');
  mkdirSync('artifacts',{recursive:true});
  await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();await page.screenshot({path:'artifacts/catalog-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'artifacts/catalog-mobile.png',fullPage:true});expect(runtimeErrors.length).toBe(0);
  writeFileSync('artifacts/persistence.json',JSON.stringify({book_id:book.id,member_id:member.id,loan_id:loan.id,cover:png.toString('base64')}));
});
