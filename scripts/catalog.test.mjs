import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,build,validate} from './build.mjs';
const source=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog.json'),'utf8'));
test('catalog rejects unsafe links, duplicate URLs, and missing real affiliate destinations',()=>{
 for(const mutate of [c=>c.products[0].affiliateUrl='javascript:alert(1)',c=>c.products[1].slug=c.products[0].slug,c=>c.products[0].sample=false,c=>c.products[0].image='/../catalog.json']){const c=structuredClone(source);mutate(c);assert.throws(()=>validate(c));}
});
test('real and archived product pages preserve useful links and generate safe sharing metadata',()=>{
 const c=structuredClone(source);c.settings.origin='https://example.pages.dev';const p=c.products[0];p.sample=false;p.affiliateUrl='https://www.example.com/product?tag=test&size=m';p.retailer='Example retailer';p.title='<script>alert(1)</script>';c.products[1].active=false;
 try{build(c);const html=fs.readFileSync(path.join(ROOT,'dist/products',p.slug,'index.html'),'utf8');assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('rel="sponsored nofollow noopener noreferrer"'));assert.ok(html.includes('https://example.pages.dev/products/'+p.slug+'/'));assert.ok(html.includes('https://example.pages.dev/assets/knit.jpg'));const archived=fs.readFileSync(path.join(ROOT,'dist/products',c.products[1].slug,'index.html'),'utf8');assert.ok(archived.includes('This find is no longer featured.'));assert.ok(archived.includes('noindex,follow'));assert.ok(fs.readFileSync(path.join(ROOT,'dist/sitemap.xml'),'utf8').includes(p.slug));assert.ok(!fs.readFileSync(path.join(ROOT,'dist/index.html'),'utf8').includes('data-product="'+c.products[1].slug+'"'));}finally{build(source);}
});
test('sample catalog is labeled, excludes real shopping CTAs, and does not publish admin source',()=>{
 const html=fs.readFileSync(path.join(ROOT,'dist/index.html'),'utf8');assert.ok(html.includes('Sample inspiration'));assert.ok(html.includes('noindex,follow'));const p=fs.readFileSync(path.join(ROOT,'dist/products',source.products[0].slug,'index.html'),'utf8');assert.ok(!p.includes('rel="sponsored'));for(const f of ['catalog.json','templates','scripts','manage.html','.git'])assert.ok(!fs.existsSync(path.join(ROOT,'dist',f)));
});
