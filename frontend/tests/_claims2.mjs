import puppeteer from 'puppeteer-core'
const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox'],headless:true})
const p=await b.newPage(); await p.setViewport({width:1280,height:1100})
const errs=[]; p.on('response',r=>{if(r.status()>=500)errs.push(`${r.status()} ${r.url().slice(0,80)}`)})
await p.goto('https://aireadalong.com/auth/login',{waitUntil:'networkidle2'})
await p.type('input[type=email]',process.env.BZA_TEST_EMAIL)
await p.type('input[type=password]',process.env.BZA_TEST_PASSWORD)
await p.click('button[type=submit]'); await new Promise(r=>setTimeout(r,6000))
await p.goto('https://aireadalong.com/learn',{waitUntil:'networkidle2'})
await new Promise(r=>setTimeout(r,4000))
// Seed a chain claim through the real endpoint, from the authed page context.
const seeded=await p.evaluate(async()=>{
  const t=JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('auth-token'))||'{}'))
  const jwt=t?.access_token
  const r=await fetch('/api/learn/claims',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${jwt}`},
    body:JSON.stringify({subject:'rational-expressions',conceptId:'combining-rational',scope:'chain'})})
  return r.json()
})
console.log('chain claim ->',seeded.counts?JSON.stringify(seeded.counts):JSON.stringify(seeded).slice(0,200))
await p.reload({waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,4500))
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Concepts');b&&b.click()})
await new Promise(r=>setTimeout(r,2500))
const view=await p.evaluate(()=>{
  const h=[...document.querySelectorAll('h3')].find(x=>/What you have claimed/.test(x.textContent))
  const box=h?.closest('div')?.parentElement
  const lis=[...(box?.querySelectorAll('li')||[])].map(li=>li.innerText.replace(/\n/g,' | '))
  const count=box?.innerText.match(/(\d+) open(?:, (\d+) settled)?/)?.[0]
  return {count,rows:lis}})
console.log('count:',view.count)
console.log('rows:'); view.rows.forEach(r=>console.log('  ',r))
const subjects=new Set(view.rows.map(r=>r.split(' | ')[1]?.split(' · ')[0]))
console.log('distinct subjects shown:',[...subjects].join(' / '))
// Withdraw the first
const name=view.rows[0]?.split(' | ')[0]
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Withdraw/.test(x.textContent));b&&b.click()})
await new Promise(r=>setTimeout(r,4500))
const after=await p.evaluate(n=>{
  const li=[...document.querySelectorAll('li')].find(x=>x.innerText.startsWith(n))
  const h=[...document.querySelectorAll('h3')].find(x=>/What you have claimed/.test(x.textContent))
  return{row:li?li.innerText.replace(/\n/g,' | '):'(gone)',count:h?.closest('div')?.parentElement?.innerText.match(/(\d+) open(?:, (\d+) settled)?/)?.[0]}},name)
console.log(`withdrew "${name}" -> ${after.row}`)
console.log('count now:',after.count)
await p.screenshot({path:'/tmp/claims.png'})
console.log('5xx:',errs.length?errs.join(', '):'(none)')
await b.close()
