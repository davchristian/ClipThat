/* Classic local plugin runtime. Bundled after design.js into plugin/code.js. */
const CLIPTHAT_BUILD_REVISION='desktop-3.1';
async function buildClipThat(figma, D, progress = () => {}) {
  const page = figma.currentPage;
  const prefix = 'ClipThat UIUX 1.0 / ';
  const created = [], links = [], errors = [], warnings = [], frames = {};
  const ledger = {version:D.version,pageId:page.id,pageName:page.name,screenIds:{},componentIds:{},variableIds:{},styleIds:{},createdNodeIds:created,mutatedNodeIds:[],warnings,errors,completed:false,screenCount:0,linkCount:0};
  const track=n=>{created.push(n.id);return n;};
  try {
  // Exact-name discovery never deletes or rewrites existing designs.
  const existingCover=page.children.find(n=>n.name===prefix+'Cover');
  if(existingCover)throw Error('Desain ClipThat sudah ada pada halaman ini. Pilih halaman kosong untuk membuat versi baru. Desain yang ada tidak diubah.');
  const existingPartial=page.children.find(n=>n.name.startsWith(prefix));
  if(existingPartial)throw Error('Ada hasil ClipThat dari proses sebelumnya. Pilih halaman kosong untuk membuat ulang; tidak ada layer yang dihapus otomatis.');
  const fonts = await figma.listAvailableFontsAsync();
  let selected;
  for(const family of ['Nunito Sans','DM Sans','Arial','Inter']){
    const regular=fonts.find(f=>f.fontName.family===family&&f.fontName.style==='Regular');
    const bold=fonts.find(f=>f.fontName.family===family&&f.fontName.style==='Bold');
    if(regular&&bold){selected={regular:regular.fontName,bold:bold.fontName};break;}
  }
  if(!selected)throw Error('Font Regular dan Bold yang didukung belum tersedia. Aktifkan Nunito Sans, Arial, atau Inter lalu jalankan ulang.');
  await Promise.all([figma.loadFontAsync(selected.regular),figma.loadFontAsync(selected.bold)]);
  ledger.fonts=selected;
  const rgb=hex=>({r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255});
  // Derived from the createVariableCollection helper: one Value mode, portable to Starter.
  const collection=figma.variables.createVariableCollection('ClipThat / UIUX 1.0 / '+Date.now());
  collection.renameMode(collection.defaultModeId,'Warm');
  ledger.collectionId=collection.id;
  const mode=collection.defaultModeId, vars={};
  function variable(name,type,value,scopes){const v=figma.variables.createVariable(name,collection,type);v.scopes=scopes;v.setValueForMode(mode,value);v.setVariableCodeSyntax('WEB','var(--clipthat-'+name.replace(/\//g,'-')+')');vars[name]=v;ledger.variableIds[name]=v.id;return v;}
  for(const [key,hex] of Object.entries(D.colors)){
    const p=variable('palette/'+key,'COLOR',rgb(hex),[]);
    variable('color/'+key,'COLOR',{type:'VARIABLE_ALIAS',id:p.id},['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR']);
  }
  for(const n of [0,4,6,8,10,12,14,16,20,24,28,32,36,40,44,48,56,64,76])variable('space/'+n,'FLOAT',n,['GAP']);
  for(const n of [0,8,10,12,13,14,16,18,20,24,26,28])variable('radius/'+n,'FLOAT',n,['CORNER_RADIUS']);
  const paint=key=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:rgb(D.colors[key]||D.colors.ink)},'color',vars['color/'+key]);
  const styles={};
  for(const [key,spec] of Object.entries(D.type)){
    const s=figma.createTextStyle();s.name='ClipThat / '+key;s.fontName=spec.weight==='Bold'?selected.bold:selected.regular;s.fontSize=spec.size;s.lineHeight={unit:'PIXELS',value:spec.line};styles[key]=s;ledger.styleIds[key]=s.id;
  }
  function bindSpace(node,prop,value){node[prop]=value;const v=vars['space/'+value];if(v)node.setBoundVariable(prop,v);}
  function surface(node,key,border,radius){node.fills=key?[paint(key)]:[];if(border){node.strokes=[paint(border)];node.strokeWeight=1;}if(radius){node.cornerRadius=radius;const v=vars['radius/'+radius];if(v)for(const p of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])node.setBoundVariable(p,v);}}
  async function text(parent,str,style='body',color='ink',width=200){
    const t=track(figma.createText());t.name=str.slice(0,60);t.fontName=D.type[style].weight==='Bold'?selected.bold:selected.regular;t.characters=str;await t.setTextStyleIdAsync(styles[style].id);t.resize(Math.max(1,width),D.type[style].line);t.textAutoResize='HEIGHT';t.fills=[paint(color)];parent.appendChild(t);
    if('layoutMode' in parent&&parent.layoutMode!=='NONE')t.layoutSizingVertical='HUG';
    return t;
  }
  function frame(parent,name,width,dir='VERTICAL',pad=0,gap=0,bg,border,radius){
    const n=track(figma.createFrame());n.name=name;parent.appendChild(n);n.layoutMode=dir;n.resize(Math.max(1,width),1);
    n.primaryAxisSizingMode=dir==='VERTICAL'?'AUTO':'FIXED';n.counterAxisSizingMode=dir==='VERTICAL'?'FIXED':'AUTO';n.clipsContent=false;
    const [py,px]=Array.isArray(pad)?pad:[pad,pad];for(const [prop,val]of [['paddingTop',py],['paddingBottom',py],['paddingLeft',px],['paddingRight',px],['itemSpacing',gap]])bindSpace(n,prop,val);
    surface(n,bg,border,radius);return n;
  }
  const hugWidth=d=>d.kind==='button'?Math.max(68,d.label.length*8.1+36):d.kind==='badge'?d.label.length*8+28:d.kind==='icon'?d.w:120;
  function widths(d,width){const pad=Array.isArray(d.pad)?d.pad[1]:(d.pad||0),inner=width-pad*2;const kids=(d.children||[]).filter(Boolean);if(d.dir!=='row')return kids.map(k=>typeof k.w==='number'?k.w:k.w==='hug'?Math.min(inner,hugWidth(k)):inner);
    const fixed=kids.reduce((sum,k)=>sum+(typeof k.w==='number'?k.w:k.w==='hug'?hugWidth(k):0),0),flex=kids.filter(k=>!k.w||k.w==='fill').length;
    const room=inner-fixed-Math.max(0,kids.length-1)*(d.gap||0);
    if(room < -1)warnings.push('Row exceeds available width: '+kids.map(k=>k.label||k.text||k.kind).join(' | '));
    return kids.map(k=>typeof k.w==='number'?k.w:k.w==='hug'?hugWidth(k):Math.max(20,room/Math.max(1,flex)));
  }
  const right=Math.max(0,...page.children.map(n=>n.x+n.width))+160;
  const foundation=frame(page,prefix+'Components',1440,'VERTICAL',32,24,'surface',null,24);foundation.x=right;foundation.y=160;
  await text(foundation,'ClipThat · Warm foundations','title','ink',1376);
  await text(foundation,'Komponen asli, warna terikat variable, dan teks yang dapat diedit.','body','muted',1376);
  const swatches=frame(foundation,'Palette',1376,'HORIZONTAL',0,16);
  for(const key of ['app','surface','primary','sage','peach','ink']){const sw=frame(swatches,key,216,'VERTICAL',16,12,D.colors[key]?key:'app','border',12);await text(sw,key,'label',key==='primary'||key==='ink'?'surface':'ink',184);await text(sw,D.colors[key],'small',key==='primary'||key==='ink'?'surface':'muted',184);}
  const components={};
  const makeSet=async(name,entries,build)=>{
    const nodes=[];for(const entry of entries){const c=track(figma.createComponent());c.name=entry.name;foundation.appendChild(c);await build(c,entry);nodes.push(c);}
    const set=track(figma.combineAsVariants(nodes,foundation));set.name='ClipThat / '+name;set.description='Komponen '+name+' untuk ClipThat desktop. Gunakan instance dan ubah properti teks.';
    set.layoutMode='HORIZONTAL';set.layoutWrap='WRAP';set.resize(1376,100);set.primaryAxisSizingMode='FIXED';set.counterAxisSizingMode='AUTO';set.itemSpacing=16;set.counterAxisSpacing=16;set.fills=[];
    ledger.componentIds[name]=set.id;return nodes;
  };
  const buttonEntries=[];for(const variant of ['primary','secondary','ghost','danger'])for(const state of ['Default','Hover','Focus','Disabled','Loading'])buttonEntries.push({name:'Style='+variant+', State='+state,variant,state});
  const buttonNodes=await makeSet('Button',buttonEntries,async(c,e)=>{
    c.layoutMode='HORIZONTAL';c.resize(236,48);c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='AUTO';c.minHeight=48;c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';
    const bg=e.state==='Disabled'?'disabled':e.variant==='primary'?(e.state==='Hover'?'hover':'primary'):e.variant==='danger'?'error':e.variant==='ghost'?undefined:'surface';
    surface(c,bg,e.state==='Focus'?'primary':e.variant==='secondary'?'control':undefined,12);
    if(e.state==='Focus')c.strokeWeight=3;
    for(const prop of ['paddingTop','paddingBottom'])bindSpace(c,prop,12);for(const prop of ['paddingLeft','paddingRight'])bindSpace(c,prop,16);
    const label=await text(c,e.state==='Loading'?'Memproses…':'Label tombol','label',e.state==='Disabled'?'muted':['primary','danger'].includes(e.variant)?'surface':e.variant==='ghost'?'primary':'ink',204);label.textAlignHorizontal='CENTER';label.layoutSizingHorizontal='FILL';
    const p=c.addComponentProperty('Label','TEXT',label.characters);label.componentPropertyReferences={characters:p};components['button/'+e.variant+'/'+e.state]={node:c,label:p};
  });
  // Hover variants remain editable examples. Navigation must not swap its click target.
  await makeSet('Badge',['sage','peach','errorBg'].map(tone=>({name:'Tone='+tone,tone})),async(c,e)=>{
    c.layoutMode='HORIZONTAL';c.resize(188,30);c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='AUTO';surface(c,e.tone,null,10);for(const p of ['paddingTop','paddingBottom'])bindSpace(c,p,6);for(const p of ['paddingLeft','paddingRight'])bindSpace(c,p,12);
    const label=await text(c,'Tersimpan','caption',e.tone==='peach'?'review':e.tone==='errorBg'?'error':'primary',164);label.layoutSizingHorizontal='FILL';const p=c.addComponentProperty('Label','TEXT','Tersimpan');label.componentPropertyReferences={characters:p};components['badge/'+e.tone]={node:c,label:p};
  });
  await makeSet('Field',['Default','Multiline'].map(state=>({name:'State='+state,state})),async(c,e)=>{
    c.layoutMode='VERTICAL';c.resize(320,56);c.primaryAxisSizingMode='AUTO';c.counterAxisSizingMode='FIXED';c.minHeight=e.state==='Multiline'?124:52;surface(c,'surface','control',12);for(const p of ['paddingTop','paddingBottom'])bindSpace(c,p,14);for(const p of ['paddingLeft','paddingRight'])bindSpace(c,p,16);
    const label=await text(c,'Nilai input','body','ink',288);label.layoutSizingHorizontal='FILL';const p=c.addComponentProperty('Value','TEXT','Nilai input');label.componentPropertyReferences={characters:p};components['input/'+e.state]={node:c,label:p};
  });
  async function instance(parent,master,value,width){
    const n=track(master.node.createInstance());for(const child of n.findAll(()=>true))created.push(child.id);parent.appendChild(n);n.resize(Math.max(20,width),n.height);
    // combineAsVariants can consolidate same-named properties; resolve the live instance API.
    const props=n.componentProperties;const label=Object.prototype.hasOwnProperty.call(props,master.label)?master.label:Object.keys(props).find(key=>props[key].type==='TEXT'&&/^(Label|Value)#/.test(key));
    if(!label)throw Error('Properti teks instance tidak ditemukan: '+master.node.name);
    n.setProperties({[label]:value});
    if(n.layoutMode==='HORIZONTAL')n.counterAxisSizingMode='AUTO';
    else if(n.layoutMode==='VERTICAL')n.primaryAxisSizingMode='AUTO';
    return n;
  }
  async function render(d,parent,width){
    if(!d)return null;let n;
    if(d.kind==='text')n=await text(parent,d.text,d.style,d.color,width);
    else if(d.kind==='button'){
      const state=d.disabled?'Disabled':'Default';
      n=frame(parent,'Action / '+d.label,width,'HORIZONTAL');
      await instance(n,components['button/'+d.variant+'/'+state],d.label,width);
      if(d.target&&!d.disabled)links.push({node:n,target:d.target});
    }else if(d.kind==='badge')n=await instance(parent,components['badge/'+d.tone],d.label,width);
    else if(d.kind==='input')n=await instance(parent,components['input/'+(d.multiline?'Multiline':'Default')],d.value,width);
    else if(d.kind==='icon'){
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="'+D.icons[d.icon]+'" fill="none" stroke="'+D.colors[d.color]+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      n=track(figma.createNodeFromSvg(svg));parent.appendChild(n);n.name='Icon / '+d.icon;n.rescale(d.w/n.width);for(const child of n.findAll(()=>true)){created.push(child.id);if('strokes'in child&&child.strokes.length)child.strokes=[paint(d.color)];}
    }else if(d.kind==='divider'){
      n=track(figma.createRectangle());parent.appendChild(n);n.resize(width,1);n.fills=[paint(d.color)];
    }else if(d.kind==='meter'){
      n=frame(parent,'Review frequency',width,'HORIZONTAL',0,0,'sage',null,8);n.resize(width,10);n.counterAxisSizingMode='FIXED';const fill=track(figma.createRectangle());n.appendChild(fill);fill.resize(width*d.value/100,10);fill.cornerRadius=8;fill.fills=[paint('primary')];
    }else if(d.kind==='week'){
      n=frame(parent,'Week',width,'HORIZONTAL',0,8);for(const [i,label]of ['Sen\n05','Sel\n06','Rab\n07','Kam\n08','Jum\n09','Sab\n10','Min\n11'].entries()){const day=frame(n,label,(width-48)/7,'VERTICAL',12,0,i===3?'sage':'app',null,12);const t=await text(day,label,'small',i===3?'primary':'muted',(width-48)/7-24);t.textAlignHorizontal='CENTER';}
    }else if(d.kind==='graph'){
      n=frame(parent,'Concept map',width,'VERTICAL',20,24,'app',null,16);
      for(const [label,target,selected]of [['Basis dan dimensi',d.edit?'m-graph-edit':'s-graph-basis',d.selected==='basis'],['Representasi matriks',d.edit?'m-graph-edit':'s-graph',d.selected==='matrix'],['Kernel dan image',d.edit?'m-graph-edit':'s-graph-kernel',d.selected==='kernel']]){
        const node=frame(n,label,width-40,'HORIZONTAL',16,12,selected?'sage':'surface',selected?'primary':'border',12);await text(node,label,'label',selected?'primary':'ink',width-72);links.push({node,target});
        if(label!=='Kernel dan image')await text(n,'↓  '+(label==='Basis dan dimensi'?'prasyarat':'berkaitan'),'small','muted',width-40);
      }
    }else if(d.kind==='board'){
      n=frame(parent,'Editable board illustration',width,'VERTICAL',32,20,'sage',null,16);await text(n,'Papan · Transformasi linear','label','primary',width-64);await text(n,'T(u + v) = T(u) + T(v)','title','ink',width-64);await text(n,'[T] = [ T(b₁)   T(b₂) ]','title','ink',width-64);await text(n,'Koordinat ditulis terhadap basis tujuan.','body','muted',width-64);
    }else if(d.kind==='box'){
      n=frame(parent,d.target?'Navigation / '+d.target:'Layout',width,d.dir==='row'?'HORIZONTAL':'VERTICAL',d.pad||0,d.gap||0,d.bg,d.border,d.radius);
      n.counterAxisAlignItems=d.align==='center'?'CENTER':'MIN';if(d.justify==='center')n.primaryAxisAlignItems='CENTER';
      const sizes=widths(d,width);for(const [i,child]of d.children.entries())await render(child,n,sizes[i]);
      if(d.h){n.resize(width,d.h);if(d.dir==='row')n.counterAxisSizingMode='FIXED';else n.primaryAxisSizingMode='FIXED';}if(d.minH)n.minHeight=d.minH;
      if(d.target)links.push({node:n,target:d.target});
    }else throw Error('Unknown design node: '+d.kind);
    return n;
  }
  const cover=frame(page,prefix+'Cover',1440,'VERTICAL',48,28,'sage',null,24);cover.x=right;cover.y=foundation.y+foundation.height+120;
  await text(cover,'ClipThat','display','primary',1344);await text(cover,'Ruang untuk memahami.','display','ink',1344);await text(cover,'UI/UX desktop · Mahasiswa & dosen · Oat cream / Sage','body','muted',1344);
  await text(cover,'Mulai prototype dari Mahasiswa atau Dosen. Tombol memakai data contoh. Form dapat diedit sebagai layer di Design; input langsung, audio, AI, dan koneksi akun memerlukan implementasi aplikasi.','body','muted',1100);
  const starts=frame(cover,'Prototype starts',1344,'HORIZONTAL',0,16);await render({kind:'button',label:'Mulai sebagai mahasiswa',variant:'primary',target:'s-home'},starts,260);await render({kind:'button',label:'Mulai sebagai dosen',variant:'secondary',target:'d-home'},starts,240);
  const index=frame(page,prefix+'Scenarios',1440,'VERTICAL',32,24,'surface',null,24);index.x=right;index.y=cover.y+cover.height+120;
  await text(index,'Indeks layar & skenario','title','ink',1376);await text(index,'Gunakan tombol untuk menguji keadaan sukses, gagal, kosong, dan konfirmasi. Semua angka dan jadwal adalah data contoh.','body','muted',1376);
  let indexRow;for(const [i,s]of D.screens.entries()){
    if(i%3===0)indexRow=frame(index,'Screen row',1376,'HORIZONTAL',0,16);
    await render({kind:'button',label:s.id+' · '+s.title,variant:'ghost',target:s.id},indexRow,448);
  }
  const originY=Math.max(index.y+index.height,cover.y+cover.height)+200;
  for(const [i,s]of D.screens.entries()){
    progress(Math.round(15+i/D.screens.length*65),'Membuat '+s.title+' ('+(i+1)+'/'+D.screens.length+')');
    const root=await render(D.tree(s),page,s.modal?640:1440);root.name=prefix+s.id+' / '+s.title;root.x=right+(i%4)*1640;root.y=originY+Math.floor(i/4)*1600;
    if(!s.modal){root.resize(1440,1000);root.counterAxisSizingMode='FIXED';root.primaryAxisSizingMode='FIXED';root.clipsContent=true;root.overflowDirection='VERTICAL';}
    root.setPluginData('clipthat-screen',s.id);frames[s.id]=root;ledger.screenIds[s.id]=root.id;ledger.screenCount++;
  }
  // Reveal the actual screens before optional prototype setup can fail.
  await arrangeClipThatScreens(figma,D);
  const edge=Math.max(...Object.values(frames).map(n=>n.x+n.width))+240;
  foundation.x=edge;foundation.y=160;cover.x=edge;cover.y=foundation.y+foundation.height+120;index.x=edge;index.y=cover.y+cover.height+120;
  page.selection=[];
  progress(82,'Menghubungkan navigasi dan dialog…');
  for(const link of links){
    const dest=frames[link.target];let action;
    if(link.target==='@close')action={type:'CLOSE'};
    else if(!dest)throw Error('Tujuan prototype tidak ditemukan: '+link.target);
    else action={type:'NODE',destinationId:dest.id,navigation:D.screens.find(s=>s.id===link.target).modal?'OVERLAY':'NAVIGATE',transition:null,resetScrollPosition:true};
    await link.node.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[action]}]);
    link.node.setPluginData('clipthat-target',link.target);
    if(!link.node.reactions.some(r=>r.trigger?.type==='ON_CLICK'&&(r.actions||(r.action?[r.action]:[])).some(a=>a.type===action.type&&(action.type==='CLOSE'||a.destinationId===action.destinationId))))throw Error('Koneksi tombol tidak tersimpan: '+link.node.name);
    ledger.linkCount++;
  }
  page.flowStartingPoints=[...page.flowStartingPoints,{nodeId:frames['s-home'].id,name:'ClipThat · Mahasiswa'},{nodeId:frames['d-home'].id,name:'ClipThat · Dosen'},{nodeId:index.id,name:'ClipThat · Skenario'}];ledger.mutatedNodeIds.push(page.id);
  const createdSet=new Set(created),nodeTypes={};const createdNodes=page.findAll(n=>createdSet.has(n.id));
  for(const n of createdNodes)nodeTypes[n.type]=(nodeTypes[n.type]||0)+1;
  const allText=createdNodes.filter(n=>n.type==='TEXT');
  for(const t of allText)if(t.width<1||t.height<10)errors.push('Tinggi teks tidak valid: '+t.id);
  for(const n of createdNodes){
    if(!('children'in n)||n.type==='COMPONENT_SET'||n.parent?.type==='PAGE')continue;
    for(const child of n.children)if(child.visible!==false&&child.x>=0&&child.x+child.width>n.width+2)warnings.push('Periksa lebar '+child.id+' dalam '+n.id+' ('+n.name+')');
  }
  ledger.coverId=cover.id;ledger.scenarioId=index.id;ledger.screenCount=D.screens.length;ledger.linkCount=links.length;ledger.nodeTypes=nodeTypes;ledger.completed=errors.length===0;
  progress(100,'Seluruh layar selesai dibuat.');
  return ledger;
  } catch(error) { if(Object.keys(frames).length){page.selection=[];figma.viewport.scrollAndZoomIntoView(Object.values(frames));}ledger.errors.push(error.message);error.report=ledger;throw error; }
}
async function arrangeClipThatScreens(figma,D) {
  const page=figma.currentPage,prefix='ClipThat UIUX 1.0 / ';
  const ordered=[...D.screens.filter(s=>!s.state&&!s.modal&&s.role==='student'),...D.screens.filter(s=>!s.state&&!s.modal&&s.role==='lecturer'),...D.screens.filter(s=>s.state&&!s.modal),...D.screens.filter(s=>s.modal)];
  const screens=ordered.map(s=>page.children.find(n=>n.name===prefix+s.id+' / '+s.title)).filter(Boolean);
  if(!screens.length)throw Error('Layar ClipThat tidak ditemukan di halaman ini. Buka halaman yang berisi desain terlebih dahulu.');
  const baseX=Math.min(...screens.map(n=>n.x)),baseY=Math.min(...screens.map(n=>n.y));
  const columns=5,columnGap=1560;let rowY=baseY;
  for(let start=0;start<screens.length;start+=columns){const row=screens.slice(start,start+columns);row.forEach((node,index)=>{node.x=baseX+index*columnGap;node.y=rowY;});rowY+=Math.max(...row.map(n=>n.height))+180;}
  figma.viewport.scrollAndZoomIntoView(screens);
  return {screenCount:screens.length,columns,rows:Math.ceil(screens.length/columns)};
}
async function openClipThat(figma,D,progress=()=>{}) {
  const previous=figma.root.children.find(p=>p.getPluginData('clipthat-build')===CLIPTHAT_BUILD_REVISION&&p.getPluginData('clipthat-status')==='complete');
  if(previous){
    await figma.setCurrentPageAsync(previous);
    const saved=JSON.parse(previous.getPluginData('clipthat-report'));
    const frames=[];
    for(const screen of D.screens){const node=await figma.getNodeByIdAsync(saved.screenIds[screen.id]);if(!node||node.parent!==previous)throw Error('Layar '+screen.title+' pada hasil sebelumnya sudah dipindahkan atau dihapus. Buka kembali page hasil ClipThat untuk memeriksanya.');frames.push(node);}
    previous.selection=[];figma.viewport.scrollAndZoomIntoView(frames);
    return {...saved,reused:true,completed:true};
  }
  let page;
  try{page=figma.createPage();}catch(e){throw Error('Figma tidak dapat menambahkan page UI/UX di file ini: '+e.message);}
  const baseName='ClipThat — UI UX Desktop',existingNames=new Set(figma.root.children.filter(p=>p!==page).map(p=>p.name));
  let name=baseName,number=2;while(existingNames.has(name))name=baseName+' ('+(number++)+')';
  page.name=name;page.setPluginData('clipthat-build',CLIPTHAT_BUILD_REVISION);page.setPluginData('clipthat-status','building');
  await figma.setCurrentPageAsync(page);
  try{
    const report=await buildClipThat(figma,D,progress);
    if(!report.completed){const error=Error('Pemeriksaan desain belum lolos. '+report.errors.join('; '));error.report=report;throw error;}
    report.pageName=page.name;report.buildRevision=CLIPTHAT_BUILD_REVISION;
    page.setPluginData('clipthat-report',JSON.stringify({pageId:page.id,pageName:page.name,screenIds:report.screenIds,screenCount:report.screenCount,linkCount:report.linkCount,fonts:report.fonts,buildRevision:CLIPTHAT_BUILD_REVISION}));
    page.setPluginData('clipthat-status','complete');return report;
  }catch(e){page.setPluginData('clipthat-status','incomplete');throw e;}
}
function startClipThatUI(figma,D,html){
  figma.showUI(html,{width:400,height:600});let busy=false,report=null,selectedScreen='s-home';
  async function focus(ids){
    if(!report)throw Error('Tunggu sampai pembuatan layar selesai.');
    const page=await figma.getNodeByIdAsync(report.pageId);if(!page||page.type!=='PAGE')throw Error('Page UI/UX tidak ditemukan.');
    await figma.setCurrentPageAsync(page);
    const frames=[];for(const id of ids){if(!report.screenIds[id])throw Error('Layar tidak dikenal: '+id);const node=await figma.getNodeByIdAsync(report.screenIds[id]);if(!node||node.parent!==page)throw Error('Layar tidak ditemukan: '+id);frames.push(node);}
    page.selection=frames.length===1?frames:[];figma.viewport.scrollAndZoomIntoView(frames);
  }
  figma.ui.onmessage=async msg=>{
    if(msg.type==='close'){figma.closePlugin();return;}
    if(busy)return;busy=true;
    try{
      if(msg.type==='ready'||msg.type==='retry'){
        report=await openClipThat(figma,D,(percent,message)=>figma.ui.postMessage({type:'progress',percent,message}));
        figma.ui.postMessage({type:'complete',report,screens:D.screens.map(s=>({id:s.id,title:s.title,role:s.role,kind:s.modal?'Dialog':s.state?'Variasi':'Layar utama'})),message:report.screenCount+' layar dan dialog tersedia di page “'+report.pageName+'”.'});
      }else if(msg.type==='focus'){
        const ids=msg.id==='all'?D.screens.filter(s=>report?.screenIds?.[s.id]).map(s=>s.id):msg.id==='main'?D.screens.filter(s=>!s.modal&&!s.state&&report?.screenIds?.[s.id]).map(s=>s.id):[msg.id];
        await focus(ids);if(ids.length===1)selectedScreen=ids[0];figma.ui.postMessage({type:'focused',id:msg.id});
      }else if(msg.type==='present'){
        if(D.screens.find(s=>s.id===selectedScreen)?.modal)selectedScreen='s-home';
        await focus([selectedScreen]);figma.closePlugin('Layar dipilih. Klik tombol ▶ di kanan atas Figma untuk mencoba prototype.');
      }
    }
    catch(e){report=e.report||report;const screens=D.screens.filter(s=>report?.screenIds?.[s.id]).map(s=>({id:s.id,title:s.title,role:s.role,kind:s.modal?'Dialog':s.state?'Variasi':'Layar utama'}));figma.ui.postMessage({type:'error',report,screens,message:e.message+'\n'+(screens.length?screens.length+' layar sudah dibuat dan dapat dibuka lewat daftar. ':'')+'Unduh laporan di bawah jika perlu diperiksa.'});}
    finally{busy=false;}
  };
}
if(typeof figma!=='undefined')startClipThatUI(figma,ClipThatDesign,__html__);
if(typeof module!=='undefined'){module.exports=buildClipThat;module.exports.open=openClipThat;module.exports.startUI=startClipThatUI;}
