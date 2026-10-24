import puppeteer from 'puppeteer-core'
const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox'],headless:true})
const p=await b.newPage(); await p.setViewport({width:1400,height:1100})
await p.goto('https://aireadalong.com/auth/login',{waitUntil:'networkidle2'})
await p.type('input[type=email]',process.env.BZA_TEST_EMAIL)
await p.type('input[type=password]',process.env.BZA_TEST_PASSWORD)
await p.click('button[type=submit]'); await new Promise(r=>setTimeout(r,6000))
await p.goto('https://aireadalong.com/learn',{waitUntil:'networkidle2'})
await new Promise(r=>setTimeout(r,5000))
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Concepts');b&&b.click()})
await new Promise(r=>setTimeout(r,3500))
const read=async(tag)=>{
  const v=await p.evaluate(()=>{
    const h=[...document.querySelectorAll('h3')].find(x=>/What you have claimed/.test(x.textContent))
    if(!h)return{err:'no heading'}
    const box=h.parentElement.parentElement
    return{count:box.innerText.match(/\d+ open(?:, \d+ settled)?/)?.[0]??null,
      rows:[...box.querySelectorAll('li')].map(li=>li.innerText.replace(/\n/g,' | '))}})
  console.log(`\n[${tag}] count=${v.count}`); (v.rows||[]).forEach(r=>console.log('   ',r))
  return v}
await read('after claim, WITHOUT reload')
await p.reload({waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,4500))
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Concepts');b&&b.click()})
await new Promise(r=>setTimeout(r,3000))
const v=await read('after reload')
console.log('   subjects:',[...new Set((v.rows||[]).map(r=>(r.split(' | ')[1]||'').split(' · ')[0]))].join(' / '))
const first=(v.rows||[])[0]?.split(' | ')[0]
if(first){
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Withdraw/.test(x.textContent));b&&b.click()})
  await new Promise(r=>setTimeout(r,5000))
  const a=await read(`after withdrawing "${first}"`)
}
await p.screenshot({path:'/tmp/claims.png'})
await b.close()
