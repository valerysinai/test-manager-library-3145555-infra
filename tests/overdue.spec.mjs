import {test,expect} from '@playwright/test';
import {screenAudit} from './screen-audit.mjs';

test('Real overdue screen blocking and return',async({page},info)=>{
  const audit=screenAudit('overdue-summary.json');
  info.annotations.push({type:'stage',description:'overdue-login'});
  await page.goto('/');await page.getByLabel('Usuario',{exact:true}).fill(process.env.ADMIN_USERNAME);await page.getByLabel('Contraseña',{exact:true}).fill(process.env.ADMIN_PASSWORD);
  await page.getByRole('button',{name:'Entrar a la biblioteca'}).click();await expect(page.getByRole('heading',{name:'Catálogo de libros'})).toBeVisible();await audit.keyboard(page);
  info.annotations.push({type:'stage',description:'overdue-populated'});
  await page.getByRole('link',{name:'Vencidos',exact:true}).click();await expect(page.getByRole('cell',{name:'Lecturas de integración',exact:true})).toBeVisible();
  await expect(page.getByRole('cell',{name:'1',exact:true})).toBeVisible();await audit.capture(page,'overdue-populated');
  await page.getByRole('link',{name:'Préstamos',exact:true}).click();await page.getByRole('button',{name:'Nuevo préstamo',exact:true}).click();
  await page.getByLabel('Buscar socio para el préstamo').fill('Socia de integración');await page.getByRole('button',{name:/Socia de integración INTEGRATION-1/}).click();
  await page.getByLabel('Buscar libro para prestar').fill('Lecturas de integración');await page.getByRole('button',{name:/Lecturas de integración Autora de prueba/}).click();
  const rejected=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/api/v1/loans');await page.getByRole('button',{name:'Confirmar préstamo'}).click();
  const result=await rejected;expect(result.status()).toBe(409);expect((await result.json()).code).toBe('MEMBER_HAS_OVERDUE');await expect(page.getByRole('alert')).toBeVisible();await audit.capture(page,'loan-overdue-blocked');
  info.annotations.push({type:'stage',description:'overdue-return'});
  await page.getByRole('link',{name:'Vencidos',exact:true}).click();await page.getByRole('button',{name:'Ver y devolver',exact:true}).click();await page.getByRole('button',{name:'Devolver ejemplar',exact:true}).click();
  await expect(page.getByText('No hay libros vencidos.')).toBeVisible();await audit.capture(page,'overdue-returned');audit.finish();
});
