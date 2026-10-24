import puppeteer from 'puppeteer-core'
const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox'],headless:true})
const p=await b.newPage(); await p.setViewport({width:1400,height:1100})
p.on('dialog',async d=>{console.log('   confirm:',d.message().slice(0,90).replace(/\n/g,' '));await d.accept()})
const errs=[]; p.on('response',r=>{if(r.status()>=500)errs.push(`${r.status()} ${r.url().slice(0,80)}`)})
await p.goto('https://aireadalong.com/auth/login',{waitUntil:'networkidle2'})
await p.type('input[type=email]',process.env.BZA_TEST_EMAIL)
await p.type('input[type=password]',process.env.BZA_TEST_PASSWORD)
await p.click('button[type=submit]'); await new Promise(r=>setTimeout(r,6000))
await p.goto('https://aireadalong.com/learn',{waitUntil:'networkidle2'})
await new Promise(r=>setTimeout(r,5000))
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Concepts');b&&b.click()})
await new Promise(r=>setTimeout(r,3000))
// Click a graph node by its label text
const picked=await p.evaluate(()=>{
  const t=[...document.querySelectorAll('svg text')]
  const n=t.find(x=>/Divisibility|Negative numbers|Order of operations/i.test(x.textContent))
  if(!n)return {labels:t.map(x=>x.textContent).slice(0,20)}
  const g=n.closest('g'); g?.dispatchEvent(new MouseEvent('click',{bubbles:true}))
  return n.textContent})
console.log('clicked node:',picked)
await new Promise(r=>setTimeout(r,1500))
const chainBtn=await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/I know this and the \d+ under it/.test(x.textContent));return b?b.textContent.trim():null})
console.log('chain button:',chainBtn)
if(chainBtn){
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/I know this and the \d+ under it/.test(x.textContent));b.click()})
  await new Promise(r=>setTimeout(r,6000))
}
const note=await p.evaluate(()=>[...document.querySelectorAll('p')].map(x=>x.textContent).find(t=>/open to practise now|already had live claims/.test(t||'')))
console.log('effect:',note?note.slice(0,150):'(none)')
const view=await p.evaluate(()=>{
  const h=[...document.querySelectorAll('h3')].find(x=>/What you have claimed/.test(x.textContent))
  const box=h?.parentElement?.parentElement
  return{count:box?.innerText.match(/\d+ open(?:, \d+ settled)?/)?.[0],
    rows:[...(box?.querySelectorAll('li')||[])].map(li=>li.innerText.replace(/\n/g,' | '))}})
console.log('count:',view.count); view.rows.forEach(r=>console.log('   ',r))
console.log('distinct subjects:',[...new Set(view.rows.map(r=>(r.split(' | ')[1]||'').split(' · ')[0]))].join(' / '))
const first=view.rows[0]?.split(' | ')[0]
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Withdraw/.test(x.textContent));b&&b.click()})
await new Promise(r=>setTimeout(r,5000))
const after=await p.evaluate(n=>{
  const h=[...document.querySelectorAll('h3')].find(x=>/What you have claimed/.test(x.textContent))
  const box=h?.parentElement?.parentElement
  const li=[...(box?.querySelectorAll('li')||[])].find(x=>x.innerText.startsWith(n))
  return{count:box?.innerText.match(/\d+ open(?:, \d+ settled)?/)?.[0],row:li?li.innerText.replace(/\n/g,' | '):'(not found)'}},first)
console.log(`\nwithdrew "${first}"`); console.log('   row now:',after.row); console.log('   count now:',after.count)
await p.screenshot({path:'/tmp/claims.png'})
console.log('5xx:',errs.length?errs.join(', '):'(none)')
await b.close()
