// A strict local API double catches unsupported calls and navigation errors.
// This is not a substitute for running the plugin in Figma.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const D=require('./design.js');const build=require('./figma-runtime.js');
function api(available=true){
 let seq=0;const nodes=new Map(),variables=[],styles=[],loaded=new Set();
 class Node{
  constructor(type){this.id='n:'+ ++seq;this.type=type;this.name=type;this.children=[];this.parent=null;this.width=100;this.height=40;this.x=0;this.y=0;this.fills=[];this.strokes=[];this.boundVariables={};this.definitions={};this.reactions=[];this.data={};this._textAutoResize='NONE';nodes.set(this.id,this);for(const prop of ['overlayPositionType','overlayBackground','overlayBackgroundInteraction'])Object.defineProperty(this,prop,{get(){return null},set(){throw Error(prop+' is readonly');}});}
  appendChild(n){assert(n!==this);if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}
  resize(w,h){assert(w>0&&h>0,'positive bounds');this.width=w;this.height=h;this.primaryAxisSizingMode='FIXED';this.counterAxisSizingMode='FIXED';if(this.type==='TEXT')this._textAutoResize='NONE';}
  set textAutoResize(value){this._textAutoResize=value;if(value==='HEIGHT')this.height=Math.max(this.height,this.lineHeight?.value||22);}
  get textAutoResize(){return this._textAutoResize;}
  set overflowDirection(value){assert(['NONE','HORIZONTAL','VERTICAL','BOTH'].includes(value),'Invalid Figma overflowDirection: '+value);this._overflowDirection=value;}
  get overflowDirection(){return this._overflowDirection||'NONE';}
  setPluginData(key,value){this.data[key]=value;}
  getPluginData(key){return this.data[key]||'';}
  rescale(factor){this.width*=factor;this.height*=factor;for(const child of this.children){child.x*=factor;child.y*=factor;child.rescale(factor);}}
  setBoundVariable(prop,v){assert(v?.id,'variable required');this.boundVariables[prop]=v.id;}
  findAll(fn){return this.children.flatMap(n=>[...(fn(n)?[n]:[]),...n.findAll(fn)]);}
  findAllWithCriteria(c){return this.findAll(n=>c.types.includes(n.type));}
  async setTextStyleIdAsync(id){assert.equal(this.type,'TEXT');const s=styles.find(s=>s.id===id);assert(s);assert(loaded.has(s.fontName.family+'/'+s.fontName.style),'font loaded');this.textStyleId=id;this.fontSize=s.fontSize;this.lineHeight=s.lineHeight;}
  addComponentProperty(name,type,value){assert.equal(this.type,'COMPONENT');const p=name+'#'+this.id;this.definitions[p]={type,defaultValue:value};return p;}
  get componentProperties(){return this.mainComponent?.definitions||{};}
  createInstance(){assert.equal(this.type,'COMPONENT');const clone=(source,parent)=>{const n=new Node(parent?'TEXT'===source.type?'TEXT':source.type:'INSTANCE');for(const p of ['name','width','height','characters','fontName','textStyleId','lineHeight','textAutoResize','componentPropertyReferences','layoutSizingHorizontal','layoutMode','primaryAxisSizingMode','counterAxisSizingMode','paddingTop','paddingBottom','paddingLeft','paddingRight'])if(source[p]!==undefined)n[p]=source[p];n.fills=source.fills.map(x=>({...x}));n.strokes=source.strokes.map(x=>({...x}));if(parent)parent.appendChild(n);for(const c of source.children)clone(c,n);return n;};const result=clone(this);result.mainComponent=this;return result;}
  setProperties(props){assert.equal(this.type,'INSTANCE');for(const [key,value]of Object.entries(props)){assert(this.mainComponent.definitions[key],'property exists');for(const n of this.findAll(n=>n.type==='TEXT'))if(n.componentPropertyReferences?.characters===key){n.characters=value;if(n.layoutSizingHorizontal==='FILL')n.width=this.width-(this.paddingLeft||0)-(this.paddingRight||0);}}}
  async setReactionsAsync(reactions){for(const r of reactions){assert(['ON_CLICK','ON_HOVER'].includes(r.trigger.type),'valid trigger');for(const a of r.actions){if(a.type==='CLOSE')continue;assert.equal(a.type,'NODE');const dest=nodes.get(a.destinationId);assert(dest,'destination exists');if(a.navigation==='CHANGE_TO')assert.equal(dest.type,'COMPONENT');else assert.equal(dest.parent?.type,'PAGE','navigation destination must be a top-level frame');assert(['CHANGE_TO','NAVIGATE','OVERLAY'].includes(a.navigation));}}this.reactions=reactions;}
 }
 const page=new Node('PAGE');page.flowStartingPoints=[];const original=new Node('FRAME');original.name='User-owned content';page.appendChild(original);original.x=400;original.y=800;
 const root=new Node('DOCUMENT');root.appendChild(page);let currentPage=page;const zooms=[],messages=[];
 function create(type){const n=new Node(type);currentPage.appendChild(n);return n;}
 return {root,get currentPage(){return currentPage;},async setCurrentPageAsync(p){assert.equal(p.type,'PAGE');currentPage=p;},createPage(){const p=new Node('PAGE');p.flowStartingPoints=[];root.appendChild(p);return p;},
 showUI(){},ui:{postMessage(message){messages.push(message);}},closePlugin(message){messages.push({type:'closed',message});},messages,zooms,listAvailableFontsAsync:async()=>available?['Regular','Bold'].map(style=>({fontName:{family:'Arial',style}})):[],loadFontAsync:async f=>loaded.add(f.family+'/'+f.style),
 variables:{createVariableCollection(name){const c={id:'c:'+ ++seq,name,defaultModeId:'warm',renameMode(){}};return c;},createVariable(name,c,type){assert(c.id,'collection object');const v={id:'v:'+ ++seq,name,type,values:{},setValueForMode(mode,value){this.values[mode]=value},setVariableCodeSyntax(platform,value){assert.equal(platform,'WEB');assert(value.startsWith('var(--'));}};variables.push(v);return v;},setBoundVariableForPaint(p,prop,v){assert.equal(prop,'color');assert(v);return {...p,boundVariables:{color:{id:v.id,type:'VARIABLE_ALIAS'}}};}},
 createFrame:()=>create('FRAME'),createRectangle:()=>create('RECTANGLE'),createText:()=>create('TEXT'),createComponent:()=>create('COMPONENT'),
 createTextStyle(){const s={id:'s:'+ ++seq};styles.push(s);return s;},createNodeFromSvg(svg){assert(svg.includes('<svg'));const root=create('FRAME');root.resize(24,24);root.appendChild(create('VECTOR'));root.children[0].resize(24,24);root.children[0].strokes=[{type:'SOLID'}];return root;},
 combineAsVariants(items,parent){const set=create('COMPONENT_SET');parent.appendChild(set);items.forEach(n=>set.appendChild(n));return set;},getNodeByIdAsync:async id=>nodes.get(id),viewport:{scrollAndZoomIntoView(frames){zooms.push(frames.map(n=>n.id));}},nodes,original,storedVariables:variables,styles};
}
(async()=>{
 const figma=api(),report=await build(figma,D);assert(report.completed);assert.equal(report.screenCount,D.screens.length);assert.equal(report.errors.length,0);assert.equal(report.warnings.length,0,report.warnings.join('\n'));
 assert(figma.currentPage.children.includes(figma.original),'existing content retained');assert.equal(figma.original.name,'User-owned content');
 assert.equal(new Set(report.createdNodeIds).size,report.createdNodeIds.length,'created IDs unique');
 const created=new Set(report.createdNodeIds);for(const n of figma.nodes.values())if(n!==figma.currentPage&&n!==figma.original&&n!==figma.root)assert(created.has(n.id),'untracked node '+n.id);
 assert.equal(figma.currentPage.flowStartingPoints.length,3);assert(figma.storedVariables.every(v=>Array.isArray(v.scopes)&&!v.scopes.includes('ALL_SCOPES')));
 const before=figma.nodes.size;await assert.rejects(build(figma,D),/sudah ada/);assert.equal(figma.nodes.size,before,'rerun made duplicate nodes');
 const nofont=api(false);await assert.rejects(build(nofont,D),/Font Regular/);assert.equal(nofont.nodes.size,3,'font preflight mutated canvas');
 const bad=structuredClone(D.screens);bad[0].body.push({kind:'button',label:'Broken target',target:'missing',variant:'primary'});const partialApi=api();let partial;try{await build(partialApi,{...D,screens:bad})}catch(e){partial=e.report;}assert(partial&&!partial.completed&&partial.createdNodeIds.length,'failed build reports exact partial node IDs');
 const texts=[...figma.nodes.values()].filter(n=>n.type==='TEXT');assert(texts.every(t=>t.textAutoResize==='HEIGHT'&&t.height>=18),'text must expand after sizing');
 const clickNodes=[...figma.nodes.values()].filter(n=>n.reactions.some(r=>r.trigger.type==='ON_CLICK'));assert.equal(clickNodes.length,report.linkCount);assert(clickNodes.every(n=>n.type==='FRAME'),'click targets stay on stable frames');assert(![...figma.nodes.values()].some(n=>n.reactions.some(r=>r.trigger.type==='ON_HOVER')),'hover must not replace click target');
 for(const [label,target]of [['Mulai sebagai mahasiswa','s-home'],['Mulai sebagai dosen','d-home']]){const button=clickNodes.find(n=>n.name==='Action / '+label);assert(button);assert.equal(button.reactions[0].actions[0].destinationId,report.screenIds[target]);}
 assert.deepEqual(new Set(figma.zooms.at(-1)),new Set(Object.values(report.screenIds)),'completion reveals every screen');
 const automatic=api();const originalPage=automatic.currentPage;
 build.startUI(automatic,D,'test-ui');await automatic.ui.onmessage({type:'ready'});
 const complete=automatic.messages.find(m=>m.type==='complete');assert(complete,'startup sends completion');assert.equal(complete.screens.length,D.screens.length);assert.notEqual(automatic.currentPage,originalPage);assert(originalPage.children.includes(automatic.original));
 const pageCount=automatic.root.children.length,nodeCount=automatic.nodes.size;
 await automatic.ui.onmessage({type:'ready'});assert.equal(automatic.root.children.length,pageCount,'reopen reuses page');assert.equal(automatic.nodes.size,nodeCount,'reopen does not duplicate frames');
 await automatic.ui.onmessage({type:'focus',id:'d-home'});assert.equal(automatic.currentPage.selection[0].id,complete.report.screenIds['d-home']);
 await automatic.ui.onmessage({type:'present'});assert.equal(automatic.messages.at(-1).type,'closed');assert.equal(automatic.currentPage.selection[0].id,complete.report.screenIds['d-home']);
 const failing=api();failing.createPage=()=>{throw Error('page limit');};build.startUI(failing,D,'test-ui');await failing.ui.onmessage({type:'ready'});assert.equal(failing.messages.at(-1).type,'error');assert.match(failing.messages.at(-1).message,/page limit/);
 const failedConnections=api(),createFrame=failedConnections.createFrame;
 failedConnections.createFrame=()=>{const node=createFrame(),set=node.setReactionsAsync.bind(node);node.setReactionsAsync=async reactions=>{if(node.name==='Action / Mulai sebagai mahasiswa')throw Error('reaction rejected');return set(reactions);};return node;};
 build.startUI(failedConnections,D,'test-ui');await failedConnections.ui.onmessage({type:'ready'});
 const partialMessage=failedConnections.messages.at(-1);assert.equal(partialMessage.type,'error');assert.equal(partialMessage.screens.length,89,'navigation failure still exposes screens');assert.equal(failedConnections.zooms.at(-1).length,89);
 await failedConnections.ui.onmessage({type:'focus',id:'s-home'});assert.equal(failedConnections.currentPage.selection[0].id,partialMessage.report.screenIds['s-home'],'partial build remains browseable');
 const summary={buildRevision:complete.report.buildRevision,screens:report.screenCount,prototypeLinks:report.linkCount,nodeTypes:report.nodeTypes,createdNodes:report.createdNodeIds.length,variables:figma.storedVariables.length,textStyles:figma.styles.length,checks:['runtime completed with supported API double','all nodes tracked','navigation destinations top-level','Figma overflow enum validated','variables scoped','existing content retained','rerun refused without duplicates','missing fonts fail before canvas mutation','partial failure report preserves IDs','text sizing restored after resize','click wrappers and cover destinations verified','all screens revealed on completion','UI ready automatically builds a new page in existing file','reopen reuses completed page','screen picker and Present select real destination','page limit reports failure without claiming success'],warnings:report.warnings,limitation:'API double only; not executed inside Figma'};
 fs.writeFileSync(path.resolve(__dirname,'plugin-validation.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
