import {expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

export function screenAudit(filename='acceptance-summary.json'){
  const report={screens:[],keyboard:false,complete:false,passed:false};
  mkdirSync('artifacts',{recursive:true});
  const save=()=>writeFileSync('artifacts/'+filename,JSON.stringify(report,null,2)+'\n');
  return {
    async capture(page,name){
      for(const width of [390,1440]){
        await page.setViewportSize({width,height:width===390?844:1000});
        const result=await page.evaluate(()=>{
          const parse=value=>{const a=(value.match(/[\d.]+/g)||[]).map(Number);return [a[0]||0,a[1]||0,a[2]||0,a[3]??1];};
          const blend=(fore,back)=>fore.slice(0,3).map((v,i)=>v*fore[3]+back[i]*(1-fore[3]));
          const lum=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
          const selector=el=>el.tagName.toLowerCase()+(el.classList.length?'.'+[...el.classList].join('.'): '');
          const contrast=[];const seen=new Set();
          const check=(el,color,part='text')=>{
            const style=getComputedStyle(el);let background=[255,255,255];const parents=[];for(let p=el;p;p=p.parentElement)parents.unshift(p);
            for(const parent of parents)background=blend(parse(getComputedStyle(parent).backgroundColor),background);
            const foreground=blend(parse(color),background);const l1=lum(foreground),l2=lum(background);const ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
            const large=parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&parseInt(style.fontWeight,10)>=700),required=large?3:4.5;
            if(ratio<required)contrast.push({selector:selector(el),part,foreground:color,background:background.map(Math.round),ratio:Number(ratio.toFixed(2)),required});
          };
          const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
          while(walker.nextNode()){
            const node=walker.currentNode,el=node.parentElement;if(!node.textContent.trim()||!el||seen.has(el))continue;seen.add(el);
            const style=getComputedStyle(el),rect=el.getBoundingClientRect();
            if(!rect.width||!rect.height||rect.bottom<0||style.visibility==='hidden'||el.closest('[aria-hidden="true"],:disabled,script,style'))continue;
            check(el,style.color);
          }
          for(const el of document.querySelectorAll('input[placeholder]'))if(!el.value&&!el.disabled&&el.getClientRects().length)check(el,getComputedStyle(el,'::placeholder').color,'placeholder');
          const unnamed=[...document.querySelectorAll('input:not([type="hidden"]),select,button,a[href]')].filter(el=>{
            if(!el.getClientRects().length||el.disabled)return false;
            return !(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')||[...(el.labels||[])].map(l=>l.textContent).join('').trim()||(['BUTTON','A'].includes(el.tagName)?el.textContent.trim():''));
          }).map(selector);
          return {horizontal_overflow:document.documentElement.scrollWidth>innerWidth,contrast,unnamed_controls:unnamed};
        });
        report.screens.push({name,width,...result});save();
        await page.screenshot({path:`artifacts/acceptance-${name}-${width}.png`,fullPage:true});
      }
    },
    async keyboard(page){
      const skip=page.getByRole('link',{name:'Ir al contenido'});await skip.focus();
      await expect(skip).toBeFocused();
      expect(await skip.evaluate(el=>el.getBoundingClientRect().top>=0)).toBe(true);
      await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();
      const search=page.getByLabel('Buscar por título o autor');await search.focus();
      const focused=await search.evaluate(el=>({style:getComputedStyle(el).outlineStyle,width:parseFloat(getComputedStyle(el).outlineWidth)}));
      expect(focused.style).not.toBe('none');expect(focused.width).toBeGreaterThan(0);
      await page.keyboard.press('Tab');await expect(page.getByLabel('Categoría',{exact:true})).toBeFocused();
      await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Buscar',exact:true})).toBeFocused();
      await page.keyboard.press('Enter');report.keyboard=true;save();
    },
    finish(){report.complete=true;report.passed=report.keyboard&&report.screens.every(s=>!s.horizontal_overflow&&!s.contrast.length&&!s.unnamed_controls.length);save();expect(report.passed).toBe(true);}
  };
}
