import puppeteer from 'puppeteer-core'
const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox'],headless:true})
const p=await b.newPage(); await p.setViewport({width:1400,height:1100})
p.on('dialog',async d=>await d.accept())
p.on('response',async r=>{
  if(!r.url().includes('/api/learn/claims'))return
  let body=''; try{body=(await r.text()).slice(0,300)}catch{}
  console.log(`\n>> ${r.request().method()} ${r.url().replace('https://aireadalong.com','')} -> ${r.status()}`)
  console.log('   ',body)})
await p.goto('https://aireadalong.com/auth/login',{waitUntil:'networkidle2'})
await p.type('input[type=email]',process.env.BZA_TEST_EMAIL)
await p.type('input[type=password]',process.env.BZA_TEST_PASSWORD)
await p.click('button[type=submit]'); await new Promise(r=>setTimeout(r,6000))
await p.goto('https://aireadalong.com/learn',{waitUntil:'networkidle2'})
await new Promise(r=>setTimeout(r,5000))
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Concepts');b&&b.click()})
await new Promise(r=>setTimeout(r,3500))
console.log('\n--- clicking a node + chain claim ---')
const picked=await p.evaluate(()=>{
  const n=[...document.querySelectorAll('svg text')].find(x=>/Divisibility|Negative numbers|Order of operations/i.test(x.textContent))
  n?.closest('g')?.dispatchEvent(new MouseEvent('click',{bubbles:true})); return n?.textContent})
console.log('node:',picked)
await new Promise(r=>setTimeout(r,1500))
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/I know this and the \d+ under it/.test(x.textContent));b&&b.click()})
await new Promise(r=>setTimeout(r,7000))
const notes=await p.evaluate(()=>[...document.querySelectorAll('p,div')].map(x=>x.textContent||'').filter(t=>/open to practise|already had live|could not claim/.test(t)).slice(0,2))
console.log('\nclaim note on page:',JSON.stringify(notes))
await b.close()
