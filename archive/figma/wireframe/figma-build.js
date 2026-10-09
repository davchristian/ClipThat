// Historical v1 generator: student mobile and lecturer desktop.
// Desktop v2 is implemented in index.html; this generator has not been migrated.
// Run inside use_figma after screens.js has been loaded as `const screens = ...`.
// Creates semantic, editable wireframes; never imports a flattened UI image.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const page=figma.currentPage;
if(page.children.some(n=>n.name==='ClipThat / Wireframe board'))throw new Error('Board already exists. Inspect canvas before retrying.');
await Promise.all(['Regular','Semi Bold','Bold'].map(style=>figma.loadFontAsync({family:'Inter',style})));
const [buttonSet,inputSet,textareaSet,cardSet,gap8,gap16,gap24,surface,muted,border,ink,bodyStyle,smallStyle]=await Promise.all([
  figma.importComponentSetByKeyAsync('cc8b558dc7d9684011b6b99ce8e6509399bc836b'),
  figma.importComponentSetByKeyAsync('c28150b04d333d34ed9d2b77abd9f2f54e1a878a'),
  figma.importComponentSetByKeyAsync('45a146b674f858a2c626c056c58ddf0f67e192ee'),
  figma.importComponentSetByKeyAsync('a5bde480886231526d7dd890df3779dc15b52423'),
  figma.variables.importVariableByKeyAsync('15bb1c0f339146e931cf0dc15f89ed57dcbd907e'),
  figma.variables.importVariableByKeyAsync('16bc6f84b6e7e20e4234ef79030ee580ec0f4505'),
  figma.variables.importVariableByKeyAsync('be3115966ea99eef888c9f25751b54695c7e88d2'),
  figma.variables.getVariableByIdAsync('VariableID:4:387'),
  figma.variables.getVariableByIdAsync('VariableID:4:388'),
  figma.variables.getVariableByIdAsync('VariableID:4:389'),
  figma.variables.getVariableByIdAsync('VariableID:4:390'),
  figma.importStyleByKeyAsync('cebee1b62ea594fa8f97b0b247fd163730736f2a'),
  figma.importStyleByKeyAsync('dd16ffab542d022b9a2d78275ed222c2cb4646b4')
]);
if(!surface||!muted||!border||!ink)throw new Error('Missing wireframe foundations');
const localStyles=await figma.getLocalTextStylesAsync();
const styles={body:bodyStyle.id,small:smallStyle.id};
for(const [name,key]of[['ClipThat / Title','title'],['ClipThat / Section','section'],['ClipThat / Brand','brand']]){const style=localStyles.find(s=>s.name===name);if(!style)throw new Error('Missing style '+name);styles[key]=style.id;}
const created=[],links=[],frames={},screenWrappers={},graphGroups=[];
const track=n=>{created.push(n.id);return n};
function paint(variable){return figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',variable)}
function stack(parent,width,name,direction='VERTICAL',padding=0){const n=track(figma.createAutoLayout(direction));n.name=name;n.fills=[];n.resize(width,10);n.primaryAxisSizingMode=direction==='HORIZONTAL'?'FIXED':'AUTO';n.counterAxisSizingMode=direction==='HORIZONTAL'?'AUTO':'FIXED';n.setBoundVariable('itemSpacing',gap16);if(padding)for(const side of ['Top','Bottom','Left','Right'])n.setBoundVariable('padding'+side,gap24);parent.appendChild(n);return n}
function text(parent,value,width,style='body'){const n=track(figma.createText());n.name=value.slice(0,50)||'Text';n.fontName={family:'Inter',style:'Regular'};n.textStyleId=styles[style];n.characters=value;n.fills=[paint(ink)];n.textAutoResize='HEIGHT';n.resize(width,Math.max(20,n.height));parent.appendChild(n);n.layoutSizingHorizontal='FIXED';return n}
function variant(set,criteria){return set.children.find(n=>n.type==='COMPONENT'&&Object.entries(criteria).every(([k,v])=>n.variantProperties?.[k]===v))||set.defaultVariant}
function button(parent,data,width){const n=track(variant(buttonSet,{Variant:data.primary?'Primary':'Neutral',State:'Default',Size:'Small'}).createInstance());parent.appendChild(n);n.setProperties({'Label#2:0':data.label,'Has Icon Start#4:128':false,'Has Icon End#4:64':false});n.name='Action / '+data.label;n.resize(width,Math.max(n.height,40));n.layoutSizingHorizontal='FIXED';n.layoutSizingVertical='HUG';n.minHeight=40;for(const t of n.findAllWithCriteria({types:['TEXT']})){t.textAutoResize='HEIGHT';t.layoutSizingHorizontal='FILL';t.textAlignHorizontal='CENTER';}if(data.target)links.push({id:n.id,target:data.target});else if(data.action)links.push({id:n.id,action:data.action});return n}
function card(parent,title,body,width,badge){const outer=stack(parent,width,'Card / '+title);outer.setBoundVariable('itemSpacing',gap8);const n=track(variant(cardSet,{'Asset Type':'Icon',Variant:'Stroke',Direction:'Vertical'}).createInstance());outer.appendChild(n);n.setProperties({'Asset#113:13':false,'Button#113:15':false,'Heading#280:0':title,'Body#280:13':(badge?badge+'\n':'')+body});n.resize(width,n.height);n.layoutSizingHorizontal='FIXED';n.layoutSizingVertical='HUG';for(const t of n.findAllWithCriteria({types:['TEXT']})){t.textAutoResize='HEIGHT';t.resize(Math.max(80,width-48),Math.max(20,t.height));}return outer}
function rowButtons(parent,buttons,width){const row=stack(parent,width,'Actions','HORIZONTAL');row.setBoundVariable('itemSpacing',gap8);const bw=(width-8*(buttons.length-1))/buttons.length;for(const b of buttons)button(row,b,bw);return row}
function field(parent,b,width){const set=b.multiline?textareaSet:inputSet;const n=track(variant(set,{State:'Default','Value Type':b.value?'Default':'Placeholder'}).createInstance());parent.appendChild(n);const properties={State:'Default','Value Type':b.value?'Default':'Placeholder','Has Label#57:0':true,'Has Error#72:6':false};properties[b.multiline?'Label#280:32':'Label#280:41']=b.label;properties[b.multiline?'Value#630:0':'Value#630:14']=b.value||b.placeholder||'Pilih file';n.setProperties(properties);n.name='Field / '+b.label;n.resize(width,n.height);n.layoutSizingHorizontal='FIXED';n.layoutSizingVertical='HUG';for(const t of n.findAllWithCriteria({types:['TEXT']})){t.textAutoResize='HEIGHT';t.resize(Math.max(80,width-24),Math.max(20,t.height));}return n}
function graph(parent,width){const n=track(figma.createFrame());n.name='Graph / Editable subbab';n.resize(width,280);n.fills=[paint(muted)];parent.appendChild(n);const path=track(figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="280" viewBox="0 0 ${width} 280"><path d="M118 60 L${width-118} 110 M${width-118} 154 L118 204" fill="none" stroke="#aaa" stroke-width="1.5"/></svg>`));path.name='Relations / prasyarat';n.appendChild(path);path.x=0;path.y=0;for(const [name,x,y]of[['Basis dan dimensi',16,16],['Representasi matriks',width-220,110],['Kernel dan image',16,204]]){const node=stack(n,204,'Node / '+name,'VERTICAL');node.x=x;node.y=y;node.fills=[paint(surface)];node.strokes=[paint(border)];node.paddingTop=12;node.paddingBottom=12;node.paddingLeft=12;node.paddingRight=12;text(node,name,180,'small');graphGroups.push(node.id);}return n}
function block(parent,b,width){
  if(b.type==='heading')return text(parent,b.text.toUpperCase(),width,'section');
  if(b.type==='button')return button(parent,b,width);
  if(b.type==='row')return rowButtons(parent,b.buttons,width);
  if(b.type==='field')return field(parent,b,width);
  if(b.type==='file')return field(parent,{label:b.label,value:'Pilih file…'},width);
  if(b.type==='graph')return graph(parent,width);
  if(b.type==='photo'){const n=stack(parent,width,'Placeholder / '+b.text,'VERTICAL',24);n.fills=[paint(muted)];n.strokes=[paint(border)];n.minHeight=150;n.counterAxisAlignItems='CENTER';text(n,'[ '+b.text+' ]',width-48,'small');text(n,b.caption,width-48,'small');return n}
  if(b.type==='note'){const n=stack(parent,width,'Note','VERTICAL',24);n.fills=[paint(muted)];text(n,b.text,width-48,'small');return n}
  if(b.type==='quote'){const n=card(parent,b.time,b.text,width);if(b.bookmark)rowButtons(n,[{label:'Bingung',action:'bookmark'},{label:'Review nanti',action:'bookmark'}],width);return n}
  if(b.type==='card'){const n=card(parent,b.title,b.text,width,b.badge);if(b.buttons)for(const action of b.buttons)button(n,action,width);return n}
  if(b.type==='meter'){const n=stack(parent,width,'Progress / '+b.label);n.setBoundVariable('itemSpacing',gap8);text(n,b.label+' · '+b.value+'%',width,'small');const trackFrame=track(figma.createFrame());n.appendChild(trackFrame);trackFrame.name='Progress track';trackFrame.resize(width,8);trackFrame.fills=[paint(muted)];const fill=track(figma.createRectangle());trackFrame.appendChild(fill);fill.resize(width*b.value/100,8);fill.fills=[paint(border)];return n}
}
const maxX=Math.max(0,...page.children.map(n=>n.x+n.width));
const board=stack(page,2560,'ClipThat / Wireframe board','VERTICAL',24);board.x=maxX+120;board.y=100;board.fills=[paint(muted)];board.itemSpacing=24;
text(board,'ClipThat / Wireframe v1',2464,'title');text(board,'20 layar · mahasiswa dan dosen · struktur editable · data contoh',2464,'body');
text(board,'Alur mahasiswa: persiapan → transkrip → capture → catatan & review → agenda\nAlur dosen: buat sesi → mulai kelas → jawab pertanyaan → rekap → kelola sumber',2464,'small');
let cursorY=board.y+board.height+100;
for(const role of ['student','lecturer']){
  const items=screens.filter(s=>s.role===role);const roleTitle=text(page,role==='student'?'01 / MAHASISWA — HP':'02 / DOSEN — LAPTOP',2464,'title');roleTitle.x=board.x;roleTitle.y=cursorY;cursorY+=80;
  const columns=role==='student'?5:2;const width=role==='student'?414:1120;
  for(let i=0;i<items.length;i+=columns){let rowHeight=0;
    for(const [column,s]of items.slice(i,i+columns).entries()){
      const sx=board.x+column*(width+32);const label=text(page,s.id+' / '+s.title,width,'section');label.x=sx;label.y=cursorY-30;
      const screen=stack(page,width,s.id+' / '+s.title);screen.x=sx;screen.y=cursorY;screen.fills=[paint(surface)];screen.strokes=[paint(border)];screen.setBoundVariable('itemSpacing',gap16);frames[s.id]=screen;
      const header=stack(screen,width,'App header','HORIZONTAL',24);header.primaryAxisAlignItems='SPACE_BETWEEN';text(header,'ClipThat',width-180,'brand');text(header,role==='student'?'Mahasiswa':'Dosen',84,'small');
      const content=stack(screen,width,'Screen content','VERTICAL',24);content.setBoundVariable('itemSpacing',gap16);const inner=width-48;
      text(content,s.title,inner,'title');text(content,s.subtitle,inner,'small');
      if(role==='lecturer'){
        for(let k=0;k<s.blocks.length;k+=2){const a=s.blocks[k],b=s.blocks[k+1];if(!b){block(content,a,inner);continue}const r=stack(content,inner,'Content row '+k,'HORIZONTAL');r.setBoundVariable('itemSpacing',gap24);const half=(inner-24)/2;const left=stack(r,half,'Left');const right=stack(r,half,'Right');block(left,a,half);block(right,b,half);}
      }else for(const b of s.blocks)block(content,b,inner);
      const nav=stack(screen,width,'App navigation','HORIZONTAL',24);nav.setBoundVariable('itemSpacing',gap8);const navItems=role==='student'?[['Beranda','s-home'],['Kelas','s-brief'],['Review','s-review'],['Agenda','s-agenda']]:[['Kelas','d-home'],['Sesi','d-live'],['Rekap','d-results'],['Arsip','d-archive']];for(const [label,target]of navItems)button(nav,{label,target},(width-48-24)/4);
      const annotation=text(page,s.note+'\n'+s.fr.join(' · '),width,'small');annotation.x=sx;annotation.y=cursorY+screen.height+16;rowHeight=Math.max(rowHeight,screen.height+annotation.height+16);
    }cursorY+=rowHeight+100;
  }cursorY+=80;
}
const actionTargets={'join':'s-brief','send-question':'s-questions','save-capture':'s-live','save-photo':'s-live','confirm-agenda':'s-agenda','reject-agenda':'s-agenda','start-class':'d-live','end-class':'d-results','save-graph':'d-results','delete-shared':'d-archive','restore-session':'d-home'};
let connected=0;for(const link of links){const target=link.target||actionTargets[link.action];if(target&&frames[target]){const n=await figma.getNodeByIdAsync(link.id);let origin=n;while(origin.parent&&origin.parent.type!=='PAGE')origin=origin.parent;if(origin.id===frames[target].id)continue;await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:frames[target].id,navigation:'NAVIGATE',transition:null,resetScrollPosition:true}]}]);connected++;}}
figma.viewport.scrollAndZoomIntoView([frames['s-live']]);
const descendants=[...board.findAll(()=>true),...Object.values(frames).flatMap(n=>n.findAll(()=>true))];const counts={};for(const n of descendants)counts[n.type]=(counts[n.type]||0)+1;
const imageNodes=descendants.filter(n=>'fills'in n&&Array.isArray(n.fills)&&n.fills.some(p=>p.type==='IMAGE')).map(n=>({id:n.id,name:n.name,type:n.type,width:n.width,height:n.height}));
const fontsUsed=[...new Set(descendants.filter(n=>n.type==='TEXT').map(n=>typeof n.fontName==='object'?n.fontName.family:'mixed'))];
return {rootId:board.id,pageId:page.id,createdNodeIds:[...new Set([...created,...descendants.map(n=>n.id)])],mutatedNodeIds:[],screenIds:Object.fromEntries(Object.entries(frames).map(([k,n])=>[k,n.id])),screenCount:Object.keys(frames).length,prototypeLinks:connected,counts,imageNodes,fontsUsed,bounds:{width:board.width,height:board.height},screens:Object.entries(frames).map(([key,n])=>({key,id:n.id,width:n.width,height:n.height}))};
