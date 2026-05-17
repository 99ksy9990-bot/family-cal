const APP_VERSION='v1.3.95';
const PASS_BUILD_VERSION='v1.3.95-profile-detail-quiet';
const APP_UPDATED='2026-05-13';



const UPDATE_LOG=['캐릭터 이미지 정렬 세트 적용','상단 날짜·당일 표시 방식 개선','일정 필터를 돋보기 아이콘으로 정리','반복 일정 카드·액션 시트 정돈','FAB와 접힌 문구 레이아웃 조정'];
let editUnlocked=false;
let privateViewUnlocked=false;
try{editUnlocked=sessionStorage.getItem('pass_edit_unlocked')==='1';privateViewUnlocked=sessionStorage.getItem('pass_private_unlocked')==='1'}catch(e){editUnlocked=false;privateViewUnlocked=false}
function isEditMode(){return editUnlocked}
function requireEditMode(){
  if(editUnlocked)return true;
  if(confirm('편집 모드로 전환할까요?')){
    editUnlocked=true;
    try{sessionStorage.setItem('pass_edit_unlocked','1')}catch(e){}
    render();
    return true;
  }
  return false;
}
function lockEditMode(){
  editUnlocked=false;
  try{sessionStorage.removeItem('pass_edit_unlocked')}catch(e){}
  render();
}
function toggleEditMode(){
  if(isEditMode()) lockEditMode();
  else{
    editUnlocked=true;
    try{sessionStorage.setItem('pass_edit_unlocked','1')}catch(e){}
    render();
  }
}
function openUpdateLog(){
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">업데이트 내역</div>
      <div class="version-card">
        <div class="version-title">패스 ${APP_VERSION}</div>
        <div class="version-sub">최근 업데이트: ${APP_UPDATED}</div>
      </div>
      <div class="log-list">${UPDATE_LOG.map(x=>`• ${escapeHtml(x)}`).join('<br>')}</div>
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function openSecurityGuide(){
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">보안 안내</div>
      <div class="security-note">
        Firebase 웹 API 키는 정적 웹앱에서 완전히 숨기는 값이 아닙니다. 실제 방어선은 Firestore 보안 규칙과 허용 도메인 제한입니다.
      </div>
      <div style="font-size:13px;color:var(--t2);line-height:1.55;margin-top:12px">
        권장 보완:<br>
        1. Firebase Console에서 Firestore Rules를 가족 방/인증 기준으로 제한<br>
        2. Google Cloud Console에서 API 키의 HTTP 참조자 제한 설정<br>
        3. 공개 GitHub Pages 저장소에는 테스트용 규칙을 오래 두지 않기<br><br>
        현재 앱의 비공개 일정은 <b>화면 표시를 숨기는 기능</b>입니다. 공유 방 데이터 자체를 암호화하는 기능은 아니에요.
      </div>
      <button class="cancel-link" onclick="openManageCenter()">돌아가기</button>
    </div>
  </div>`;
}


let themeMode='system';
try{themeMode=localStorage.getItem('pass_theme_mode')||'system'}catch(e){themeMode='system'}
function applyThemeMode(){
  try{localStorage.setItem('pass_theme_mode',themeMode)}catch(e){}
  if(themeMode==='system')document.body.removeAttribute('data-theme');
  else document.body.setAttribute('data-theme',themeMode);
}
function setThemeMode(v){
  themeMode=v||'system';
  applyThemeMode();
  render();
}
document.addEventListener('DOMContentLoaded',applyThemeMode);

const SK={data:'fam_shared_v8_data',room:'fam_shared_v8_room'};
const HOLIDAY_FUNCTION_URL=''; // Firebase Cloud Function URL을 넣으면 한국천문연구원 공휴일 API와 자동 연동됩니다.
const DEFAULT_ROOM_ID='family-dmm8oydaq6';
const DEFAULT_DATA={
  notes:[
    {id:1,title:'첫째 태권도',type:'family',start:'2026-05-04',end:'',sT:'17:00',eT:'18:00',done:false,comment:''},
    {id:2,title:'팀 주간 보고서',type:'work',start:'2026-05-05',end:'2026-05-06',sT:'09:00',eT:'18:00',done:false,comment:''},
    {id:3,title:'부모님께 연락',type:'personal',start:'2026-05-08',end:'',sT:'20:00',eT:'',done:false,comment:''}
  ],
  requests:[
    {id:101,title:'엄마한테 준비물 확인 부탁',writer:'첫째',done:false,comment:''}
  ],
  notices:[
    {id:301,title:'가족 공지 예시',body:'이번 주 주요 일정을 함께 확인해 주세요.',read:false,createdAt:Date.now()}
  ],
  memories:[
    {id:201,name:'도미 생일',birth:'2026-05-12',memo:''}
  ],
  family:[
    {id:1,name:'첫째',grade:'초등',year:'2',cls:'3',num:'15',cats:[
      {label:'하교 시간',items:[{days:[1,2,4],val:'15:30'},{days:[3],val:'13:30'}]},
      {label:'학원',items:[{days:[1,3],val:'태권도 17:00'},{days:[2,4],val:'피아노 16:00'}]},
      {label:'기타',items:[{days:[],val:'비상연락처 010-0000-0000'}]}
    ]},
    {id:2,name:'둘째',grade:'초등',year:'',cls:'',num:'',cats:[
      {label:'하교 시간',items:[]},{label:'학원',items:[]},{label:'기타',items:[]}
    ]}
  ],
  shiftData:{},
  deletedItems:[],
  customHolidays:[],
  holidayCache:{},
  repeatItems:[]
};

const TODAY=new Date();
const TY=TODAY.getFullYear(),TM=TODAY.getMonth(),TD=TODAY.getDate();
let main='s',subF='all',doneF='all',activePer='1w',donePer='1w',searchQ='',searchDraft='',isComposing=false,calWhoF='all',calViewMode='all',routineTargetFilter='all',scheduleSort='time',scheduleBaseOffset=0,homeViewRange='today',showRoutineInCalendar=false;
let shiftSelectMode=false,shiftSelectedDates=[],shiftBulkUser='';
let weekOpen=false;
let activeOpen=false;
let requestOpen=false,requestDoneOpen=false;
let routineOpen=false;
let todayDashboardOpen=false;
let routineDashboardOpen=false;
let basicInfoOpen=false;
let touchReorderInfo=null,touchReorderTimer=null;
let filterToday=false;
let calY=TY,calM=TM,selDate=null;
let _mType='family', _mWho='공통';
const DAYS=['일','월','화','수','목','금','토'];
const SHIFTS=['D','E','N','OFF'];
const DEFAULT_SHIFT_LABELS=['D','E','N','OFF','연차','반차'];
const SHIFT_NONE='__NONE__';
const SHIFT_DEFAULT='__DEFAULT__';
const SCLS={D:'s-d',E:'s-e',N:'s-n',OFF:'s-off'};
const MEMORY_ICONS=['🎂','🌹','🎆','🎉','🎊','🎁','⭐','💐','🥳','💍','🏥','✈️','🏡','🍀','☕','📌'];

const BASE_PERSONS = ['공통','아빠','엄마','초이','도미'];
const PERSON_COLORS=['#6B6B6F','#007AFF','#FF2D55','#34C759','#7C3AED','#FF9500','#00B7C2','#AF52DE'];
const PERSON_COLOR_PALETTE=['#8E8E93','#007AFF','#FF2D55','#34C759','#FF9500','#7C3AED','#00C7BE','#5856D6','#AF52DE','#FF6B00','#111827','#A2845E'];


const PERSON_AVATAR_GROUPS=[
  {key:'family',label:'가족',items:['family_1','family_2','family_3','family_4','family_5']},
  {key:'adultM',label:'성인 남자',items:['adultM_1','adultM_2','adultM_3','adultM_4','adultM_5']},
  {key:'adultF',label:'성인 여자',items:['adultF_1','adultF_2','adultF_3','adultF_4','adultF_5']},
  {key:'seniorM',label:'시니어 남자',items:['seniorM_1','seniorM_2','seniorM_3','seniorM_4','seniorM_5','seniorM_6']},
  {key:'seniorF',label:'시니어 여자',items:['seniorF_1','seniorF_2','seniorF_3','seniorF_4','seniorF_5','seniorF_6']},
  {key:'teenM',label:'청소년 남자',items:['teenM_1','teenM_2','teenM_3','teenM_4','teenM_5']},
  {key:'teenF',label:'청소년 여자',items:['teenF_1','teenF_2','teenF_3','teenF_4','teenF_5']},
  {key:'childM',label:'어린이 남자',items:['childM_1','childM_2','childM_3','childM_4','childM_5']},
  {key:'childF',label:'어린이 여자',items:['childF_1','childF_2','childF_3','childF_4','childF_5']}
];
const DEFAULT_AVATAR_ALIASES={
  dad_01:'adultM_1',dad_02:'adultM_2',dad_03:'adultM_3',dad_04:'adultM_4',dad_05:'adultM_5',
  mom_01:'adultF_1',mom_02:'adultF_2',mom_03:'adultF_3',mom_04:'adultF_4',mom_05:'adultF_5',
  boy_01:'childM_1',boy_02:'childM_2',boy_03:'childM_3',boy_04:'childM_4',boy_05:'childM_5',
  girl_01:'childF_1',girl_02:'childF_2',girl_03:'childF_3',girl_04:'childF_4',girl_05:'childF_5',
  grandpa_01:'seniorM_1',grandpa_02:'seniorM_2',grandpa_03:'seniorM_3',
  grandma_01:'seniorF_1',grandma_02:'seniorF_2',grandma_03:'seniorF_3',
  neutral_01:'family_1',neutral_02:'family_2',neutral_03:'family_3',neutral_04:'family_4'
};
const DEFAULT_AVATAR_GROUPS=[
  {key:'dad',label:'아빠',items:['dad_01','dad_02','dad_03','dad_04','dad_05']},
  {key:'mom',label:'엄마',items:['mom_01','mom_02','mom_03','mom_04','mom_05']},
  {key:'boy',label:'남자아이',items:['boy_01','boy_02','boy_03','boy_04','boy_05']},
  {key:'girl',label:'여자아이',items:['girl_01','girl_02','girl_03','girl_04','girl_05']},
  {key:'grandpa',label:'할아버지',items:['grandpa_01','grandpa_02','grandpa_03']},
  {key:'grandma',label:'할머니',items:['grandma_01','grandma_02','grandma_03']},
  {key:'neutral',label:'공용',items:['neutral_01','neutral_02','neutral_03','neutral_04']}
];
const AVATAR_EMOJI_OPTIONS=['👤','🙂','😊','😎','🧑','👨','👩','👦','👧','🧓','👵','🏠'];
const AVATAR_IMAGE_IDS=new Set(PERSON_AVATAR_GROUPS.flatMap(g=>g.items));
function resolveAvatarId(id){
  const token=String(id||'');
  return DEFAULT_AVATAR_ALIASES[token]||token;
}
function avatarItems(key){
  return (PERSON_AVATAR_GROUPS.find(g=>g.key===key)||{}).items||[];
}
function randomFrom(arr){
  return arr[Math.floor(Math.random()*arr.length)] || 'childM_1';
}
function randomYouthAvatar(name=''){
  const n=String(name||'');
  if(/남|아들|형|오빠|boy|male/i.test(n))return randomFrom([...avatarItems('teenM'),...avatarItems('childM')]);
  if(/여|딸|누나|언니|girl|female/i.test(n))return randomFrom([...avatarItems('teenF'),...avatarItems('childF')]);
  return randomFrom([...avatarItems('teenM'),...avatarItems('teenF'),...avatarItems('childM'),...avatarItems('childF')]);
}
function avatarSrc(id){
  const token=resolveAvatarId(id);
  if(AVATAR_IMAGE_IDS.has(token))return `./assets/avatars/aligned/${token}.png`;
  return AVATAR_IMAGE_IDS.has(token)?`./assets/avatars/${token}.webp`:'';
}
function avatarFallbackSrc(id){
  const token=resolveAvatarId(id);
  return AVATAR_IMAGE_IDS.has(token)?`./assets/avatars/${token}.webp`:'';
}
function handleAvatarError(img,id){
  if(!img)return;
  const tried=img.dataset.fallbackTried==='1';
  if(!tried){
    img.dataset.fallbackTried='1';
    img.src=avatarFallbackSrc(id);
    return;
  }
  img.style.display='none';
  const parent=img.parentElement;
  if(parent && !parent.querySelector('.avatar-fallback')){
    const span=document.createElement('span');
    span.className='avatar-fallback';
    span.textContent='👤';
    parent.appendChild(span);
  }
}
function avatarMarkup(id, alt='', cls='avatar-img'){
  if(isFamilyGroupTarget(alt))return familyStackAvatarMarkup(cls);
  const raw=String(id||'');
  const token=resolveAvatarId(raw);
  if(AVATAR_IMAGE_IDS.has(token)){
    return `<img class="${cls} avatar-token-${escapeAttr(raw)}" src="${avatarSrc(token)}" alt="${escapeAttr(alt||'아바타')}" loading="lazy" onerror="handleAvatarError(this,'${escapeAttr(token)}')"/>`;
  }
  return `<span class="avatar-fallback">${escapeHtml(raw||'👤')}</span>`;
}
function isFamilyGroupTarget(name){
  const n=String(name||'').trim();
  return n==='공통'||n==='가족'||n==='怨듯넻'||n.toLowerCase()==='family';
}
function familyStackNames(){
  const names=(getPersons?getPersons():[]).filter(p=>p&&!isFamilyGroupTarget(p));
  const fallback=['아빠','엄마','초이'].filter(p=>!names.includes(p));
  return [...names,...fallback].slice(0,3);
}
function familyStackAvatarMarkup(cls='family-stack-avatar'){
  const safeCls=escapeAttr(`${cls||''} family-stack-avatar`.trim());
  const people=familyStackNames();
  const items=people.map(p=>`<span class="family-stack-item" title="${escapeAttr(p)}">${avatarMarkup(personAvatar(p),p,'family-stack-img')}</span>`).join('');
  return `<span class="${safeCls}" aria-label="가족">${items||'<span class="family-stack-fallback">가족</span>'}</span>`;
}
function defaultAvatarForName(name){
  const n=(name||'').trim();
  if(n==='공통')return 'family_1';
  if(n==='아빠')return 'adultM_1';
  if(n==='엄마')return 'adultF_2';
  if(n==='초이')return 'teenF_2';
  if(n==='도미')return 'childF_3';
  return randomYouthAvatar(n);
}
function shouldAutoReplaceAvatar(k){
  if(!k)return true;
  if(k.avatarCustom && AVATAR_IMAGE_IDS.has(k.avatar))return false;
  return !AVATAR_IMAGE_IDS.has(k.avatar||'');
}
function personAvatar(name){
  const n=(name||'공통').trim();
  const p=(family||[]).find(x=>(x.name||'').trim()===n);
  const token=resolveAvatarId((p&&p.avatar)||defaultAvatarForName(n));
  return AVATAR_IMAGE_IDS.has(token) ? token : defaultAvatarForName(n);
}
function personAvatarConfig(name){
  const n=(name||'공통').trim();
  const p=(family||[]).find(x=>(x.name||'').trim()===n);
  const avatarId=(p&&((p.avatarId)||p.avatar))||defaultAvatarForName(n);
  const avatarType=(p&&p.avatarType)||(p&&p.avatarUrl?'photo':(p&&p.avatarEmoji?'emoji':'default'));
  return {
    avatarType,
    avatarId,
    avatarEmoji:(p&&p.avatarEmoji)||'',
    avatarUrl:(p&&p.avatarUrl)||'',
    color:(p&&p.color)||personColor(n)
  };
}
function handleAvatarFrameError(img,id){
  if(!img)return;
  if(img.dataset.fallbackTried==='1'){
    handleAvatarError(img,resolveAvatarId(id));
    return;
  }
  img.dataset.fallbackTried='1';
  img.src=avatarSrc(resolveAvatarId(id||'family_1'));
}
function avatarFrameMarkup(configOrId, alt='', cls='avatarFrame'){
  const cfg=(configOrId&&typeof configOrId==='object')?configOrId:{avatarType:'default',avatarId:configOrId};
  const fallbackId=resolveAvatarId(cfg.avatarId||defaultAvatarForName(alt));
  const safeAlt=escapeAttr(alt||'아바타');
  const safeCls=escapeAttr(cls||'avatarFrame');
  const frameStyle=cfg.color?` style="--avatar-tint:${hexToRgba(cfg.color,.08)}"`:'';
  if(isFamilyGroupTarget(alt) && cfg.avatarType!=='photo' && cfg.avatarType!=='emoji'){
    return familyStackAvatarMarkup(safeCls);
  }
  let body='';
  if(cfg.avatarType==='photo'&&cfg.avatarUrl){
    body=`<img src="${escapeAttr(cfg.avatarUrl)}" alt="${safeAlt}" loading="lazy" onerror="handleAvatarFrameError(this,'${escapeAttr(fallbackId)}')"/>`;
  }else if(cfg.avatarType==='emoji'&&cfg.avatarEmoji){
    body=`<span class="avatar-emoji">${escapeHtml(cfg.avatarEmoji)}</span>`;
  }else if(AVATAR_IMAGE_IDS.has(fallbackId)){
    body=`<img src="${avatarSrc(fallbackId)}" alt="${safeAlt}" loading="lazy" onerror="handleAvatarFrameError(this,'${escapeAttr(fallbackId)}')"/>`;
  }else{
    body=`<span class="avatar-fallback">👤</span>`;
  }
  return `<span class="${safeCls}"${frameStyle}>${body}</span>`;
}
function selectKidAvatar(icon){
  const el=document.getElementById('k-avatar');
  if(el)el.value=icon;
  const avatarId=document.getElementById('k-avatar-id');
  if(avatarId)avatarId.value=icon;
  const type=document.getElementById('k-avatar-type');
  if(type)type.value='default';
  const custom=document.getElementById('k-avatar-custom');
  if(custom)custom.value='1';
  document.querySelectorAll('.avatar-choice').forEach(b=>{
    b.classList.toggle('on',b.dataset.avatar===icon);
  });
  document.querySelectorAll('.avatar-emoji-choice').forEach(b=>b.classList.remove('on'));
  updateKidAvatarPreview();
}

function selectKidEmojiAvatar(emoji){
  const type=document.getElementById('k-avatar-type');
  const emojiEl=document.getElementById('k-avatar-emoji');
  const custom=document.getElementById('k-avatar-custom');
  if(type)type.value='emoji';
  if(emojiEl)emojiEl.value=emoji||'';
  if(custom)custom.value='1';
  document.querySelectorAll('.avatar-choice').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.avatar-emoji-choice').forEach(b=>b.classList.toggle('on',b.dataset.emoji===String(emoji||'')));
  updateKidAvatarPreview();
}
function updateKidAvatarPreview(){
  const preview=document.getElementById('kid-avatar-preview');
  if(!preview)return;
  const type=(document.getElementById('k-avatar-type')||{}).value||'default';
  const avatarId=(document.getElementById('k-avatar-id')||{}).value||(document.getElementById('k-avatar')||{}).value||'family_1';
  const avatarEmoji=(document.getElementById('k-avatar-emoji')||{}).value||'';
  const avatarUrl=(document.getElementById('k-avatar-url')||{}).value||'';
  preview.innerHTML=avatarFrameMarkup({avatarType:type,avatarId,avatarEmoji,avatarUrl},'아바타','avatarFrame avatar-preview-frame');
}
function handleKidPhotoFile(input){
  const file=input&&input.files&&input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    const type=document.getElementById('k-avatar-type');
    const url=document.getElementById('k-avatar-url');
    const custom=document.getElementById('k-avatar-custom');
    if(type)type.value='photo';
    if(url)url.value=String(reader.result||'');
    if(custom)custom.value='1';
    document.querySelectorAll('.avatar-choice,.avatar-emoji-choice').forEach(b=>b.classList.remove('on'));
    updateKidAvatarPreview();
  };
  reader.readAsDataURL(file);
}
function clearKidPhotoAvatar(){
  const type=document.getElementById('k-avatar-type');
  const url=document.getElementById('k-avatar-url');
  if(type)type.value='default';
  if(url)url.value='';
  updateKidAvatarPreview();
}

function occursOnIgnoringHoliday(n,key){
  if(!n.start)return false;
  if(n.repeatEnd && key>n.repeatEnd)return false;
  if(Array.isArray(n.skipDates) && n.skipDates.includes(key))return false;

  if(!n.repeat){
    if(!n.end || n.end===n.start)return n.start===key;
    return n.start<=key && key<=n.end;
  }

  if(key<n.start)return false;
  const start=new Date(n.start+'T00:00:00');
  const cur=new Date(key+'T00:00:00');
  const diff=Math.round((cur-start)/86400000);
  if(n.repeat==='daily')return diff>=0;
  if(n.repeat==='weekly')return diff>=0 && diff%7===0;
  if(n.repeat==='monthly')return n.start.slice(8,10)===key.slice(8,10);
  return false;
}
function holidayHiddenRoutineCount(dateKey){
  if(!holidayName(dateKey))return 0;
  const [y,m,d]=dateKey.split('-').map(Number);
  const dow=new Date(y,m-1,d).getDay();
  let cnt=0;

  (notes||[]).forEach(n=>{
    if(isDone(n)||!n.repeat)return;
    if(occursOnIgnoringHoliday(n,dateKey))cnt++;
  });

  (repeatItems||[]).forEach(r=>{
    const title=String(r.title||'').trim();
    const days=Array.isArray(r.days)?r.days:[];
    if(!title || !days.includes(dow))return;
    if(r.start && dateKey<r.start)return;
    if(r.repeatEnd && dateKey>r.repeatEnd)return;
    if(Array.isArray(r.skipDates) && r.skipDates.includes(dateKey))return;
    if(r.pauseOnVacation && isPersonVacation(r.who||'공통',dateKey))return;
    cnt++;
  });

  return cnt;
}
function calendarHiddenRoutineNotice(selDate){
  const holidayCnt=holidayHiddenRoutineCount(selDate);
  const oneOffModeHidden=(calViewMode==='all');
  const [y,m,d]=selDate.split('-').map(Number);
  const routines=notesOnDateAll(y,m-1,d).filter(n=>isRoutineCalendarEvent(n)).length;
  let html='';
  if(holidayCnt){
    html+=`<div class="hidden-routine-note">💡 공휴일이라 반복 ${holidayCnt}개가 자동으로 쉬어요.</div>`;
  }
  if(oneOffModeHidden && routines){
    html+=`<div class="hidden-routine-note">💡 가족 보기에서는 달력 칸의 반복 점을 숨겨요. 아래 상세에는 반복이 모두 표시됩니다. <button onclick="setCalendarViewMode('routine')">반복 보기</button></div>`;
  }
  return html;
}

function renderSelectedDayList(mems,evs,selDate,sp,opts={}){
  const notice=opts.suppressNotice?'':calendarHiddenRoutineNotice(selDate);
  if(!mems.length && !evs.length){
    if(opts.hideEmpty)return notice;
    return renderEmptyState('generic','등록된 일정이 없어요','선택한 날짜에는 아직 기록이 없어요.')+notice;
  }

  let html='';

  if(mems.length){
    html += [...mems].sort(calendarMemorySort).map(x=>calendarMemoryItem(x,sp)).join('');
  }

  const oneOffs=(evs||[]).filter(n=>!(n.repeat||n._autoFamilyInfo));
  if(oneOffs.length){
    html += `<div class="selected-day-section-label">등록 일정</div>`;
    html += [...oneOffs].sort(calendarDetailSort).map(n=>calendarEventItem(n,selDate)).join('');
  }

  const routines=(evs||[]).filter(n=>(n.repeat||n._autoFamilyInfo));
  if(routines.length){
    html += `<div class="selected-day-section-label routine-label">반복</div>`;
    const groups={};
    routines.forEach(r=>{
      const who=r.who||'공통';
      if(!groups[who])groups[who]=[];
      groups[who].push(r);
    });

    const persons=getPersons();
    const groupKeys=Object.keys(groups).sort((a,b)=>{
      const ia=persons.indexOf(a);
      const ib=persons.indexOf(b);
      return (ia<0?999:ia)-(ib<0?999:ib);
    });

    groupKeys.forEach(who=>{
      const personRoutines=groups[who].sort(calendarDetailSort);
      const itemsHtml=personRoutines.map(n=>{
        const tm=calendarTimeOnly(n);
        const title=highlightText(n.title||'일정');
        const clickAttr=`onclick="openRoutineInstanceDetail(${onclickArg(n.title||'반복')},${onclickArg(n.who||'공통')},${onclickArg(tm)},${onclickArg(selDate)},${onclickArg(n._autoFamilyInfo?'auto':'note')},${onclickArg(n._autoFamilyInfo?n._originalRoutineId:n.id)})" style="cursor:pointer"`;
        return `<div class="routine-group-row" ${clickAttr}>
          <div class="routine-group-main">
            <div class="routine-group-title">${title}</div>
            ${tm&&tm!=='시간 미정'?`<div class="routine-group-time">${escapeHtml(tm)}</div>`:''}
          </div>
          ${n.alertMemo?`<div class="ev-alert routine-alert">${escapeHtml(n.alertMemo)}</div>`:''}
        </div>`;
      }).join('');

      html += `<div class="ev-item cal-selected-event routine-group-card">
        <div class="routine-group-avatar-col">
          <div class="ev-avatar routine-group-avatar">${avatarMarkup(personAvatar(who),who)}</div>
          <div class="routine-group-person under-avatar">${escapeHtml(who)}</div>
        </div>
        <div class="ev-info routine-group-info">
          <div class="routine-group-box">${itemsHtml}</div>
        </div>
      </div>`;
    });
  }

  return html+notice;
}

function calendarSelectedDateLabel(dateKey){
  const [y,m,d]=String(dateKey||todayKey()).split('-').map(Number);
  const dow=y&&m&&d?`${DAYS[new Date(y,m-1,d).getDay()]}요일`:'';
  return `${m||''}월 ${d||''}일 ${dow}`.trim();
}
function calendarRepeatChipTime(n){
  const s=n?.sT||'';
  const e=n?.eT||'';
  if(s&&e)return `${s}~${e}`;
  if(s)return s;
  if(e)return `~${e}`;
  return '';
}
function renderRepeatDetailSection(selDate,routines=[],opts={}){
  routines=(routines||[])
    .filter(n=>isRoutineCalendarEvent(n));
  const groups=new Map();
  const seen=new Set();
  routines.sort(calendarDetailSort).forEach(n=>{
    const who=n.who||'공통';
    const tm=calendarRepeatChipTime(n);
    const title=n.title||'반복';
    const rid=n._autoFamilyInfo?n._originalRoutineId:n.id;
    const key=`${rid||''}|${who}|${tm}|${title}`;
    if(seen.has(key))return;
    seen.add(key);
    if(!groups.has(who))groups.set(who,[]);
    groups.get(who).push({...n,_chipTime:tm});
  });
  const persons=getPersons();
  const order=who=>{
    const i=persons.indexOf(who);
    return i<0?999:i;
  };
  const content=groups.size
    ? [...groups.entries()].sort((a,b)=>order(a[0])-order(b[0])).map(([who,items])=>`
      <div class="cal-repeat-person-group">
        <div class="cal-repeat-avatar">${avatarFrameMarkup(personAvatarConfig(who),who,'avatarFrame calendar-repeat-avatar-frame')}</div>
        <div class="cal-repeat-name" style="color:${familyAccentColor(who)}">${escapeHtml(who)}</div>
        <div class="cal-repeat-chip-wrap">
          ${items.map(n=>{
            const tm=n._chipTime||'';
            const title=n.title||'반복';
            const kind=n._autoFamilyInfo?'auto':'note';
            const rid=n._autoFamilyInfo?n._originalRoutineId:n.id;
            return `<button type="button" class="cal-repeat-chip" onclick="openRoutineInstanceDetail(${onclickArg(title)},${onclickArg(who)},${onclickArg(tm)},${onclickArg(selDate)},${onclickArg(kind)},${onclickArg(rid)})"><span class="www-repeat-mark">&#8635;</span>${tm?`<span class="www-chip-time">${escapeHtml(tm)}</span>`:''}<span class="www-chip-title">${highlightText(title)}</span></button>`;
          }).join('')}
        </div>
      </div>`).join('')
    : (opts.hideWhenEmpty?'':`<div class="cal-repeat-empty">등록된 반복 일정이 없어요</div>`);
  if(!content)return '';
  return `<div class="cal-repeat-groups">${content}</div>`;
}
function renderRepeatOnlyDetail(selDate,evs=[]){
  return renderCalendarWWWDetailCard(selDate,renderCalendarWWWDetailRows(selDate,{evs:(evs||[]).filter(n=>isRoutineCalendarEvent(n)),hideEmpty:false}),'calendar-repeat-detail');
}
function renderRepeatOnlyDetailLegacy(selDate,evs=[]){
  const routines=(evs||[])
    .filter(n=>isRoutineCalendarEvent(n))
    .filter(n=>calWhoF==='all'||(n.who||'공통')===calWhoF);
  const groups=new Map();
  const seen=new Set();
  routines.sort(calendarDetailSort).forEach(n=>{
    const who=n.who||'공통';
    const tm=calendarRepeatChipTime(n);
    const title=n.title||'반복';
    const rid=n._autoFamilyInfo?n._originalRoutineId:n.id;
    const key=`${rid||''}|${who}|${tm}|${title}`;
    if(seen.has(key))return;
    seen.add(key);
    if(!groups.has(who))groups.set(who,[]);
    groups.get(who).push({...n,_chipTime:tm});
  });
  const persons=getPersons();
  const order=who=>{
    const i=persons.indexOf(who);
    return i<0?999:i;
  };
  const content=groups.size
    ? [...groups.entries()].sort((a,b)=>order(a[0])-order(b[0])).map(([who,items])=>`
      <div class="cal-repeat-person-group">
        <div class="cal-repeat-avatar">${avatarFrameMarkup(personAvatarConfig(who),who,'avatarFrame calendar-repeat-avatar-frame')}</div>
        <div class="cal-repeat-name" style="color:${familyAccentColor(who)}">${escapeHtml(who)}</div>
        <div class="cal-repeat-chip-wrap">
          ${items.map(n=>{
            const tm=n._chipTime||'';
            const title=n.title||'반복';
            const kind=n._autoFamilyInfo?'auto':'note';
            const rid=n._autoFamilyInfo?n._originalRoutineId:n.id;
            return `<button type="button" class="cal-repeat-chip" onclick="openRoutineInstanceDetail(${onclickArg(title)},${onclickArg(who)},${onclickArg(tm)},${onclickArg(selDate)},${onclickArg(kind)},${onclickArg(rid)})"><span class="www-repeat-mark">↻</span>${tm?`<span class="www-chip-time">${escapeHtml(tm)}</span>`:''}<span class="www-chip-title">${highlightText(title)}</span></button>`;
          }).join('')}
        </div>
      </div>`).join('')
    : `<div class="cal-repeat-empty">등록된 반복 일정이 없어요.</div>`;
  return `<div class="ev-card calendar-detail-card calendar-repeat-detail" id="selected-day-panel" ontouchstart="startPanelSwipe(event)" ontouchmove="movePanelSwipe(event)" ontouchend="endPanelSwipe(event)">
    <div class="calendar-detail-head">
      <div class="calendar-detail-title">반복 일정</div>
      <div class="calendar-detail-date">${escapeHtml(calendarSelectedDateLabel(selDate))}</div>
    </div>
    <div class="cal-repeat-groups">${content}</div>
  </div>`;
}

function renderWorkOnlyDetail(selDate){
  return renderCalendarWWWDetailCard(selDate,renderCalendarWWWDetailRows(selDate,{includeShift:true,hideEmpty:false}),'calendar-work-detail');
}
function calendarWWWChipTime(n){
  if(isRoutineCalendarEvent(n))return calendarRepeatChipTime(n);
  return todayChipClockLabel(n);
}
function calendarWWWGroupOrder(who){
  const people=getPersons();
  const idx=people.indexOf(who);
  if(idx>=0)return idx;
  if(who==='가족'||who==='공통')return -1;
  return 999;
}
function renderCalendarWWWDetailCard(selDate,rowsHtml,extraClass=''){
  const holiday=holidayName(selDate);
  return `<div class="ev-card calendar-detail-card calendar-www-detail ${extraClass}" id="selected-day-panel" ontouchstart="startPanelSwipe(event)" ontouchmove="movePanelSwipe(event)" ontouchend="endPanelSwipe(event)">
    <div class="calendar-www-detail-date">${escapeHtml(calendarSelectedDateLabel(selDate))}${holiday?` <span>${escapeHtml(holiday)}</span>`:''}</div>
    <div class="calendar-www-detail-divider"></div>
    <div class="calendar-www-detail-rows">${rowsHtml}</div>
  </div>`;
}
function renderCalendarWWWDetailRows(selDate,opts={}){
  const groups=new Map();
  const seen=new Set();
  let order=0;
  const ensure=who=>{
    const name=who||'가족';
    if(!groups.has(name))groups.set(name,{who:name,items:[]});
    return groups.get(name);
  };
  const push=(who,item)=>{
    const key=item.key||`${item.kind}|${who}|${item.title||''}|${item.time||''}`;
    if(seen.has(key))return;
    seen.add(key);
    ensure(who).items.push({...item,order:order++});
  };

  if(opts.includeShift){
    normalizeShiftUsers();
    const users=calViewMode==='work'?[calendarWorkUser()]:shiftUsers;
    users.forEach(user=>{
      const status=shiftDisplayStatusFor(selDate,user);
      if(!status)return;
      const label=workCalendarShiftLabel(status);
      push(user,{
        kind:'shift',
        title:label,
        time:'',
        className:`shift-chip ${shiftBadgeClass(status)}`,
        html:`<span class="www-shift-label">${escapeHtml(label)}</span>`,
        click:`openShiftPicker('${selDate}',true)`,
        key:`shift|${user}|${selDate}|${status}`
      });
    });
  }

  (opts.mems||[]).sort(calendarMemorySort).forEach(x=>{
    const who=memoryDisplaySubject(x)||memoryPerson(x)||'가족';
    const title=x.name||'기념일';
    const sub=memoryAgeLabel(x);
    push(who,{
      kind:'memory',
      title,
      time:'',
      className:'memory-chip',
      html:`<span class="www-chip-title">${escapeHtml(title)}</span>${sub?`<span class="www-chip-time">${escapeHtml(sub)}</span>`:''}`,
      click:x.id?`openMemoryModal('${x.id}')`:'',
      key:`memory|${x.id||''}|${who}|${title}`
    });
  });

  (opts.evs||[]).sort(calendarDetailSort).forEach(n=>{
    const who=n.who||'가족';
    if(isRoutineCalendarEvent(n)){
      const time=calendarWWWChipTime(n);
      const title=n.title||'반복';
      const kind=n._autoFamilyInfo?'auto':'note';
      const rid=n._autoFamilyInfo?n._originalRoutineId:n.id;
      push(who,{
        kind:'routine',
        title,
        time,
        className:'routine',
        html:`<span class="www-repeat-mark">&#8635;</span>${time?`<span class="www-chip-time">${escapeHtml(time)}</span>`:''}<span class="www-chip-title">${highlightText(title)}</span>`,
        click:`openRoutineInstanceDetail(${onclickArg(title)},${onclickArg(who)},${onclickArg(time)},${onclickArg(selDate)},${onclickArg(kind)},${onclickArg(rid)})`,
        key:`routine|${rid||''}|${who}|${time}|${title}`
      });
      return;
    }
    const time=calendarWWWChipTime(n);
    const title=displayNoteTitle(n);
    push(who,{
      kind:'schedule',
      title,
      time,
      className:isDone(n)?'done':'',
      html:`${time?`<span class="www-chip-time">${escapeHtml(time)}</span>`:''}<span class="www-chip-title">${highlightText(title)}</span>${privateChip(n)}`,
      click:n.id?`openEditNote('${n.id}')`:'',
      key:`schedule|${n.id||''}|${who}|${selDate}|${time}|${title}`
    });
  });

  const rows=[...groups.values()]
    .filter(g=>g.items.length)
    .sort((a,b)=>calendarWWWGroupOrder(a.who)-calendarWWWGroupOrder(b.who))
    .map(group=>`<div class="calendar-www-row">
      <div class="www-person-avatar-col">${avatarFrameMarkup(personAvatarConfig(group.who),group.who,'avatarFrame www-avatar-frame')}</div>
      <div class="www-person-name" style="color:${familyAccentColor(group.who)}">${escapeHtml(group.who)}</div>
      <div class="www-chip-wrap">
        ${group.items.sort((a,b)=>todayChipSortKey(a).localeCompare(todayChipSortKey(b),'ko')).map(item=>item.click?`<button type="button" class="www-chip ${item.className||''}" onclick="event.stopPropagation();${item.click}" aria-label="${escapeAttr(`${group.who} ${item.title||'일정'} 수정`)}">${item.html}</button>`:`<span class="www-chip ${item.className||''} static">${item.html}</span>`).join('')}
      </div>
    </div>`).join('');

  if(rows)return rows;
  if(opts.hideEmpty)return '';
  return `<div class="calendar-www-empty">선택한 날짜에는 아직 일정이 없어요.</div>`;
}
function setCalendarViewMode(mode){
  calViewMode=mode||'all';
  if(calViewMode!=='work' && shiftSelectMode){
    shiftSelectMode=false;
    shiftSelectedDates=[];
  }
  if(calViewMode==='work'){
    selDate=selDate||todayKey();
    const sp=selDate.split('-');
    calY=+sp[0];
    calM=+sp[1]-1;
  }
  ensureCalendarTargetForView();
  render({preserveScroll:true});
}
function openCalendarWorkTab(dateKey=''){
  main='c';
  calViewMode='work';
  shiftSelectMode=false;
  shiftSelectedDates=[];
  selDate=dateKey||todayKey();
  if(dateKey){
    const parts=String(dateKey).split('-').map(Number);
    if(parts.length>=2 && parts[0] && parts[1]){
      calY=parts[0];
      calM=parts[1]-1;
    }
  }
  updateTabUI();
  render({preserveScroll:false});
  setTimeout(()=>{
    try{document.querySelector('.cal-card')?.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
  },80);
}
function handleDateHeaderClick(dateKey=''){
  const k=dateKey||scheduleBaseKey()||todayKey();
  main='c';
  calViewMode='all';
  shiftSelectMode=false;
  shiftSelectedDates=[];
  selDate=k;
  const parts=String(k).split('-').map(Number);
  if(parts.length>=2 && parts[0] && parts[1]){
    calY=parts[0];
    calM=parts[1]-1;
  }
  updateTabUI();
  render({preserveScroll:false});
  setTimeout(()=>{
    try{document.querySelector('.cal-card')?.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
  },80);
}
function calendarViewLabel(mode){
  return mode==='work'?'근무':mode==='schedule'?'일정':mode==='routine'?'반복':'전체';
}
function shiftLabelForDate(k){
  const cur=shiftData[k]||'';
  return cur?`근무 ${cur}`:'근무 미입력';
}
function openShiftPicker(dateKey,workOnly=false){
  if(!requireEditMode())return;
  normalizeShiftUsers();
  const pickerUsers=workOnly?[calendarWorkUser()]:shiftUsers;
  const [y,m,d]=dateKey.split('-').map(Number);
  const dow=DAYS[new Date(y,m-1,d).getDay()];
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet shift-edit-sheet multi-shift-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">${m}월 ${d}일 (${dow}) 근무</div>
      <div class="multi-shift-list">
        ${pickerUsers.map(user=>{
          const cur=shiftStatusFor(dateKey,user);
          const raw=shiftExplicitStatusFor(dateKey,user);
          const explicit=raw && !isShiftNoneValue(raw);
          const noneToday=isShiftNoneValue(raw);
          const defaultOnly=isShiftDefaultOnly(dateKey,user,cur);
          const p=(family||[]).find(f=>(f.name||'')===user);
          const labels=shiftPersonLabelList(user);
          return `<div class="multi-shift-person">
            <div class="multi-shift-person-head">
              <span class="multi-shift-avatar">${avatarMarkup(personAvatar(user),user,'avatar-img-small')}</span>
              <b>${escapeHtml(user)}</b>
              ${noneToday?`<span class="default-state-note none">오늘만 미입력</span>`:(defaultOnly?`<span class="default-state-note">기본 ${escapeHtml(cur)}</span>`:'')}
            </div>
            <div class="multi-shift-options">
              ${labels.map(label=>`<button class="multi-shift-option ${cur===label&&!noneToday?'on':''} ${shiftBadgeClass(label)}" onclick="setShiftStatus('${dateKey}',${onclickArg(user)},${onclickArg(label)},true)">${escapeHtml(label)}</button>`).join('')}
              <button class="multi-shift-option clear" onclick="setShiftStatus('${dateKey}',${onclickArg(user)},SHIFT_DEFAULT,true)">기본값으로</button>
              <button class="multi-shift-option none" onclick="setShiftStatus('${dateKey}',${onclickArg(user)},SHIFT_NONE,true)">오늘만 미입력</button>
            </div>
          </div>`;
        }).join('')}
      </div>
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function setShiftFromModal(k,t){
  setShift(k,t);
  closeM();
  showToast('상태를 변경했어요.');
}

function renderCalendarViewModeChips(){
  const modes=[['all','전체'],['work','근무'],['schedule','일정'],['routine','반복']];
  return `<div class="calendar-view-mode-row calendar-view-tabs">${modes.map(([k,label])=>`<button class="cal-view-chip${calViewMode===k?' on':''}" onclick="setCalendarViewMode('${k}')">${label}</button>`).join('')}</div>`;
}
function filterCalendarEventsByTarget(evs){
  return evs||[];
}
function filterCalendarMemoriesByTarget(mems){
  return mems||[];
}
function calendarLegendDotColor(who){
  const name=String(who||'').trim();
  if(!name || name==='가족' || name==='공통')return '#94A3B8';
  return familyAccentColor(name);
}
function calendarDotCandidates(evs,mems){
  const oneOffs=(evs||[]).filter(n=>!isRoutineCalendarEvent(n));
  const routines=(evs||[]).filter(n=>isRoutineCalendarEvent(n));
  let out=[];
  const add=(key,color,title,rank=100)=>{
    if(!out.some(x=>x.key===key))out.push({key,color,title,rank});
  };

  if(calViewMode==='work')return [];

  if(calViewMode==='all' || calViewMode==='schedule'){
    (mems||[]).forEach(x=>add(`mem-${x.id||x.name}`, 'var(--orange)', x.name||'축하', 1));
    oneOffs.sort(calendarDetailSort).forEach(n=>{
      const who=n.who||'공통';
      const rank=who==='공통'?2:10+personRank(n);
      add(`person-${who}`, calendarLegendDotColor(who), who, rank);
    });
  }else if(calViewMode==='routine'){
    routines.sort(calendarDetailSort).forEach(n=>{
      const who=n.who||'공통';
      add(`routine-${who}`, calendarLegendDotColor(who), who, 20+personRank(n));
    });
  }

  out.sort((a,b)=>a.rank-b.rank);
  return out;
}
function renderCalendarCellDots(evs,mems){
  const items=calendarDotCandidates(evs,mems);
  const shown=items.slice(0,2);
  const more=items.length-shown.length;
  return shown.map(x=>{
    return `<span class="cal-dot person-cal-dot${calViewMode==='routine'?' repeat-dot':''}" style="background:${x.color}" title="${escapeAttr(x.title)}"></span>`;
  }).join('')+
    (more>0?`<span class="cal-dot-more">+${more}</span>`:'');
}
function renderCalendarPersonLegend(){
  if(calViewMode==='work')return '';
  const people=getPersons().filter(p=>!isFamilyGroupTarget(p));
  return `<div class="calendar-dot-legend" aria-label="달력 점 색상 범례">
    <span class="calendar-dot-legend-item"><span class="calendar-filter-dot neutral-dot"></span><span>가족</span></span>
    ${people.map(p=>`<span class="calendar-dot-legend-item"><span class="calendar-filter-dot" style="background:${calendarLegendDotColor(p)}"></span><span>${escapeHtml(p)}</span></span>`).join('')}
  </div>`;
}

function renderCalendarAvatars(people){
  const arr=(people||[]).filter(Boolean);
  const shown=arr.slice(0,3);
  const more=arr.length-shown.length;
  return shown.map(p=>`<span class="cal-avatar" title="${escapeAttr(p)}">${avatarMarkup(personAvatar(p),p)}</span>`).join('')+
    (more>0?`<span class="cal-avatar-more">+${more}</span>`:'');
}

function monthKeysForCalendar(){
  const days=new Date(calY,calM+1,0).getDate();
  const keys=[];
  for(let d=1;d<=days;d++)keys.push(dk(calY,calM,d));
  return keys;
}
function calendarPeopleWithDataForMode(){
  const people=getPersons().filter(p=>!isFamilyGroupTarget(p));
  if(calViewMode==='all')return people;
  if(calViewMode==='work')return [];
  if(calViewMode!=='schedule' && calViewMode!=='routine')return people;
  const hasData=new Set();
  const keys=monthKeysForCalendar();
  keys.forEach(k=>{
    const [y,m,d]=k.split('-').map(Number);
    notesOnDateAll(y,m-1,d).forEach(n=>{
      const isRoutine=isRoutineCalendarEvent(n);
      if(calViewMode==='schedule' && isRoutine)return;
      if(calViewMode==='routine' && !isRoutine)return;
      const who=n.who||'공통';
      if(people.includes(who))hasData.add(who);
    });
  });
  return people.filter(p=>hasData.has(p));
}
function ensureCalendarTargetForView(){
  calWhoF='all';
  return;
  if(calViewMode==='work'){
    calWhoF='all';
    return;
  }
  if(calViewMode==='all'){
    if(!calWhoF)calWhoF='all';
    return;
  }
  if(calViewMode!=='schedule' && calViewMode!=='routine')return;
  const visible=calendarPeopleWithDataForMode();
  if(calWhoF==='all' || !visible.includes(calWhoF)){
    calWhoF=visible[0]||'all';
  }
}
function renderCalendarPersonFilter(){
  return renderCalendarPersonLegend();
}

function isHiddenBasePerson(name){
  return Array.isArray(hiddenBasePersons) && hiddenBasePersons.includes((name||'').trim());
}
function hideBasePerson(name){
  name=(name||'').trim();
  if(!name || !BASE_PERSONS.includes(name))return;
  if(!Array.isArray(hiddenBasePersons))hiddenBasePersons=[];
  if(!hiddenBasePersons.includes(name))hiddenBasePersons.push(name);
}
function unhideBasePerson(name){
  name=(name||'').trim();
  if(!name || !Array.isArray(hiddenBasePersons))return;
  hiddenBasePersons=hiddenBasePersons.filter(x=>x!==name);
}

function ensureBaseTargets(){
  if(!Array.isArray(family))family=[];
  BASE_PERSONS.forEach(name=>{
    if(isHiddenBasePerson(name))return;
    if(!family.some(x=>(x.name||'').trim()===name)){
      const def=['아빠','엄마','초이','도미'].includes(name);
      family.push({id:Date.now()+Math.random(),name,avatar:defaultAvatarForName(name),avatarCustom:false,grade:'',year:'',cls:'',num:'',cats:[],showToday:def,showRoutine:def,vacations:[]});
    }
  });
  family.forEach(k=>{
    const nm=(k.name||'').trim();
    const def=['아빠','엄마','초이','도미'].includes(nm);
    if(shouldAutoReplaceAvatar(k))k.avatar=defaultAvatarForName(nm);
    if(!('avatarCustom' in k))k.avatarCustom=false;
    if(!('showToday' in k))k.showToday=def;
    if(!('showRoutine' in k))k.showRoutine=('showToday' in k)?!!k.showToday:def;
    if(!('showRequestWriter' in k))k.showRequestWriter=def;

    if(!Array.isArray(k.vacations))k.vacations=[];
    if((k.vacationStart||k.vacationEnd) && !k.vacations.some(v=>v.start===k.vacationStart&&v.end===k.vacationEnd)){
      k.vacations.push({start:k.vacationStart||'',end:k.vacationEnd||''});
    }
    delete k.vacationStart;
    delete k.vacationEnd;
  });
}
function getPersons(){
  const names=[];
  (family||[]).forEach(k=>{
    const n=(k.name||'').trim();
    if(n && !names.includes(n) && !isHiddenBasePerson(n))names.push(n);
  });
  BASE_PERSONS.forEach(n=>{if(!isHiddenBasePerson(n) && !names.includes(n))names.push(n)});
  return names;
}
function defaultPersonColor(who){
  const w=who||'공통';
  if(w==='공통')return '#8E8E93';
  if(w==='아빠')return '#007AFF';
  if(w==='엄마')return '#FF2D55';
  if(w==='초이')return '#34C759';
  if(w==='도미')return '#FF9500';
  const arr=getPersons();
  const idx=Math.max(0,arr.indexOf(w));
  const extra=['#5856D6','#00C7BE','#AF52DE','#FF6B00','#111827'];
  return extra[idx%extra.length];
}
function personColor(who){
  const w=who||'공통';
  const person=(family||[]).find(x=>(x.name||'').trim()===String(w).trim());
  if(person&&person.color)return person.color;
  return defaultPersonColor(w);
}
function personCls(who){
  const arr=getPersons();
  const idx=Math.max(0,arr.indexOf(who||'공통'));
  return ['person-common','person-dad','person-mom','person-choi','person-domi'][idx%5]||'person-common';
}

function hexToRgba(hex,a=.14){
  const h=String(hex||'#6B6B6F').replace('#','');
  const full=h.length===3?h.split('').map(x=>x+x).join(''):h.padEnd(6,'0').slice(0,6);
  const n=parseInt(full,16);
  const r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  return `rgba(${r},${g},${b},${a})`;
}
function hexToRgb(hex){
  const h=String(hex||'#6B6B6F').replace('#','');
  const full=h.length===3?h.split('').map(x=>x+x).join(''):h.padEnd(6,'0').slice(0,6);
  const n=parseInt(full,16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}
function rgbToHex(r,g,b){
  return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
}
function mixHex(a,b,amount=.35){
  const ca=hexToRgb(a), cb=hexToRgb(b);
  const p=Math.max(0,Math.min(1,amount));
  return rgbToHex(ca.r*(1-p)+cb.r*p,ca.g*(1-p)+cb.g*p,ca.b*(1-p)+cb.b*p);
}
function familyAccentColor(who){
  return mixHex(personColor(who),'#334155',.32);
}
function familyTintColor(who,a=.10){
  return hexToRgba(personColor(who),a);
}
function targetChipStyle(who,on=false){
  if(on)return `background:var(--blue-bg)!important;border-color:var(--blue)!important;color:var(--blue-t)!important`;
  return `background:var(--card)!important;border-color:var(--border)!important;color:var(--t2)!important`;
}
function targetPersonChipStyle(who){
  const c=familyAccentColor(who);
  return `background:${familyTintColor(who,.10)};color:${c};border:1px solid ${familyTintColor(who,.16)}`;
}
function onclickArg(v){
  return escapeAttr(JSON.stringify(String(v??'')));
}

function repeatName(r){return r==='daily'?'매일':r==='weekly'?'매주':r==='monthly'?'매월':'반복 없음'}

const STXT={D:'주간',E:'저녁',N:'야간',OFF:'휴무'};

const KR_HOLIDAYS={
  '2026-01-01':'신정',
  '2026-02-16':'설날 연휴',
  '2026-02-17':'설날',
  '2026-02-18':'설날 연휴',
  '2026-03-01':'삼일절',
  '2026-03-02':'삼일절 대체공휴일',
  '2026-05-05':'어린이날',
  '2026-05-24':'부처님오신날',
  '2026-05-25':'부처님오신날 대체공휴일',
  '2026-06-03':'전국동시지방선거일',
  '2026-06-06':'현충일',
  '2026-08-15':'광복절',
  '2026-08-17':'광복절 대체공휴일',
  '2026-09-24':'추석 연휴',
  '2026-09-25':'추석',
  '2026-09-26':'추석 연휴',
  '2026-10-03':'개천절',
  '2026-10-05':'개천절 대체공휴일',
  '2026-10-09':'한글날',
  '2026-12-25':'크리스마스',
  '2027-01-01':'신정',
  '2027-02-06':'설날 연휴',
  '2027-02-07':'설날',
  '2027-02-08':'설날 연휴',
  '2027-02-09':'설날 대체공휴일',
  '2027-03-01':'삼일절',
  '2027-05-05':'어린이날',
  '2027-05-13':'부처님오신날',
  '2027-06-06':'현충일',
  '2027-08-15':'광복절',
  '2027-08-16':'광복절 대체공휴일',
  '2027-09-14':'추석 연휴',
  '2027-09-15':'추석',
  '2027-09-16':'추석 연휴',
  '2027-10-03':'개천절',
  '2027-10-04':'개천절 대체공휴일',
  '2027-10-09':'한글날',
  '2027-10-11':'한글날 대체공휴일',
  '2027-12-25':'크리스마스',
  '2027-12-27':'크리스마스 대체공휴일'
};

const KR_ANNUAL_HOLIDAYS={
  '05-01':'노동절',
  '07-17':'제헌절'
};
function annualHolidayName(k){
  const md=k.slice(5);
  if(KR_ANNUAL_HOLIDAYS[md])return KR_ANNUAL_HOLIDAYS[md];

  const [yy]=k.split('-').map(Number);
  for(const mdKey of Object.keys(KR_ANNUAL_HOLIDAYS)){
    const [mm,dd]=mdKey.split('-').map(Number);
    const base=new Date(yy,mm-1,dd);
    const day=base.getDay();
    let sub=null;
    if(day===6)sub=new Date(yy,mm-1,dd+2);
    else if(day===0)sub=new Date(yy,mm-1,dd+1);
    if(sub && dk(sub.getFullYear(),sub.getMonth(),sub.getDate())===k){
      return KR_ANNUAL_HOLIDAYS[mdKey]+' 대체공휴일';
    }
  }
  return '';
}

function holidayName(k){const c=(customHolidays||[]).find(x=>x.date===k);return (c&&c.name)||holidayCache[k]||KR_HOLIDAYS[k]||annualHolidayName(k)||''}
function isHolidayKey(k){return !!holidayName(k)}


let notes=[],family=[],requests=[],memories=[],notices=[],deletedItems=[],customHolidays=[],holidayCache={},repeatItems=[],shiftData={},hiddenBasePersons=[],changeLogs=[],shiftUsers=[],shiftLabels=[...DEFAULT_SHIFT_LABELS],shiftDefaults={},notificationEnabled=false;
let roomId = getRoomId();
let unsubscribe=null;
let remoteReady=false;
let savingRemote=false;
let hydrated=false;

function deepCopy(o){return JSON.parse(JSON.stringify(o,(k,v)=>v===undefined?null:v))}
function dk(y,m,d){return`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function fmtD(s){if(!s)return'';const p=s.split('-');return`${+p[1]}/${+p[2]}`}
function dateTimeRange(n){
  const start=n.start||'';
  const end=n.end||'';
  const sT=n.sT||'';
  const eT=n.eT||'';
  const baseDate=start||end;

  if(!sT && !eT){
    if(!start)return '';
    if(!end || end===start)return fmtD(start);
    return `${fmtD(start)} ~ ${fmtD(end)}`;
  }
  if(!sT && eT){
    return [fmtD(baseDate),eT].filter(Boolean).join(' ');
  }
  if(sT && !eT){
    return `${[fmtD(start),sT].filter(Boolean).join(' ')} ~`;
  }
  if(sT && eT){
    if(!end || end===start)return `${fmtD(start)} ${sT} ~ ${eT}`;
    return `${fmtD(start)} ${sT} ~ ${fmtD(end)} ${eT}`;
  }
  return '';
}
function daysFmt(arr){if(!arr||!arr.length)return'매일';return arr.map(i=>DAYS[i]).join('·')}
function typeName(t){return t==='work'?'회사':t==='family'?'가족':'개인'}
function typeChip(t){return t==='work'?'chip-w':t==='family'?'chip-f':'chip-p'}
function dotCls(t){return t==='work'?'dw':t==='family'?'df':'dp'}
function getShiftCount(y,m,users=null){
  const counts={};
  shiftLabelList().forEach(s=>counts[s]=0);
  const userSet=Array.isArray(users)&&users.length?new Set(users):null;
  const days=new Date(y,m+1,0).getDate();
  for(let d=1;d<=days;d++){
    const key=dk(y,m,d);
    shiftStatusesForDate(key).filter(x=>!userSet || userSet.has(x.user)).forEach(x=>{
      if(x.status){
        if(!(x.status in counts))counts[x.status]=0;
        counts[x.status]++;
      }
    });
  }
  return counts;
}
function isDone(x){return x.done===true || x.done==='true' || x.done===1 || x.done==='1'}
function birthDateInYear(birth,year){
  if(!birth)return '';
  const [,mm,dd]=birth.split('-').map(Number);
  const last=new Date(year,mm,0).getDate();
  const d=Math.min(dd,last);
  return `${year}-${String(mm).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function memoryIcon(x){
  return (x&&x.icon)||'🎂';
}
function selectMemoryIcon(icon){
  const el=document.getElementById('mem-icon');
  if(el)el.value=icon;
  document.querySelectorAll('.memory-icon-btn').forEach(b=>{
    b.classList.toggle('on',b.dataset.icon===icon);
  });
}
function selectMemoryCal(v){
  const el=document.getElementById('mem-cal');
  if(el)el.value=v;
  const solar=document.getElementById('mem-solar') || document.getElementById('mem-cal-solar');
  const lunar=document.getElementById('mem-lunar') || document.getElementById('mem-cal-lunar');
  if(solar)solar.className='type-btn'+(v==='solar'?' tf':'');
  if(lunar)lunar.className='type-btn'+(v==='lunar'?' tf':'');
}

function memoryDisplayMode(x){
  return (x&&x.displayMode)||((x&&x.linkedPerson)?'linked':((x&&x.subjectName)||(x&&x.subjectAvatar)?'direct':'icon'));
}
function memoryPerson(x){
  const mode=memoryDisplayMode(x);
  if(mode==='linked' && x && x.linkedPerson)return x.linkedPerson;
  if(mode==='direct' && x && x.subjectName)return x.subjectName;
  const direct=(x&&((x.linkedPerson||x.who||x.todayWho||x.person||'')+'').trim())||'';
  if(direct)return direct;
  const name=String((x&&x.name)||'');
  const found=getPersons().find(p=>p!=='공통' && name.includes(p));
  return found||'공통';
}
function memoryDisplaySubject(x){
  const mode=memoryDisplayMode(x);
  if(mode==='linked')return (x&&x.linkedPerson)||memoryPerson(x)||'가족';
  if(mode==='direct')return (x&&x.subjectName)||'직접 입력';
  return memoryPerson(x)||'축하';
}
function memoryDisplayAvatarHtml(x, cls='avatar-img'){
  const mode=memoryDisplayMode(x);
  if(mode==='linked'){
    const p=(x&&x.linkedPerson)||memoryPerson(x);
    return avatarMarkup(personAvatar(p),p,cls);
  }
  if(mode==='direct'){
    const av=(x&&x.subjectAvatar)||'seniorF_1';
    const label=(x&&x.subjectName)||x?.name||'축하 인물';
    return avatarMarkup(av,label,cls);
  }
  return escapeHtml(memoryIcon(x));
}
function selectMemoryDisplayMode(mode){
  const el=document.getElementById('mem-display-mode');
  if(el)el.value=mode;
  document.querySelectorAll('.memory-display-mode-btn').forEach(b=>b.classList.toggle('tf',b.dataset.mode===mode));
  const icon=document.getElementById('mem-icon-panel');
  const linked=document.getElementById('mem-linked-panel');
  const direct=document.getElementById('mem-direct-panel');
  if(icon)icon.style.display=mode==='icon'?'block':'none';
  if(linked)linked.style.display=mode==='linked'?'block':'none';
  if(direct)direct.style.display=mode==='direct'?'block':'none';
}
function selectMemoryLinkedPerson(person){
  const el=document.getElementById('mem-linked-person');
  if(el)el.value=person;
  document.querySelectorAll('.mem-linked-person-btn').forEach(b=>b.classList.toggle('selected',b.dataset.person===person));
}
function selectMemorySubjectAvatar(icon){
  const el=document.getElementById('mem-subject-avatar');
  if(el)el.value=icon;
  document.querySelectorAll('.mem-subject-avatar-btn').forEach(b=>b.classList.toggle('on',b.dataset.avatar===icon));
}
function selectMemorySubjectColor(color){
  const el=document.getElementById('mem-subject-color');
  if(el)el.value=color;
  document.querySelectorAll('.mem-subject-color-choice').forEach(b=>b.classList.toggle('on',b.dataset.color===color));
}
function uniquePersonsForDay(evs,mems){
  const people=[];
  const add=p=>{
    p=p||'공통';
    if(!people.includes(p))people.push(p);
  };
  // 달력 점 색상은 사람만 의미합니다.
  // 축하/생일은 별도 🎂 아이콘으로 표시하므로 대상자 점과 중복하지 않습니다.
  (evs||[]).forEach(n=>add(n.who||'공통'));
  return people;
}
function memoriesOnDate(y,m,d){
  const key=dk(y,m,d);
  return memories.filter(x=>{
    if(!x.birth)return false;
    const [,mm,dd]=x.birth.split('-').map(Number);
    if(memoryCalendarType(x)==='lunar'){
      return [y-1,y,y+1].some(ly=>lunarToSolarDate(ly,mm,dd)===key);
    }
    return birthDateInYear(x.birth,y)===key;
  });
}
function ageNow(birth){
  if(!birth)return '';
  const [by]=birth.split('-').map(Number);
  const thisBirth=birthDateInYear(birth,TY);
  let age=TY-by;
  if(dk(TY,TM,TD)<thisBirth)age--;
  return Math.max(0,age);
}
function nextBirthInfo(birth,isLunar=false){
  if(!birth)return {date:'',dday:''};
  const today=dk(TY,TM,TD);
  let targetSolarDate='';

  if(isLunar){
    const [,bm,bd]=birth.split('-').map(Number);
    targetSolarDate=lunarToSolarDate(TY,bm,bd);
    if(targetSolarDate<today){
      targetSolarDate=lunarToSolarDate(TY+1,bm,bd);
    }
  }else{
    targetSolarDate=birthDateInYear(birth,TY);
    if(targetSolarDate<today){
      targetSolarDate=birthDateInYear(birth,TY+1);
    }
  }

  const diff=Math.ceil((new Date(targetSolarDate+'T00:00:00')-new Date(today+'T00:00:00'))/86400000);
  return {date:targetSolarDate,dday:diff===0?'D-Day':`D-${diff}`};
}

function makeId(){
  return Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
}
function getRoomId(){
  const url=new URL(location.href);
  let r=url.searchParams.get('room') || DEFAULT_ROOM_ID;

  // 홈화면 바로가기/manifest 때문에 room이 빠져도 항상 기존 가족 방으로 복구
  if(!url.searchParams.get('room')){
    url.searchParams.set('room', r);
    history.replaceState(null, '', url.toString());
  }

  try{localStorage.setItem(SK.room, r);}catch(e){}
  return r;
}





function todayKey(){return dk(TY,TM,TD)}
function tomorrowKey(){return addDaysStr(todayKey(),1)}

function addDaysStr(dateStr,days){
  if(!dateStr||typeof dateStr!=='string')return todayKey();
  const [y,m,d]=dateStr.split('-').map(Number);
  if(isNaN(y)||isNaN(m)||isNaN(d))return todayKey();
  const nd=new Date(y,m-1,d+days);
  return dk(nd.getFullYear(),nd.getMonth(),nd.getDate());
}
function homeRangeKeys(){
  const base=scheduleBaseKey?scheduleBaseKey():todayKey();
  const len=homeViewRange==='week'?7:1;
  return Array.from({length:len},(_,i)=>addDaysStr(base,i));
}
function setHomeViewRange(range){
  homeViewRange=range==='week'?'week':'today';
  render({preserveScroll:true});
}
function addMonthsStr(dateStr,months){
  const [y,m,d]=dateStr.split('-').map(Number);
  const nd=new Date(y,m-1+months,1);
  const last=new Date(nd.getFullYear(),nd.getMonth()+1,0).getDate();
  nd.setDate(Math.min(d,last));
  return dk(nd.getFullYear(),nd.getMonth(),nd.getDate());
}
function occursOn(n,key){
  if(!n.start) return false;
  if(n.repeat && holidayName(key)) return false;
  if(n.repeatEnd && key>n.repeatEnd) return false;
  if(Array.isArray(n.skipDates) && n.skipDates.includes(key)) return false;

  if(!n.repeat){
    // 종료일이 비어 있거나 시작일과 같으면 시간 유무와 관계없이 시작일 하루만 표시
    if(!n.end || n.end===n.start) return n.start===key;
    // 종료일이 실제로 다른 날짜일 때만 여러 날짜에 표시
    return n.start<=key && key<=n.end;
  }

  if(key<n.start) return false;
  const start=new Date(n.start+'T00:00:00');
  const cur=new Date(key+'T00:00:00');
  const diff=Math.round((cur-start)/86400000);
  if(n.repeat==='daily') return diff>=0;
  if(n.repeat==='weekly') return diff>=0 && diff%7===0;
  if(n.repeat==='monthly') return n.start.slice(8,10)===key.slice(8,10);
  return false;
}
function nextOccurrence(n,fromKey=dk(TY,TM,TD)){
  if(!n.repeat) return n.start||'';
  for(let i=0;i<370;i++){
    const k=addDaysStr(fromKey,i);
    if(occursOn(n,k)) return k;
  }
  return n.start||'';
}
function notesOnDateAll(y,m,d){
  const k=dk(y,m,d);
  const normal=notes.filter(n=>!isDone(n)&&occursOn(n,k)).map(n=>{
    if(n.repeat) return {...n,start:k,end:k,_repeatInstance:true};
    return n;
  });
  return [...normal,...familyInfoEventsOnDate(y,m,d)];
}


function parseTimeFromText(v){
  const s=String(v||'');
  let m=s.match(/([01]?\d|2[0-3])[:시]\s*([0-5]\d)?/);
  if(!m)return '';
  const h=String(Number(m[1])).padStart(2,'0');
  const mm=String(m[2]!==undefined?Number(m[2]):0).padStart(2,'0');
  return `${h}:${mm}`;
}
function familyInfoEventsOnDate(y,m,d){
  const dow=new Date(y,m,d).getDay();
  const date=dk(y,m,d);
  const out=[];
  if(holidayName(date))return out;
  (repeatItems||[]).forEach(r=>{
    const title=String(r.title||'').trim();
    const days=Array.isArray(r.days)?r.days:[];
    if(!title || !days.includes(dow))return;
    if(r.start && date<r.start)return;
    if(r.repeatEnd && date>r.repeatEnd)return;
    if(Array.isArray(r.skipDates) && r.skipDates.includes(date))return;

    if(r.pauseOnVacation && isPersonVacation(r.who||'공통',date))return;

    out.push({
      id:`auto-${r.id}-${date}`,
      _originalRoutineId:r.id,
      title:title,
      type:'family',
      who:r.who||'공통',
      start:date,
      end:date,
      sT:r.sT||parseTimeFromText(title),
      eT:r.eT||'',
      repeat:'weekly',
      done:false,
      comment:'',
      alertMemo:'',
      _autoFamilyInfo:true,
      _raw:title
    });
  });
  return out;
}
function familyInfoUpcomingEvents(days=30){
  const arr=[];
  for(let i=0;i<days;i++){
    const k=addDaysStr(todayKey(),i);
    const [y,m,d]=k.split('-').map(Number);
    arr.push(...familyInfoEventsOnDate(y,m-1,d));
  }
  return arr;
}
function autoInfoMatchesFilter(n){
  if(subF==='all')return true;
  return (n.who||'공통')===subF;
}
















function shiftLabelList(){
  const arr=Array.isArray(shiftLabels)?shiftLabels:DEFAULT_SHIFT_LABELS;
  const clean=arr.map(x=>String(x||'').trim()).filter(Boolean);
  return clean.length?clean:DEFAULT_SHIFT_LABELS;
}

function normalizeShiftDefaults(){
  const people=getPersons().filter(p=>p&&p!=='공통');
  if(!shiftDefaults || typeof shiftDefaults!=='object')shiftDefaults={};
  Object.keys(shiftDefaults).forEach(k=>{
    if(!people.includes(k))delete shiftDefaults[k];
  });
  people.forEach(p=>{
    const cur=shiftDefaults[p]&&typeof shiftDefaults[p]==='object'?shiftDefaults[p]:{};
    shiftDefaults[p]={
      mode:cur.mode||'none',
      weekday:cur.weekday||'',
      weekend:cur.weekend||'',
      hideDefault:('hideDefault' in cur)?!!cur.hideDefault:true,
      labels:Array.isArray(cur.labels)?cur.labels.slice(0,6):[]
    };
  });
}
function shiftDefaultConfig(user){
  normalizeShiftDefaults();
  const u=String(user||'').trim();
  if(!shiftDefaults[u])shiftDefaults[u]={mode:'none',weekday:'',weekend:'',hideDefault:true,labels:[]};
  return shiftDefaults[u];
}
function shiftPersonLabelList(user){
  const cfg=shiftDefaultConfig(user);
  const custom=(cfg.labels||[]).map(x=>String(x||'').trim()).filter(Boolean);
  return custom.length?custom:shiftLabelList();
}
function shiftExplicitStatusFor(dateKey,user){
  const row=shiftData?.[dateKey];
  if(typeof row==='string'){
    return user===firstShiftUser()?row:'';
  }
  return isShiftObject(row)?(row[user]||''):'';
}
function shiftDefaultStatusFor(dateKey,user){
  const cfg=shiftDefaultConfig(user);
  if(cfg.mode!=='weekday')return '';
  const [y,m,d]=String(dateKey||'').split('-').map(Number);
  if(!y||!m||!d)return '';
  const dow=new Date(y,m-1,d).getDay();
  const isWeekend=dow===0||dow===6||!!holidayName(dateKey);
  return isWeekend?(cfg.weekend||''):(cfg.weekday||'');
}
function isShiftDefaultOnly(dateKey,user,status){
  const explicit=shiftExplicitStatusFor(dateKey,user);
  if(explicit)return false;
  const def=shiftDefaultStatusFor(dateKey,user);
  return !!status && status===def;
}
function shiftDisplayStatusFor(dateKey,user){
  const status=shiftStatusFor(dateKey,user);
  const cfg=shiftDefaultConfig(user);
  if(cfg.hideDefault && isShiftDefaultOnly(dateKey,user,status))return '';
  return status;
}
function setShiftDefaultValue(user,key,val){
  if(!requireEditMode())return;
  const cfg=shiftDefaultConfig(user);
  if(key==='mode')cfg.mode=val||'none';
  else if(key==='weekday')cfg.weekday=val||'';
  else if(key==='weekend')cfg.weekend=val||'';
  else if(key==='hideDefault')cfg.hideDefault=String(val)==='1';
  saveSettingsOnly();
  openManageCenter();
  render({preserveScroll:true});
}
function updateShiftPersonLabel(user,idx,val){
  if(!requireEditMode())return;
  const cfg=shiftDefaultConfig(user);
  if(!Array.isArray(cfg.labels))cfg.labels=[];
  cfg.labels[idx]=String(val||'').trim();
  saveSettingsOnly();
}
function renderShiftDefaultSettings(){
  normalizeShiftUsers();
  normalizeShiftDefaults();
  return `<div class="shift-default-settings">${shiftUsers.map(user=>{
    const cfg=shiftDefaultConfig(user);
    const labels=shiftPersonLabelList(user);
    const opts=['',...labels];
    return `<div class="shift-default-card">
      <div class="shift-default-head">
        <span class="shift-default-avatar">${avatarMarkup(personAvatar(user),user,'avatar-img-small')}</span>
        <b>${escapeHtml(user)}</b>
      </div>
      <div class="shift-default-grid">
        <label><span>기본값</span><select onchange="setShiftDefaultValue(${onclickArg(user)},'mode',this.value)">
          <option value="none" ${cfg.mode==='none'?'selected':''}>사용 안 함</option>
          <option value="weekday" ${cfg.mode==='weekday'?'selected':''}>월~금/주말 자동</option>
        </select></label>
        <label><span>월~금</span><select onchange="setShiftDefaultValue(${onclickArg(user)},'weekday',this.value)">
          ${opts.map(v=>`<option value="${escapeAttr(v)}" ${cfg.weekday===v?'selected':''}>${v?escapeHtml(v):'미입력'}</option>`).join('')}
        </select></label>
        <label><span>주말·공휴일</span><select onchange="setShiftDefaultValue(${onclickArg(user)},'weekend',this.value)">
          ${opts.map(v=>`<option value="${escapeAttr(v)}" ${cfg.weekend===v?'selected':''}>${v?escapeHtml(v):'미입력'}</option>`).join('')}
        </select></label>
        <button class="shift-default-hide${cfg.hideDefault?' on':''}" onclick="setShiftDefaultValue(${onclickArg(user)},'hideDefault','${cfg.hideDefault?'0':'1'}')">${cfg.hideDefault?'기본 숨김':'기본 표시'}</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}
function renderShiftPersonLabelSettings(){
  normalizeShiftUsers();
  normalizeShiftDefaults();
  return `<div class="shift-person-label-settings">${shiftUsers.map(user=>{
    const cfg=shiftDefaultConfig(user);
    const labels=Array.from({length:6},(_,i)=>(cfg.labels&&cfg.labels[i])||'');
    return `<div class="shift-person-label-card">
      <div class="shift-default-head">
        <span class="shift-default-avatar">${avatarMarkup(personAvatar(user),user,'avatar-img-small')}</span>
        <b>${escapeHtml(user)}</b>
      </div>
      <div class="shift-label-grid person-label-grid">
        ${labels.map((lbl,idx)=>`<input class="shift-label-input" value="${escapeAttr(lbl)}" onchange="updateShiftPersonLabel(${onclickArg(user)},${idx},this.value)" placeholder="${escapeAttr((shiftLabels&&shiftLabels[idx])||DEFAULT_SHIFT_LABELS[idx]||`라벨 ${idx+1}`)}"/>`).join('')}
      </div>
      <div class="shift-label-help">빈칸이면 공통 라벨을 사용해요.</div>
    </div>`;
  }).join('')}</div>`;
}
function syncOffInfo(dateKey){
  const rows=shiftStatusesForDate(dateKey,{includeHidden:true}).filter(x=>x.effective && (isFullRestShiftStatus(x.effective)||isPartialRestShiftStatus(x.effective)));
  const full=rows.filter(x=>isFullRestShiftStatus(x.effective));
  const partial=rows.filter(x=>isPartialRestShiftStatus(x.effective));
  if(full.length>=2)return {type:'full',rows:full};
  if(full.length>=1 && partial.length>=1)return {type:'partial',rows:[...full,...partial]};
  if(partial.length>=2)return {type:'partial',rows:partial};
  return {type:'',rows:[]};
}


function shiftLabelColorIndex(status){
  const s=String(status||'').trim();
  if(!s)return 0;
  const known=['D','E','N','OFF','연차','반차','휴무','주간','야근','재택','출장'];
  const idx=known.indexOf(s);
  if(idx>=0)return idx%6;
  let h=0;
  for(const ch of s)h=(h*31+ch.charCodeAt(0))%997;
  return h%6;
}
function isShiftNoneValue(v){
  return String(v||'')===SHIFT_NONE;
}
function shiftSwipeHintInfo(){
  let count=0;
  try{count=Number(localStorage.getItem('pass_shift_swipe_hint_count')||'0')}catch(e){count=0}
  const show=count<3;
  if(show){
    try{localStorage.setItem('pass_shift_swipe_hint_count',String(count+1))}catch(e){}
  }
  return show;
}
function isFullRestShiftStatus(status){
  const s=String(status||'').trim().toUpperCase();
  if(!s)return false;
  return s==='OFF' || s==='O' || s.includes('휴') || s.includes('연차');
}
function isPartialRestShiftStatus(status){
  const s=String(status||'').trim();
  if(!s)return false;
  return s.includes('반차') || s.includes('조퇴') || s.includes('재택');
}
function syncOffInfo(dateKey){
  const rows=shiftStatusesForDate(dateKey,{includeHidden:true}).filter(x=>x.effective && (isFullRestShiftStatus(x.effective)||isPartialRestShiftStatus(x.effective)));
  const full=rows.filter(x=>isFullRestShiftStatus(x.effective));
  const partial=rows.filter(x=>isPartialRestShiftStatus(x.effective));
  if(full.length>=2)return {type:'full',rows:full};
  if(full.length>=1 && partial.length>=1)return {type:'partial',rows:[...full,...partial]};
  if(partial.length>=2)return {type:'partial',rows:partial};
  return {type:'',rows:[]};
}
function syncOffBannerLabel(info){
  if(!info || !info.rows || !info.rows.length)return '';
  return info.type==='full'?'함께 쉬는 날이에요':'시간이 맞는 날이에요';
}
function hasFinalConsonantKo(text){
  const chars=Array.from(String(text||'').trim());
  if(!chars.length)return false;
  const code=chars[chars.length-1].charCodeAt(0);
  if(code<0xAC00 || code>0xD7A3)return false;
  return ((code-0xAC00)%28)!==0;
}
function koParticle(text,pair='이/가'){
  const [withBatchim,withoutBatchim]=String(pair||'이/가').split('/');
  return hasFinalConsonantKo(text)?withBatchim:withoutBatchim;
}
function collapsedStateLabel({list=[],count=0,sectionName='일정',sectionType='active',singleNoun='일정',state='숨김'}={}){
  const safeCount=Number(count)||0;
  const verb=state==='fold'?'접혀 있어요':'숨겨져 있어요';
  if(safeCount<=0){
    return sectionType==='past'?'지난 일정이 없어요.':'오늘은 조금 가볍게 보내도 좋아요.';
  }
  const first=(list||[]).find(x=>x&&String(x.title||'').trim());
  if(safeCount===1 && first){
    const title=String(first.title||singleNoun).trim();
    return `${title} ${singleNoun}${koParticle(singleNoun,'이/가')} ${verb}`;
  }
  return `${sectionName} ${safeCount}개가 ${verb}`;
}
function scheduleCollapsedSummary(list, count, type='active'){
  return collapsedStateLabel({
    list,
    count,
    sectionName:type==='done'?'지난 일정':'등록 일정',
    sectionType:type==='done'?'past':'active',
    singleNoun:'일정',
    state:'hidden'
  });
}

function normalizeShiftUsers(){
  const people=getPersons().filter(p=>p&&p!=='공통');
  if(!Array.isArray(shiftUsers))shiftUsers=[];
  shiftUsers=shiftUsers.filter(u=>people.includes(u));
  if(shiftUsers.length>1){
    const configured=shiftUsers.find(u=>String(u||'').includes('엄마'))||shiftUsers[0];
    shiftUsers=configured?[configured]:[];
  }
  if(!shiftUsers.length){
    const preferred=people.find(p=>String(p||'').includes('엄마'));
    shiftUsers=preferred?[preferred]:people.slice(0,1);
  }
  normalizeShiftDefaults();
}
function firstShiftUser(){
  normalizeShiftUsers();
  return shiftUsers[0] || getPersons().find(p=>p!=='공통') || getPersons()[0] || '공통';
}
function calendarWorkUser(){
  normalizeShiftUsers();
  return firstShiftUser();
}
function isShiftObject(v){
  return v && typeof v==='object' && !Array.isArray(v);
}
function migrateShiftDataToMulti(){
  normalizeShiftUsers();
  const fallback=firstShiftUser();
  const out={};
  Object.keys(shiftData||{}).forEach(k=>{
    const val=shiftData[k];
    if(typeof val==='string'){
      if(val)out[k]={[fallback]:val};
    }else if(isShiftObject(val)){
      const row={};
      Object.keys(val).forEach(user=>{
        const s=String(val[user]||'').trim();
        if(s)row[user]=s;
      });
      if(Object.keys(row).length)out[k]=row;
    }
  });
  shiftData=out;
}
function shiftStatusFor(dateKey,user){
  const explicit=shiftExplicitStatusFor(dateKey,user);
  if(isShiftNoneValue(explicit))return '';
  if(explicit)return explicit;
  return shiftDefaultStatusFor(dateKey,user);
}
function shiftStatusesForDate(dateKey,opts={}){
  normalizeShiftUsers();
  return shiftUsers.map(user=>{
    const effective=shiftStatusFor(dateKey,user);
    const status=opts.includeHidden?effective:shiftDisplayStatusFor(dateKey,user);
    return {user,status,effective,explicit:shiftExplicitStatusFor(dateKey,user),defaultOnly:isShiftDefaultOnly(dateKey,user,effective)};
  });
}
function shiftHasAny(dateKey){
  return shiftStatusesForDate(dateKey).some(x=>x.status);
}
function shiftBadgeClass(status){
  const s=String(status||'').trim();
  if(SCLS[s])return SCLS[s];
  return `s-custom s-custom-${shiftLabelColorIndex(s)}`;
}
function shiftStatusText(status){
  return STXT[status]||status||'미입력';
}
function shiftStatusForBrief(status){
  if(!status)return '';
  if(status==='OFF')return '휴무';
  return shiftStatusText(status);
}
function setShiftStatus(dateKey,user,status,refreshPicker=false){
  if(!requireEditMode())return;
  if(!dateKey||!user)return;
  if(!shiftData[dateKey]||typeof shiftData[dateKey]==='string')shiftData[dateKey]={};
  if(status===SHIFT_DEFAULT){
    delete shiftData[dateKey][user];
  }else if(status===SHIFT_NONE){
    shiftData[dateKey][user]=SHIFT_NONE;
  }else if(status){
    shiftData[dateKey][user]=status;
  }else{
    delete shiftData[dateKey][user];
  }
  if(!Object.keys(shiftData[dateKey]).length)delete shiftData[dateKey];
  saveShiftOnly(dateKey,status||'');
  render({preserveScroll:true});
  if(refreshPicker)openShiftPicker(dateKey);
}
function toggleShiftUser(name){
  if(!requireEditMode())return;
  const n=String(name||'').trim();
  if(!n)return;
  normalizeShiftUsers();
  shiftUsers=[n];
  normalizeShiftUsers();
  saveSettingsOnly();
  openManageCenter();
  render({preserveScroll:true});
}
function updateShiftLabel(index,val){
  if(!requireEditMode())return;
  if(!Array.isArray(shiftLabels))shiftLabels=[...DEFAULT_SHIFT_LABELS];
  shiftLabels[index]=String(val||'').trim();
  saveSettingsOnly();
}
function renderShiftUserSelector(){
  normalizeShiftUsers();
  const people=getPersons().filter(p=>p!=='공통');
  return `<div class="shift-user-select-wrap">${people.map(p=>`<button class="shift-user-choice${shiftUsers.includes(p)?' on':''}" onclick="toggleShiftUser(${onclickArg(p)})">${avatarMarkup(personAvatar(p),p,'avatar-img-small')}<span>${escapeHtml(p)}</span></button>`).join('')}</div>`;
}
function openShiftTargetSheet(){
  if(!requireEditMode())return;
  normalizeShiftUsers();
  const people=getPersons().filter(p=>p&&p!=='공통');
  const current=calendarWorkUser();
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet shift-target-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">근무 대상 선택</div>
      <div class="shift-target-list">
        ${people.map(p=>`<button type="button" class="shift-target-row${p===current?' on':''}" onclick="shiftUsers=[${onclickArg(p)}];normalizeShiftUsers();saveSettingsOnly();closeM();render({preserveScroll:true})">
          <span class="shift-target-avatar">${avatarFrameMarkup(personAvatarConfig(p),p,'avatarFrame shift-target-avatar-frame')}</span>
          <span>${escapeHtml(p)}</span>
          <b>${p===current?'선택됨':''}</b>
        </button>`).join('')}
      </div>
    </div>
  </div>`;
}
function renderShiftLabelInputs(){
  const labels=Array.from({length:6},(_,i)=>(shiftLabels&&shiftLabels[i])||DEFAULT_SHIFT_LABELS[i]||'');
  return `<div class="shift-label-grid">${labels.map((lbl,idx)=>`<input class="shift-label-input" value="${escapeAttr(lbl)}" onchange="updateShiftLabel(${idx},this.value)" placeholder="라벨 ${idx+1}"/>`).join('')}</div>`;
}

function firstStatusChar(status){
  const s=String(status||'').trim();
  if(!s)return '';
  return Array.from(s)[0] || '';
}
function isRestShiftStatus(status){
  const s=String(status||'').trim().toUpperCase();
  if(!s)return false;
  return s==='OFF' || s==='O' || s.includes('휴') || s.includes('연차') || s.includes('반차');
}
function isSyncOffDay(dateKey){
  return !!syncOffInfo(dateKey).type;
}

function renderCalendarShiftBadges(dateKey){
  const workUser=calendarWorkUser();
  const rows=shiftStatusesForDate(dateKey).filter(x=>x.status && (calViewMode!=='work' || x.user===workUser));
  if(!rows.length)return '<span style="display:inline-block;height:18px"></span>';
  const shown=rows.slice(0,2);
  return shown.map(x=>`<span class="shift-one ${shiftBadgeClass(x.status)}" title="${escapeAttr(x.user)}: ${escapeAttr(x.status)}">${escapeHtml(workCalendarShiftLabel(x.status))}</span>`).join('')+
    (rows.length>2?`<span class="shift-more">+${rows.length-2}</span>`:'');
}
function renderSelectedDayShiftChips(dateKey){
  normalizeShiftUsers();
  if(!shiftUsers.length)return '';
  const sync=syncOffInfo(dateKey);
  const syncHtml=sync.type?`<div class="sync-off-detail-banner ${sync.type==='partial'?'partial':''}">${sync.type==='full'?'🎉':'🌿'} ${escapeHtml(syncOffBannerLabel(sync))} · ${sync.rows.map(x=>`${escapeHtml(x.user)} ${escapeHtml(x.effective||x.status)}`).join(' · ')}</div>`:'';
  const chips=`<div class="selected-shift-chip-row">${shiftUsers.map(user=>{
    const status=shiftDisplayStatusFor(dateKey,user);
    return `<button class="sec-chip-btn selected-shift-chip ${status?shiftBadgeClass(status):'empty'}" onclick="openShiftPicker('${dateKey}')">${escapeHtml(user)}${status?`: ${escapeHtml(status)}`:' 상태'}</button>`;
  }).join('')}</div>`;
  return syncHtml+chips;
}

function normalizeData(d){
  const base=deepCopy(DEFAULT_DATA);
  d=d||base;
  const subMode=d.storageMode==='subcollections';
  notes=Array.isArray(d.notes)?d.notes:(subMode?notes:base.notes);
  notes=Array.isArray(notes)?notes:[];
  notes.forEach(n=>{
    if(!n.who)n.who='공통';
    if(!('repeat' in n))n.repeat='';
    if(!Array.isArray(n.skipDates))n.skipDates=[];
    if(!n.alertMemo)n.alertMemo='';
    if(!n.type)n.type='family';
    if(!n.end)n.end='';
    if(!('isPrivate' in n))n.isPrivate=false;
  });
  requests=Array.isArray(d.requests)?d.requests:(subMode?requests:(base.requests||[]));
  requests=Array.isArray(requests)?requests:[];
  requests.forEach(r=>{if(!r.requestDate)r.requestDate=''; if(!r.dueDate)r.dueDate=''; if(!r.dueTime)r.dueTime=''; if(!r.doneAt)r.doneAt=''; if(!r.comment)r.comment='';});
  memories=Array.isArray(d.memories)?d.memories:(base.memories||[]);
  memories.forEach(x=>{
    if(!('showToday' in x))x.showToday=false;
    if(!x.todayWho)x.todayWho=(x.name||'');
    if(!x.icon)x.icon='🎂';
    if(!x.calendarType)x.calendarType=(x.isLunar||x.lunar)?'lunar':'solar';
    x.isLunar=x.calendarType==='lunar'||x.isLunar===true;
    x.lunar=x.isLunar;
    const familyNames=[...BASE_PERSONS,...(Array.isArray(d.family)?d.family.map(p=>p.name).filter(Boolean):[])];
    const inferred=familyNames.find(p=>p&&p!=='공통'&&String(x.name||'').includes(p));
    if(!x.displayMode)x.displayMode=x.linkedPerson?'linked':(x.subjectName||x.subjectAvatar?'direct':(inferred?'linked':'icon'));
    if(x.displayMode==='linked'&&!x.linkedPerson&&inferred)x.linkedPerson=inferred;
    if(x.displayMode==='direct'){
      if(!x.subjectName)x.subjectName=x.todayWho||x.person||'';
      if(!x.subjectAvatar)x.subjectAvatar='seniorF_1';
      if(!x.subjectColor)x.subjectColor='#A2845E';
    }
  });
  notices=Array.isArray(d.notices)?d.notices:(base.notices||[]);
  deletedItems=Array.isArray(d.deletedItems)?d.deletedItems:(base.deletedItems||[]);
  changeLogs=Array.isArray(d.changeLogs)?d.changeLogs:[];
  customHolidays=Array.isArray(d.customHolidays)?d.customHolidays:(base.customHolidays||[]);
  holidayCache=(d.holidayCache&&typeof d.holidayCache==='object')?d.holidayCache:(base.holidayCache||{});
  family=Array.isArray(d.family)?d.family:base.family;
  hiddenBasePersons=Array.isArray(d.hiddenBasePersons)?d.hiddenBasePersons:[];
  shiftUsers=Array.isArray(d.shiftUsers)?d.shiftUsers:[];
  shiftLabels=Array.isArray(d.shiftLabels)?d.shiftLabels:[...DEFAULT_SHIFT_LABELS];
  shiftDefaults=(d.shiftDefaults&&typeof d.shiftDefaults==='object')?d.shiftDefaults:{};
  notificationEnabled=!!d.notificationEnabled;
  ensureBaseTargets();
  normalizeShiftUsers();

  repeatItems=Array.isArray(d.repeatItems)?d.repeatItems:[];
  if(!repeatItems.length){
    (family||[]).forEach(kid=>{
      (kid.cats||[]).forEach(cat=>{
        (cat.items||[]).forEach(item=>{
          const val=String(item.val||'').trim();
          if(!val)return;
          repeatItems.push({
            id:Date.now()+Math.random(),
            who:kid.name||'공통',
            title:val,
            days:Array.isArray(item.days)?item.days:[],
            start:item.start||'',
            sT:item.sT||'',
            eT:item.eT||'',
            repeatEnd:item.repeatEnd||'',
            pauseOnVacation:item.pauseOnVacation||false
          });
        });
      });
    });
  }
  repeatItems.forEach(r=>{
    if(!r.id)r.id=Date.now()+Math.random();
    if(!r.who)r.who='공통';
    if(!Array.isArray(r.days))r.days=[];
    if(!('start' in r))r.start='';
    if(!('sT' in r))r.sT='';
    if(!('eT' in r))r.eT='';
    if(!('repeatEnd' in r))r.repeatEnd='';
    if(!Array.isArray(r.skipDates))r.skipDates=[];
    if(!('pauseOnVacation' in r))r.pauseOnVacation=false;
  });

  notices.forEach(n=>{if(!('important' in n))n.important=false; if(!('read' in n))n.read=false;});
  customHolidays.forEach(h=>{if(!h.id)h.id=Date.now()+Math.random(); if(!h.name)h.name='공휴일';});
  purgeOldTrash(false);
  shiftData=d.shiftData&& !subMode ? d.shiftData : (subMode?shiftData:(d.shiftData||{}));
  shiftData=shiftData||{};
  migrateShiftDataToMulti();
}
function currentData(){
  return {notes,family,requests,memories,notices,deletedItems,customHolidays,holidayCache,repeatItems,shiftData,shiftUsers,shiftLabels,shiftDefaults,notificationEnabled,hiddenBasePersons,changeLogs,updatedAt:Date.now()};
}
function saveLocal(){try{localStorage.setItem(SK.data,JSON.stringify(currentData()))}catch(e){console.warn('saveLocal failed',e)}}
function loadLocal(){try{return JSON.parse(localStorage.getItem(SK.data)||'null')}catch(e){return null}}


function currentSettingsData(){
  return {
    family,memories,notices,deletedItems,customHolidays,holidayCache,repeatItems,hiddenBasePersons,changeLogs,
    shiftUsers,shiftLabels,shiftDefaults,notificationEnabled,
    storageMode:'subcollections',
    updatedAt:Date.now()
  };
}
function monthKeyOf(k){return String(k||'').slice(0,7)}
function monthShiftMap(monthKey){
  const out={};
  Object.keys(shiftData||{}).forEach(k=>{
    if(k.startsWith(monthKey+'-')){
      const v=shiftData[k];
      if(typeof v==='string')out[k]=v||'';
      else if(isShiftObject(v))out[k]={...v};
    }
  });
  return out;
}
function monthsInShiftData(){
  return [...new Set(Object.keys(shiftData||{}).map(monthKeyOf).filter(Boolean))];
}
async function getCollectionDocs(api, pathName){
  const col=api.collection(api.db,'familyCalendars',roomId,pathName);
  const snap=await api.getDocs(col);
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
async function saveCollectionExact(api, pathName, arr){
  if(!api.collection||!api.getDocs||!api.writeBatch||!api.deleteDoc)return;
  const col=api.collection(api.db,'familyCalendars',roomId,pathName);
  const snap=await api.getDocs(col);
  const existing=new Set(snap.docs.map(d=>d.id));
  const ids=new Set((arr||[]).map(x=>String(x.id)));
  const batch=api.writeBatch(api.db);
  (arr||[]).forEach(x=>{
    const id=String(x.id||Date.now()+Math.random());
    x.id=x.id||id;
    batch.set(api.doc(api.db,'familyCalendars',roomId,pathName,id), x);
  });
  snap.docs.forEach(d=>{
    if(!ids.has(d.id))batch.delete(api.doc(api.db,'familyCalendars',roomId,pathName,d.id));
  });
  await batch.commit();
}
async function saveShiftMonthsExact(api){
  if(!api.collection||!api.getDocs||!api.writeBatch)return;
  const col=api.collection(api.db,'familyCalendars',roomId,'shifts');
  const snap=await api.getDocs(col);
  const months=monthsInShiftData();
  const monthSet=new Set(months);
  const batch=api.writeBatch(api.db);
  months.forEach(m=>{
    batch.set(api.doc(api.db,'familyCalendars',roomId,'shifts',m), {id:m,days:monthShiftMap(m),updatedAt:Date.now()});
  });
  snap.docs.forEach(d=>{
    if(!monthSet.has(d.id))batch.delete(api.doc(api.db,'familyCalendars',roomId,'shifts',d.id));
  });
  await batch.commit();
}
async function loadSubcollectionData(api){
  if(!api.collection||!api.getDocs)return false;
  let any=false;
  try{
    const ns=await getCollectionDocs(api,'notes');
    const rs=await getCollectionDocs(api,'requests');
    const ss=await getCollectionDocs(api,'shifts');
    if(ns.length){notes=ns;any=true}
    if(rs.length){requests=rs;any=true}
    if(ss.length){
      const merged={};
      ss.forEach(s=>Object.assign(merged,s.days||{}));
      shiftData=merged;
      any=true;
    }
  }catch(e){console.warn('subcollection load failed',e)}
  return any;
}
async function saveRemoteSubcollections(api){
  await api.setDoc(api.doc(api.db,'familyCalendars',roomId), {...currentSettingsData(), updatedAt:api.serverTimestamp()}, {merge:false});
  await saveCollectionExact(api,'notes',notes);
  await saveCollectionExact(api,'requests',requests);
  await saveShiftMonthsExact(api);
}
function setupSubcollectionListeners(api){
  try{
    if(!api.collection||!api.onSnapshot)return;
    if(!window.__passUnsubs)window.__passUnsubs=[];
    window.__passUnsubs.forEach(u=>{try{u&&u()}catch(e){}});
    window.__passUnsubs=[
      api.onSnapshot(api.collection(api.db,'familyCalendars',roomId,'notes'),s=>{
        if(savingRemote)return;
        notes=s.docs.map(d=>({id:d.id,...d.data()}));
        saveLocal();render();
      }),
      api.onSnapshot(api.collection(api.db,'familyCalendars',roomId,'requests'),s=>{
        if(savingRemote)return;
        requests=s.docs.map(d=>({id:d.id,...d.data()}));
        saveLocal();render();
      }),
      api.onSnapshot(api.collection(api.db,'familyCalendars',roomId,'shifts'),s=>{
        if(savingRemote)return;
        const merged={};
        s.docs.forEach(d=>Object.assign(merged,(d.data()||{}).days||{}));
        shiftData=merged;
        saveLocal();render();
      })
    ];
  }catch(e){console.warn('subcollection listeners failed',e)}
}


function remoteActive(){return remoteReady && window.__firebaseAPI && hydrated}
function finishSaving(){savingRemote=false}
function saveSettingsOnly(){
  saveLocal();
  if(remoteActive()){
    savingRemote=true;
    const api=window.__firebaseAPI;
    api.setDoc(api.doc(api.db,'familyCalendars',roomId), {...currentSettingsData(),updatedAt:api.serverTimestamp()}, {merge:false})
      .catch(e=>{console.warn(e);updateSyncPill('설정 저장 실패: 로컬에만 저장됨');})
      .finally(finishSaving);
  }
}
function saveRemoteDoc(pathName,item){
  saveLocal();
  if(remoteActive() && item){
    savingRemote=true;
    const api=window.__firebaseAPI;
    const id=String(item.id||Date.now());
    item.id=item.id||id;
    api.setDoc(api.doc(api.db,'familyCalendars',roomId,pathName,id), {...item}, {merge:false})
      .catch(e=>{console.warn(e);updateSyncPill(`${pathName} 저장 실패: 로컬에만 저장됨`);})
      .finally(finishSaving);
  }
}
function deleteRemoteDoc(pathName,id){
  saveLocal();
  if(remoteActive() && id!==undefined && window.__firebaseAPI.deleteDoc){
    savingRemote=true;
    const api=window.__firebaseAPI;
    api.deleteDoc(api.doc(api.db,'familyCalendars',roomId,pathName,String(id)))
      .catch(e=>{console.warn(e);updateSyncPill(`${pathName} 삭제 실패: 로컬에만 저장됨`);})
      .finally(finishSaving);
  }
}

function minuteOf(t){
  if(!t)return null;
  const [h,m]=String(t).split(':').map(Number);
  if(Number.isNaN(h)||Number.isNaN(m))return null;
  return h*60+m;
}
function scheduleTimeRange(n){
  const s=minuteOf(n.sT);
  const e=minuteOf(n.eT);
  if(s===null && e===null)return {start:0,end:1440,allDay:true};
  if(s!==null && e===null)return {start:s,end:s+1,allDay:false};
  if(s===null && e!==null)return {start:0,end:e,allDay:false};
  return {start:s,end:Math.max(e,s+1),allDay:false};
}
function timeRangesOverlap(a,b){
  const A=scheduleTimeRange(a), B=scheduleTimeRange(b);
  if(A.allDay||B.allDay)return true;
  return A.start < B.end && B.start < A.end;
}
function scheduleWindow(n,fromKey=scheduleBaseKey ? scheduleBaseKey() : todayKey()){
  const start=n.start||fromKey;
  let end=n.end||n.start||fromKey;
  if(n.repeat){
    end=n.repeatEnd||(start?addDaysStr(start,60):end);
  }
  if(end<start)end=start;
  return {start,end};
}
function datesInWindow(n,limit=90){
  const w=scheduleWindow(n);
  const out=[];
  for(let k=w.start,i=0;k<=w.end && i<limit;k=addDaysStr(k,1),i++){
    if(occursOn(n,k))out.push(k);
  }
  return out;
}
function findScheduleConflicts(candidate,ignoreId=''){
  const candWho=candidate.who||'공통';
  const dates=datesInWindow(candidate,90);
  const conflicts=[];
  (notes||[]).forEach(n=>{
    if(String(n.id)===String(ignoreId))return;
    if(isDone(n))return;
    if((n.who||'공통')!==candWho)return;
    for(const k of dates){
      if(occursOn(n,k) && timeRangesOverlap(candidate,{...n,start:k,end:k})){
        conflicts.push({date:k,item:n});
        break;
      }
    }
  });
  return conflicts.slice(0,5);
}
function confirmScheduleConflicts(candidate,ignoreId=''){
  const conflicts=findScheduleConflicts(candidate,ignoreId);
  if(!conflicts.length)return true;
  const lines=conflicts.map(c=>{
    const n=c.item;
    const t=todayTimeOnly(n)||dateTimeRange(n)||'시간 미정';
    return `${dateLabel(c.date)} · ${t} · ${n.title||'일정'}`;
  }).join('\n');
  return confirm(`같은 대상의 일정이 겹칠 수 있어요.\n\n${lines}\n\n그래도 저장할까요?`);
}
function addChangeLog(text,kind='change'){
  if(!Array.isArray(changeLogs))changeLogs=[];
  changeLogs.unshift({id:Date.now()+Math.random(),kind,text:String(text||''),at:Date.now()});
  changeLogs=changeLogs.slice(0,80);
}
function openChangeLog(){
  const list=Array.isArray(changeLogs)?changeLogs:[];
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">최근 변경사항</div>
      ${list.length?list.map(x=>`<div class="change-log-row">
        <div class="change-log-title">${escapeHtml(x.text||'변경사항')}</div>
        <div class="change-log-time">${new Date(x.at||Date.now()).toLocaleString()}</div>
      </div>`).join(''):renderEmptyState('generic','최근 변경사항이 없어요','일정을 추가하거나 수정하면 여기에 기록돼요.')}
      ${list.length?`<button class="cancel-link" onclick="clearChangeLog()">기록 비우기</button>`:''}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function clearChangeLog(){
  if(!requireEditMode())return;
  if(!confirm('최근 변경 기록을 비울까요?'))return;
  changeLogs=[];
  saveSettingsOnly();
  openChangeLog();
}
function requestDueLabel(r){
  if(!r.dueDate&&!r.dueTime)return '';
  return `${r.dueDate?dateLabel(r.dueDate):'마감 없음'}${r.dueTime?` ${timeLabel(r.dueTime)}`:''}`;
}
function dueRequestsForDate(key){
  return (requests||[]).filter(r=>!isDone(r)&&r.dueDate===key);
}
function toggleCalendarRoutineLayer(){
  showRoutineInCalendar=!showRoutineInCalendar;
  render({preserveScroll:true});
  showToast(showRoutineInCalendar?'달력에 반복을 표시해요.':'달력에서 반복을 숨겼어요.');
}
function isRoutineCalendarEvent(n){
  return !!(n&&(n.repeat||n._autoFamilyInfo));
}

function saveNoteOnly(n){saveRemoteDoc('notes',n)}
function saveRequestOnly(r){saveRemoteDoc('requests',r)}
function saveAfterSoftDelete(kind,arr,idx,label){
  if(idx<0||!arr[idx])return;
  const item=arr[idx];
  const trashId=Date.now()+Math.random();
  deletedItems.push({id:trashId,kind,item:deepCopy(item),deletedAt:Date.now()});
  arr.splice(idx,1);
  saveLocal();
  if(kind==='note')deleteRemoteDoc('notes',item.id);
  else if(kind==='request')deleteRemoteDoc('requests',item.id);
  saveSettingsOnly();
  render({preserveScroll:true});
  showToast(`${label} 삭제했습니다.`, '실행 취소', ()=>undoTrashById(trashId,kind,idx), 5000);
}

function saveShiftOnly(k,t){
  saveLocal();
  if(remoteReady && window.__firebaseAPI && hydrated){
    savingRemote=true;
    const api=window.__firebaseAPI;
    const finish=()=>{savingRemote=false};
    try{
      const m=monthKeyOf(k);
      if(m){
        api.setDoc(api.doc(api.db,'familyCalendars',roomId,'shifts',m), {id:m,days:monthShiftMap(m),updatedAt:api.serverTimestamp()}, {merge:false})
          .catch(e=>{console.warn(e);updateSyncPill('상태표 저장 실패: 로컬에만 저장됨');})
          .finally(finish);
      }else{
        saveRemoteSubcollections(api).catch(e=>console.warn(e)).finally(finish);
      }
    }catch(e){
      console.warn(e);finish();
    }
  }
}
function saveAll(){
  saveLocal();
  if(remoteReady && window.__firebaseAPI && hydrated){
    savingRemote=true;
    const api=window.__firebaseAPI;
    saveRemoteSubcollections(api)
      .catch(e=>{console.warn(e);updateSyncPill('Firebase 저장 실패: 로컬에만 저장됨');})
      .finally(()=>{savingRemote=false;});
  }
}

async function initData(){
  try{
    normalizeData(loadLocal()||DEFAULT_DATA);
    hydrated=true;
    render();

    await Promise.race([
      waitFirebase(),
      new Promise(resolve=>setTimeout(resolve,800))
    ]);

    if(window.__firebaseReady && window.__firebaseAPI){
      remoteReady=true;
      updateSyncPill('실시간 공유 연결 중...');
      const api=window.__firebaseAPI;
      const ref=api.doc(api.db,'familyCalendars',roomId);

      let snap=null;
      try{
        snap=await Promise.race([
          api.getDoc(ref),
          new Promise((_,reject)=>setTimeout(()=>reject(new Error('Firebase 읽기 시간 초과')),3000))
        ]);
      }catch(e){
        console.warn(e);
        updateSyncPill('Firebase 응답 지연 · 로컬 데이터로 먼저 실행 중');
        return;
      }

      if(!snap.exists()){
        await saveRemoteSubcollections(api);
      }else{
        const root=snap.data();
        normalizeData(root);
        const hadSub=await loadSubcollectionData(api);

        // 기존 단일문서 구조를 감지하면 하위 컬렉션으로 1회 마이그레이션하고 루트 문서를 가볍게 정리
        if(!hadSub && (Array.isArray(root.notes)||Array.isArray(root.requests)||root.shiftData)){
          await saveRemoteSubcollections(api);
          updateSyncPill('데이터 구조 최적화 완료');
        }

        saveLocal();
        render();
      }

      if(typeof unsubscribe==='function'){try{unsubscribe();}catch(e){}}
      unsubscribe=api.onSnapshot(ref,(s)=>{
        if(!s.exists()||savingRemote)return;
        const root=s.data();
        const keep={notes,requests,shiftData};
        normalizeData(root);
        // 루트 설정 변경만 반영하고 대용량 컬렉션은 별도 리스너가 담당
        if(root.storageMode==='subcollections'){
          notes=keep.notes;requests=keep.requests;shiftData=keep.shiftData;
        }
        saveLocal();
        render();
        updateSyncPill('실시간 공유 연결됨');
      },(e)=>{
        console.warn(e);
        updateSyncPill('공유 연결 실패 · 로컬 저장으로 동작 중');
      });
      setupSubcollectionListeners(api);
    }else{
      updateSyncPill('현재 로컬 저장 모드 · Firebase 설정 필요');
    }
  }catch(e){
    console.warn('앱 초기화 오류',e);
    hydrated=true;
    normalizeData(loadLocal()||DEFAULT_DATA);
    render();
    updateSyncPill('초기화 오류 · 로컬 저장으로 동작 중');
  }finally{
    hideSplash();
  }
}
function waitFirebase(){return new Promise(resolve=>setTimeout(resolve,300));}

function updateSyncPill(txt){
  const el=document.getElementById('sync-status');
  if(el)el.textContent=txt;
}

function doneAfter(){
  const n=new Date();
  if(donePer==='all')return new Date(0);
  const d=new Date(n);
  if(donePer==='1w')d.setDate(d.getDate()-7);
  else if(donePer==='2w')d.setDate(d.getDate()-14);
  else if(donePer==='1m')d.setMonth(d.getMonth()-1);
  else if(donePer==='3m')d.setMonth(d.getMonth()-3);
  return d;
}
function notesOnDate(y,m,d){
  const k=dk(y,m,d);
  // 완료된 일정은 달력 점/일정 목록에서 완전히 제외
  return notes.filter(n=>{
    if(!n.start) return false;

    // 시간이 없는 단일 일정은 시작일 하루만 표시
    if(!n.sT && !n.eT && (!n.end || n.end===n.start)){
      return n.start===k;
    }

    return n.start<=k && (!n.end || n.end>=k);
  });
}


function isPrivateVisible(){
  return !!privateViewUnlocked;
}
function togglePrivateView(){
  privateViewUnlocked=!privateViewUnlocked;
  try{
    if(privateViewUnlocked)sessionStorage.setItem('pass_private_unlocked','1');
    else sessionStorage.removeItem('pass_private_unlocked');
  }catch(e){}
  render({preserveScroll:true});
  showToast(privateViewUnlocked?'비공개 일정을 표시해요.':'비공개 일정을 숨겨요.');
}
function displayNoteTitle(n){
  return n?.title||'일정';
}
function noteIsMasked(n){
  return false;
}
function privateChip(n){
  return n&&n.isPrivate?`<span class="chip private-chip">비공개</span>`:'';
}
function togglePrivateField(id){
  const el=document.getElementById(id);
  if(!el)return;
  const share=el.classList.contains('share-toggle');
  el.dataset.val=el.dataset.val==='1'?'':'1';
  const inline=el.classList.contains('private-inline-toggle');
  el.className=(inline?'private-inline-toggle':'type-btn')+(share?' share-toggle':'')+(el.dataset.val==='1'?' tf':'');
  if(inline){
    const locked=el.dataset.val==='1';
    el.innerHTML=share
      ? `<span class="private-lock-icon" aria-hidden="true">${shareToggleSvg()}</span><span class="private-toggle-text">${locked?'나만':'공유'}</span>`
      : `<span class="private-lock-icon" aria-hidden="true">${lockSvg(locked)}</span><span class="private-toggle-text">${locked?'비공개':'공개'}</span>`;
    el.setAttribute('aria-label',share?(locked?'나만 보는 일정':'가족 공유 일정'):(locked?'비공개 일정':'공개 일정'));
  }else{
    el.textContent=el.dataset.val==='1'?'🔒 비공개 ON':'🔓 비공개 OFF';
  }
}
function lockSvg(locked=false){
  return locked
    ? '<svg viewBox="0 0 24 24"><rect x="5.5" y="10" width="13" height="10" rx="2.5"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/></svg>'
    : '<svg viewBox="0 0 24 24"><rect x="5.5" y="10" width="13" height="10" rx="2.5"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 6.1-2.35"/></svg>';
}
function shareToggleSvg(){
  return '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.8 19c.7-3.2 2.5-5 5.2-5s4.5 1.8 5.2 5"/><path d="M14.5 15c2.4.1 4 .9 5.7 3.7"/></svg>';
}
function scheduleTimeSummary(prefix){
  const s=getPickerVal(`${prefix}-st`);
  const e=getPickerVal(`${prefix}-et`);
  if(s&&e)return `${timeLabel(s)} - ${timeLabel(e)}`;
  if(s)return timeLabel(s);
  if(e)return `종료 ${timeLabel(e)}`;
  return '시간 없음';
}
function syncScheduleTimeSummary(prefix){
  const btn=document.getElementById(`${prefix}-time-summary`);
  const fields=document.getElementById(`${prefix}-time-fields`);
  if(btn)btn.textContent=scheduleTimeSummary(prefix);
  if(fields)fields.classList.toggle('has-time',!!(getPickerVal(`${prefix}-st`)||getPickerVal(`${prefix}-et`)));
}
function toggleScheduleTimeFields(prefix,force){
  const fields=document.getElementById(`${prefix}-time-fields`);
  if(!fields)return;
  const show=force===undefined?!fields.classList.contains('show'):!!force;
  fields.classList.toggle('show',show);
  syncScheduleTimeSummary(prefix);
}
function launchDoneConfetti(){
  try{
    if(window.confetti){
      window.confetti({particleCount:72,spread:68,origin:{y:.72},scalar:.82});
      setTimeout(()=>window.confetti({particleCount:32,spread:50,origin:{y:.78},scalar:.62}),120);
    }
  }catch(e){}
}
function requestNotificationPermission(){
  if(!('Notification' in window)){
    showToast('이 브라우저는 알림을 지원하지 않아요.');
    return;
  }
  Notification.requestPermission().then(p=>{
    notificationEnabled=p==='granted';
    saveSettingsOnly();
    showToast(notificationEnabled?'알림 권한이 켜졌어요.':'알림 권한이 꺼져 있어요.');
    openProfileCenter();
  });
}
function openNotificationGuide(){
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">푸시 알림</div>
      <div class="security-note">
        앱에는 서비스워커의 push 알림 수신 로직을 추가했습니다. 실제로 가족 일정 D-1 알림을 자동 발송하려면 서버 또는 Firebase Cloud Messaging에서 push 메시지를 보내야 합니다.
      </div>
      <button class="primary-btn" onclick="requestNotificationPermission()">알림 권한 요청</button>
      <button class="cancel-link" onclick="openProfileCenter()">돌아가기</button>
    </div>
  </div>`;
}

function toggleNote(id){
  if(!requireEditMode())return;
  const n=notes.find(x=>String(x.id)===String(id));
  if(n){
    const willDone=!isDone(n);
    n.done=willDone;
    addChangeLog(`${n.done?'일정 완료':'일정 완료 취소'}: ${displayNoteTitle(n)}`);
    saveNoteOnly(n);
    render({preserveScroll:true});
    if(willDone)launchDoneConfetti();
  }
}

function skipRepeatInstance(id,dateKey){
  if(!requireEditMode())return;
  const n=notes.find(x=>String(x.id)===String(id));
  if(!n || !n.repeat)return;
  if(!Array.isArray(n.skipDates))n.skipDates=[];
  if(!n.skipDates.includes(dateKey))n.skipDates.push(dateKey);
  saveNoteOnly(n);
  render({preserveScroll:true});
  showToast('이번 회차를 삭제했어요.', '실행 취소', ()=>{
    n.skipDates=(n.skipDates||[]).filter(x=>x!==dateKey);
    saveNoteOnly(n);render({preserveScroll:true});
  }, 5000);
}

function delNote(id){
  if(!requireEditMode())return;
  const idx=notes.findIndex(x=>String(x.id)===String(id));
  if(idx>=0){
    addChangeLog(`일정 삭제: ${notes[idx].who||'공통'} · ${notes[idx].title||'일정'}`);
    softDelete('note',notes,idx,'일정을');
  }
}


function highlightText(s){
  const safe=escapeHtml(s||'');
  const q=String(searchQ||'').trim();
  if(!q)return safe;
  const esc=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return safe.replace(new RegExp(esc,'gi'),m=>`<mark class="hl">${m}</mark>`);
}

let itemSwipe=null;
function startItemSwipe(e,kind,id){
  if(touchReorderInfo || __touchReorderPending)return;
  if(e.target&&e.target.closest&&e.target.closest('button,.chk,.small-link,.comment-pill,input,select,textarea,.person-check-label,.day-btn'))return;
  if(itemSwipe&&itemSwipe.card){
    itemSwipe.card.style.transform='translateX(0)';
    itemSwipe.card.classList.remove('swipe-card-active','swipe-complete','swipe-actions');
  }
  const p=swipePoint(e);
  const card=e.currentTarget;
  itemSwipe={kind,id,card,startX:p.x,startY:p.y,lastX:p.x,lastT:Date.now(),dx:0,active:false};
  card.classList.add('swipe-card-active');
  card.style.transition='none';
}
function moveItemSwipe(e){
  if(!itemSwipe)return;
  const p=swipePoint(e);
  const dx=p.x-itemSwipe.startX;
  const dy=p.y-itemSwipe.startY;
  if(Math.abs(dx)<10 || Math.abs(dx)<Math.abs(dy)*1.15)return;
  itemSwipe.active=true;
  if(e.cancelable)e.preventDefault();
  const vdx=Math.max(-92,Math.min(92,rubberDx(dx)));
  itemSwipe.dx=dx;
  itemSwipe.card.style.transform=`translateX(${vdx}px)`;
  itemSwipe.card.classList.toggle('swipe-complete',vdx>36);
  itemSwipe.card.classList.toggle('swipe-actions',vdx<-36);
  itemSwipe.lastX=p.x;
  itemSwipe.lastT=Date.now();
}
function endItemSwipe(e){
  if(!itemSwipe)return;
  const p=swipePoint(e);
  const dt=Math.max(1,Date.now()-itemSwipe.lastT);
  const vx=(p.x-itemSwipe.lastX)/dt;
  const dx=itemSwipe.dx||0;
  const actionRight=itemSwipe.active&&(dx>66||vx>0.48);
  const actionLeft=itemSwipe.active&&(dx<-66||vx<-0.48);
  const {kind,id,card}=itemSwipe;
  card.style.transition='transform .22s cubic-bezier(.2,.8,.2,1)';
  card.style.transform='translateX(0)';
  card.classList.remove('swipe-card-active','swipe-complete','swipe-actions');
  if(itemSwipe.active&&(actionRight||actionLeft))swipeTapUntil=Date.now()+500;
  itemSwipe=null;
  if(actionRight){
    if(kind==='request')toggleReq(id);
    if(kind==='note')openEditNote(id);
    if(kind==='request')showToast('해결 상태를 변경했어요.');
  }else if(actionLeft){
    performSwipeDelete(kind,id);
  }
}
function openSwipeNoteActions(id){
  openEditNote(id);
}
function openSwipeReqActions(id){
  const r=requests.find(x=>String(x.id)===String(id));if(!r)return;
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet action-sheet-compact schedule-action-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">${escapeHtml(r.title||'부탁')}</div>
      <div class="action-grid request-swipe-action-grid">
        <button class="toss-btn primary" onclick="openEditReq('${id}')">수정</button>
        <button class="toss-btn" onclick="closeM()">닫기</button>
      </div>
      <button class="toss-btn danger action-delete-full" onclick="delReq('${id}');closeM()">이 부탁 삭제</button>
    </div>
  </div>`;
}

function openSwipeMemoryActions(id){
  const x=memories.find(v=>String(v.id)===String(id));if(!x)return;
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet action-sheet-compact" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">${escapeHtml(x.name||'축하')}</div>
      <div class="action-grid memory-swipe-action-grid">
        <button class="toss-btn primary" onclick="openMemoryModal('${id}')">수정</button>
        <button class="toss-btn" onclick="closeM()">닫기</button>
      </div>
      <button class="toss-btn danger action-delete-full" onclick="delMemory('${id}');closeM()">이 축하 삭제</button>
    </div>
  </div>`;
}
function openSwipeFamilyActions(id){
  const idx=family.findIndex(x=>String(x.id)===String(id));
  const k=family[idx];
  if(!k)return;
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet action-sheet-compact" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">${escapeHtml(k.name||'대상')}</div>
      <div class="action-grid memory-swipe-action-grid">
        <button class="toss-btn primary" onclick="editKid(${idx})">수정</button>
        <button class="toss-btn" onclick="closeM()">닫기</button>
      </div>
      <button class="toss-btn danger action-delete-full" onclick="delKid(${idx});closeM()">이 가족 삭제</button>
    </div>
  </div>`;
}

let panelSwipe=null;
function startPanelSwipe(e){
  const p=swipePoint(e);
  panelSwipe={el:e.currentTarget,startY:p.y,dy:0};
  panelSwipe.el.style.transition='none';
}
function movePanelSwipe(e){
  if(!panelSwipe)return;
  const p=swipePoint(e);
  const dy=Math.max(0,p.y-panelSwipe.startY);
  panelSwipe.dy=dy;
  if(dy>12&&e.cancelable)e.preventDefault();
  panelSwipe.el.style.transform=`translateY(${Math.min(120,dy)}px)`;
  panelSwipe.el.style.opacity=String(Math.max(.55,1-dy/200));
}
function endPanelSwipe(e){
  if(!panelSwipe)return;
  const {el,dy}=panelSwipe;
  el.style.transition='transform .22s cubic-bezier(.2,.8,.2,1), opacity .18s ease';
  if(dy>70){
    selDate=null;
    panelSwipe=null;
    render({preserveScroll:true});
    return;
  }
  el.style.transform='translateY(0)';
  el.style.opacity='1';
  panelSwipe=null;
}

function makeCard(n){
  return makeScheduleRowCard(n,{});
}



function toggleWeek(){
  weekOpen=!weekOpen;
  render();
}

let holidaySyncBusy=false;
function normalizeHolidayApiResponse(data,year){
  const out=[];
  const push=(date,name)=>{
    if(!date||!name)return;
    const raw=String(date).replace(/-/g,'');
    if(raw.length!==8)return;
    out.push({date:`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`,name:String(name)});
  };

  if(Array.isArray(data)){
    data.forEach(x=>push(x.date||x.locdate||x.locDate,x.name||x.dateName||x.title));
    return out;
  }
  if(Array.isArray(data?.holidays)){
    data.holidays.forEach(x=>push(x.date||x.locdate||x.locDate,x.name||x.dateName||x.title));
    return out;
  }

  let item=data?.response?.body?.items?.item || data?.body?.items?.item || data?.items?.item || [];
  if(!Array.isArray(item))item=[item];
  item.forEach(x=>{
    if(x && (x.isHoliday==='Y' || x.isHoliday===true || x.isHoliday==='true' || x.isHoliday===1)){
      push(x.locdate||x.locDate||x.date, x.dateName||x.name||x.title);
    }
  });
  return out;
}
async function syncHolidayYear(year=calY){
  if(holidaySyncBusy)return;
  if(!HOLIDAY_FUNCTION_URL){
    showToast('공휴일 API URL이 비어 있어요. 관리 센터 안내를 확인하세요.');
    openHolidaySyncGuide();
    return;
  }
  holidaySyncBusy=true;
  try{
    const url=`${HOLIDAY_FUNCTION_URL}${HOLIDAY_FUNCTION_URL.includes('?')?'&':'?'}year=${encodeURIComponent(year)}`;
    const res=await fetch(url,{cache:'no-store'});
    if(!res.ok)throw new Error('공휴일 API 응답 오류');
    const data=await res.json();
    const list=normalizeHolidayApiResponse(data,year);
    if(!list.length)throw new Error('공휴일 데이터가 비어 있음');
    list.forEach(h=>{holidayCache[h.date]=h.name});
    saveSettingsOnly();
    render({preserveScroll:true});
    showToast(`${year}년 공휴일 ${list.length}개를 갱신했어요.`);
  }catch(e){
    console.warn(e);
    showToast('공휴일 갱신 실패: API 설정을 확인해 주세요.');
  }finally{
    holidaySyncBusy=false;
  }
}
function ensureHolidayYear(year){
  if(!HOLIDAY_FUNCTION_URL)return;
  const has=Object.keys(holidayCache||{}).some(k=>k.startsWith(String(year)+'-'));
  if(!has)syncHolidayYear(year);
}
function openHolidaySyncGuide(){
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">공휴일 자동 연동</div>
      <div style="font-size:13px;color:var(--t2);line-height:1.55">
        2028년 이후 명절/대체공휴일은 프론트 코드에 하드코딩하지 않고 Firebase Cloud Functions에서 한국천문연구원 특일 정보 API를 호출해 받아오는 구조로 준비했습니다.<br><br>
        패키지 안의 <b>functions/holidayFunction.example.js</b>를 Cloud Functions에 배포한 뒤, index.html의 <b>HOLIDAY_FUNCTION_URL</b>에 함수 URL을 넣으면 관리 센터에서 연도별 공휴일을 갱신할 수 있습니다.
      </div>
      <div class="action-grid">
        <button class="toss-btn primary" onclick="syncHolidayYear(calY)">현재 연도 갱신</button>
        <button class="toss-btn" onclick="closeM()">닫기</button>
      </div>
    </div>
  </div>`;
}

function openApiKeyGuide(){
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">Firebase API 키 보호</div>
      <div class="security-note">
        Firebase 웹 API 키는 정적 웹앱에서 완전히 숨길 수는 없습니다. 대신 Firebase Console에서 HTTP 참조자 제한을 걸어 이 앱 주소에서만 쓰이게 해야 합니다.
      </div>
      <div style="font-size:13px;color:var(--t2);line-height:1.55;margin-top:12px">
        권장 설정:<br>
        1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보<br>
        2. 현재 웹 API 키 선택<br>
        3. 애플리케이션 제한: HTTP 참조자<br>
        4. 허용 주소에 GitHub Pages 주소 추가<br><br>
        예: <b>https://99ksy9990-bot.github.io/*</b><br>
        Firestore 보안 규칙도 함께 제한해야 실제 데이터 보호가 됩니다.
      </div>
      <button class="cancel-link" onclick="openManageCenter()">돌아가기</button>
    </div>
  </div>`;
}

function renderProfileFamilyRows(){
  if(!family.length)return `<div class="profile-family-list profile-family-empty" onclick="addKid()" role="button" tabindex="0">
    <div class="profile-empty-title">아직 가족이 없어요</div>
    <div class="profile-empty-sub">가족 추가로 우리 집 보드를 시작해요.</div>
  </div>`;
  return `<div class="profile-family-list">${family.map((kid,ki)=>`
    <div class="profile-family-row profile-family-row-v2">
      <button type="button" class="profile-family-main-btn" onclick="editKid(${ki})" aria-label="${escapeAttr(kid.name||'대상')} 기본 정보 수정">
        <div class="profile-family-avatar">${avatarMarkup(personAvatar(kid.name||'대상'),kid.name||'대상')}</div>
        <div class="profile-family-main">
          <div class="profile-family-name">
            <span class="profile-family-accent" style="background:${familyAccentColor(kid.name||'공통')}"></span>
            ${escapeHtml(kid.name||'대상')}
          </div>
          <div class="profile-family-sub">프로필과 대표색</div>
        </div>
        <span class="profile-family-arrow">›</span>
      </button>
    </div>`).join('')}</div>`;
}

function renderSettingsStatusBoard(){
  normalizeShiftUsers();
  const people=(shiftUsers&&shiftUsers.length?shiftUsers:family.map(k=>k.name).filter(Boolean)).slice(0,4);
  const today=todayKey();
  const labels=shiftLabelList().slice(0,4);
  const preview=people.length?people.map(user=>{
    const status=shiftDisplayStatusFor(today,user)||labels[0]||'D';
    return `<div class="settings-status-person">
      <div class="settings-status-head">
        <span class="settings-status-avatar">${avatarMarkup(personAvatar(user),user,'avatar-img-small')}</span>
        <b style="color:${familyAccentColor(user)}">${escapeHtml(user)}</b>
        <span class="settings-dot">·</span>
        <span class="settings-shift-chip ${shiftBadgeClass(status)}">${escapeHtml(status)}</span>
      </div>
      <div class="settings-status-chips">
        ${labels.map(label=>`<button type="button" class="settings-status-chip${label===status?' on':''}" onclick="openShiftPicker('${today}')">${escapeHtml(label)}</button>`).join('')}
      </div>
    </div>`;
  }).join(''):`<div class="profile-empty-sub">근무를 표시할 가족을 선택해 주세요.</div>`;
  return `<section class="settings-family-card settings-status-card">
    <div class="settings-card-head">
      <div>
        <div class="settings-card-title">상태 보드</div>
        <div class="settings-card-sub">오늘 보여줄 근무와 상태</div>
      </div>
    </div>
    <div class="settings-status-targets">${renderShiftUserSelector()}</div>
    <div class="settings-status-list">${preview}</div>
  </section>`;
}

function renderSettingsToolPanel(){
  return `<details class="manage-accordion profile-accordion settings-tools-panel">
    <summary><span>도구</span><em>공유와 앱 설정</em></summary>
    <div class="manage-panel">
      <div class="settings-tool-list">
        <button class="settings-tool-row" onclick="openNotificationGuide()"><span>알림</span><em>권한과 안내</em></button>
        <button class="settings-tool-row" onclick="copyShareLink()"><span>공유 링크</span><em>가족 방 링크 복사</em></button>
        <button class="settings-tool-row" onclick="openShareTools()"><span>QR 공유</span><em>바로 초대하기</em></button>
        <button class="settings-tool-row" onclick="openRoutineManagerFromProfile()"><span>반복 관리</span><em>반복 일정 정리</em></button>
        <button class="settings-tool-row" onclick="togglePrivateView()"><span>${isPrivateVisible()?'나만 숨김':'나만 보기'}</span><em>비공개 일정 표시</em></button>
        <button class="settings-tool-row" onclick="toggleEditMode()"><span>편집 모드</span><em>삭제와 정렬 허용</em></button>
        <button class="settings-tool-row" onclick="openManageCenter()"><span>고급 설정</span><em>백업과 데이터 관리</em></button>
      </div>
      <div class="sync-pill" id="sync-status">${window.__firebaseReady?'실시간 공유 연결 중':'현재 로컬 저장 모드'}</div>
    </div>
  </details>`;
}

function openRoutineManagerFromProfile(){
  closeM();
  main='i';
  basicInfoOpen=false;
  routineOpen=true;
  updateTabUI();
  render({preserveScroll:false});
  try{window.scrollTo(0,0)}catch(e){}
}


function backToScheduleFromRoutine(){
  main='s';
  updateTabUI();
  render({preserveScroll:false});
  try{window.scrollTo(0,0)}catch(e){}
}
function openRoutineManagerFromSchedule(){
  main='i';
  basicInfoOpen=false;
  routineOpen=true;
  updateTabUI();
  render({preserveScroll:false});
  try{window.scrollTo(0,0)}catch(e){}
}
let firstUseGuideRendered=false;
function renderFirstUseGuide(){
  if(main!=='s')return '';
  let count=0;
  try{count=Number(localStorage.getItem('aour_first_guide_count')||'0')}catch(e){count=0}
  if(count>=3)return '';
  if(!firstUseGuideRendered){
    try{localStorage.setItem('aour_first_guide_count',String(count+1))}catch(e){}
    firstUseGuideRendered=true;
  }
  return `<div class="first-use-guide">
    <span>↔ 날짜는 좌우로 밀어 이동</span>
    <span>＋ 추가는 오른쪽 아래</span>
    <span>⚙ 가족 설정은 오른쪽 위</span>
  </div>`;
}


function settingsTabAvatarName(){return '공통';}
function updateSettingsTabAvatar(){return;}
function renderSettingsTab(){
  return `<div class="settings-page fi-outer">
    <div class="settings-hero-card settings-family-hero">
      <div class="settings-hero-main">
        <div class="settings-hero-title">우리 가족</div>
        <div class="settings-hero-sub">가족 구성과 상태를 관리해요.</div>
      </div>
      <button class="toss-btn primary settings-add-family-btn" onclick="addKid()">가족 추가</button>
    </div>

    <div class="profile-section-head settings-section-head">
      <div>
        <div class="profile-section-title">가족 프로필</div>
      </div>
    </div>
    ${renderProfileFamilyRows()}

    ${renderSettingsToolPanel()}
  </div>`;
}

function openProfileCenter(){
  const shareUrl = `${location.origin}${location.pathname}?room=${encodeURIComponent(roomId)}`;
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet profile-center-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">우리 가족</div>

      <div class="profile-section-head">
        <div>
          <div class="profile-section-title">가족 프로필</div>
        </div>
        <button class="toss-btn primary settings-add-family-btn" onclick="addKid()">가족 추가</button>
      </div>
      ${renderProfileFamilyRows()}

      ${renderSettingsToolPanel()}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}

function openManageCenter(){
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet manage-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">관리 도구</div>

      <div class="version-card manage-version-card">
        <div>
          <div class="version-title">패스 ${APP_VERSION}</div>
          <div class="version-sub">최근 업데이트: ${APP_UPDATED}</div>
        </div>
        <span class="edit-pill ${isEditMode()?'edit-on':'edit-off'}">${isEditMode()?'편집 가능':'보기 모드'}</span>
      </div>

      <div class="theme-row manage-theme-row">
        <label>화면 테마</label>
        <select class="theme-select" onchange="setThemeMode(this.value)">
          <option value="system" ${themeMode==='system'?'selected':''}>시스템 설정</option>
          <option value="light" ${themeMode==='light'?'selected':''}>라이트</option>
          <option value="dark" ${themeMode==='dark'?'selected':''}>다크</option>
        </select>
      </div>

      <details class="manage-accordion" open>
        <summary><span>💾 백업 및 복구</span><em>보관</em></summary>
        <div class="manage-panel">
          <div class="manage-grid manage-grid-compact">
            <button class="toss-btn primary" onclick="downloadBackup()">백업 저장</button>
            <button class="toss-btn" onclick="openRestore()">백업 복구</button>
            <button class="toss-btn" onclick="openAutoBackups()">자동 백업</button>
            <button class="toss-btn" onclick="openExport()">엑셀 내보내기</button>
            <button class="toss-btn" onclick="saveCalendarImage()">달력 이미지 저장</button>
          </div>
        </div>
      </details>

      <details class="manage-accordion" open>
        <summary><span>🧰 데이터 점검</span><em>정리와 캐시</em></summary>
        <div class="manage-panel">
          <div class="manage-grid manage-grid-compact">
            <button class="toss-btn" onclick="repairData()">데이터 점검</button>
            <button class="toss-btn" onclick="clearShiftData()">상태표 전체 초기화</button>
            <button class="toss-btn" onclick="prunePastShiftData()">과거 상태 정리</button>
            <button class="toss-btn" onclick="openTrash()">휴지통</button>
            <button class="toss-btn" onclick="openDiagnostics()">앱 진단</button>
            <button class="toss-btn" onclick="clearAppCache()">캐시 초기화</button>
          </div>
        </div>
      </details>

      <details class="manage-accordion">
        <summary><span>공휴일</span><em>달력 표시 기준</em></summary>
        <div class="manage-panel">
          <div class="manage-grid manage-grid-compact">
            <button class="toss-btn" onclick="openHolidayManager()">공휴일 관리</button>
            <button class="toss-btn" onclick="syncHolidayYear(calY)">공휴일 갱신</button>
            <button class="toss-btn" onclick="openHolidaySyncGuide()">공휴일 API 안내</button>
          </div>
        </div>
      </details>

      <details class="manage-accordion">
        <summary><span>ℹ️ 앱 정보와 보안</span><em>기록과 안내</em></summary>
        <div class="manage-panel">
          <div class="manage-grid manage-grid-compact">
            <button class="toss-btn" onclick="openUpdateLog()">업데이트 내역</button>
            <button class="toss-btn" onclick="openChangeLog()">최근 변경</button>
            <button class="toss-btn" onclick="openSecurityGuide()">보안 안내</button>
          </div>
        </div>
      </details>

      <button class="cancel-link" onclick="openProfileCenter()">가족과 설정으로 돌아가기</button>
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function weekDateClass(k){
  const [y,m,d]=k.split('-').map(Number);
  const dow=new Date(y,m-1,d).getDay();
  if(holidayName(k)||dow===0)return 'week-date-holiday';
  if(dow===6)return 'week-date-sat';
  return '';
}
function renderWeekView(){return '';}


function scheduleDateKey(n){
  return n.repeat?nextOccurrence(n,todayKey()):(n.start||'9999-12-31');
}
function scheduleTimeKey(n){
  // 시간이 없는 종일/메모성 일정은 놓치지 않도록 맨 위에 둡니다.
  return n.sT || n.eT || '00:00';
}
function personRank(n){
  const arr=getPersons();
  const idx=arr.indexOf(n.who||'공통');
  return idx<0?999:idx;
}
function oneOffRank(n){
  return (n.repeat || n._autoFamilyInfo) ? 1 : 0;
}
function scheduleSortKey(n){
  const date=scheduleDateKey(n);
  const time=scheduleTimeKey(n);
  const person=String(personRank(n)).padStart(3,'0');
  const id=String(n.id||'');
  if(scheduleSort==='person')return `${person}|${date}|${time}|${id}`;
  if(scheduleSort==='special')return `${oneOffRank(n)}|${date}|${time}|${person}|${id}`;
  if(scheduleSort==='manual')return id;
  return `${date}|${time}|${person}|${id}`;
}
function sortScheduleList(arr){
  if(scheduleSort==='manual')return arr;
  return [...arr].sort((a,b)=>scheduleSortKey(a).localeCompare(scheduleSortKey(b)));
}
function sortPastScheduleList(arr,baseKey=scheduleBaseKey()){
  const ddayRank=n=>{
    const k=scheduleListDate(n)||n.start||'';
    if(!k)return 999999;
    const diff=daysUntilDate(k);
    if(diff===null || diff===undefined || Number.isNaN(diff))return 999999;
    return Math.abs(diff);
  };
  return [...arr].sort((a,b)=>{
    const aa=ddayRank(a);
    const bb=ddayRank(b);
    if(aa!==bb)return aa-bb;
    const da=scheduleListDate(a)||a.start||'';
    const db=scheduleListDate(b)||b.start||'';
    if(da!==db)return db.localeCompare(da);
    const ta=scheduleTimeKey(a), tb=scheduleTimeKey(b);
    if(ta!==tb)return ta.localeCompare(tb);
    return String(a.id||'').localeCompare(String(b.id||''));
  });
}
function scheduleSortLabel(){
  return scheduleSort==='person'?'대상별':scheduleSort==='special'?'특별':scheduleSort==='manual'?'입력순':'다가오는';
}
function filterSearchSvg(){
  return `<svg class="filter-search-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="5.8"/><path d="m15.2 15.2 4 4"/></svg>`;
}
function setScheduleSort(t){
  scheduleSort=t;
  closeM();
  render({preserveScroll:true});
}

function periodLabel(v){
  return v==='today'?'당일':v==='1w'?'1주':v==='1m'?'1개월':v==='3m'?'3개월':'전체';
}
function openActivePeriodSheet(){
  const opts=[['today','당일'],['1w','1주'],['1m','1개월'],['3m','3개월'],['all','전체']];
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">진행 중 기간</div>
      ${opts.map(o=>`<button class="sort-row${activePer===o[0]?' on':''}" onclick="setActivePer('${o[0]}');closeM()">
        <span class="sort-check">${activePer===o[0]?'✓':''}</span>
        <span><b>${o[1]}</b><em>${o[0]==='today'?'오늘 일정만 표시':'해당 기간의 진행 중 일정을 표시'}</em></span>
      </button>`).join('')}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function openDonePeriodSheet(){
  const opts=[['1w','1주'],['1m','1개월'],['3m','3개월'],['all','전체']];
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">완료 기간</div>
      ${opts.map(o=>`<button class="sort-row${donePer===o[0]?' on':''}" onclick="setPer('${o[0]}');closeM()">
        <span class="sort-check">${donePer===o[0]?'✓':''}</span>
        <span><b>${o[1]}</b><em>${o[0]==='all'?'전체 완료 일정':'최근 완료 일정을 표시'}</em></span>
      </button>`).join('')}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function toggleActive(){
  activeOpen=!activeOpen;
  render({preserveScroll:true});
}
function openRoutineAddFromSchedule(){
  if(!requireEditMode())return;
  main='i';
  basicInfoOpen=false;
  routineOpen=true;
  updateTabUI();
  addRepeatItem();
}

function openSortSheet(){
  const opts=[
    ['time','다가오는순','가까운 일정부터 먼저 표시'],
    ['person','대상별 묶어보기','대상별로 묶고 그룹 안은 시간순'],
    ['special','특별 우선','중요 성격의 일정을 먼저 표시'],
    ['manual','입력순','등록한 순서 그대로 표시']
  ];
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">정렬 방식</div>
      ${opts.map(o=>`<button class="sort-row${scheduleSort===o[0]?' on':''}" onclick="setScheduleSort('${o[0]}')">
        <span class="sort-check">${scheduleSort===o[0]?'✓':''}</span>
        <span><b>${o[1]}</b><em>${o[2]}</em></span>
      </button>`).join('')}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}

function sortByStartTime(arr){
  return [...arr].sort((a,b)=>{
    const ta=scheduleTimeKey(a), tb=scheduleTimeKey(b);
    if(ta!==tb)return ta.localeCompare(tb);
    return String(a.title||'').localeCompare(String(b.title||''));
  });
}

function activePeriodEnd(){
  const base=scheduleBaseKey();
  if(activePer==='all')return '9999-12-31';
  if(activePer==='today')return base;
  if(activePer==='1w')return addDaysStr(base,6);
  if(activePer==='1m')return addMonthsStr(base,1);
  if(activePer==='3m')return addMonthsStr(base,3);
  return base;
}
function activeInPeriod(n){
  if(activePer==='all')return true;
  const base=scheduleBaseKey();
  const end=activePeriodEnd();
  if(activePer==='today')return occursOn(n,base);
  const k=n.repeat?nextOccurrence(n,base):(n.start||'');
  if(!k)return true;
  if(n.end && n.end>=base && (n.start||k)<=end)return true;
  return k>=base && k<=end;
}
function periodStartForPast(baseKey=scheduleBaseKey()){
  if(activePer==='today')return baseKey;
  if(activePer==='1w')return addDaysStr(baseKey,-7);
  if(activePer==='1m')return addMonthsStr(baseKey,-1);
  if(activePer==='3m')return addMonthsStr(baseKey,-3);
  return '';
}
function pastInPeriod(n,baseKey=scheduleBaseKey()){
  if(activePer==='all')return true;
  const k=scheduleListDate(n)||n.start||'';
  if(!k)return true;
  if(activePer==='today')return k===baseKey;
  const lower=periodStartForPast(baseKey);
  return lower ? (k>=lower && k<baseKey) : true;
}
function applyPastPeriodFilter(list,baseKey=scheduleBaseKey()){
  return (list||[]).filter(n=>pastInPeriod(n,baseKey));
}
function setActivePer(t){
  activePer=t;
  render();
}
function renderActivePeriodRow(){
  return `<div class="period-row active-period-row">
    <span class="period-lbl">기간</span>
    <button class="period-chip${activePer==='today'?' on':''}" onclick="setActivePer('today')">당일</button>
    <button class="period-chip${activePer==='1w'?' on':''}" onclick="setActivePer('1w')">1주</button>
    <button class="period-chip${activePer==='1m'?' on':''}" onclick="setActivePer('1m')">1개월</button>
    <button class="period-chip${activePer==='3m'?' on':''}" onclick="setActivePer('3m')">3개월</button>
    <button class="period-chip${activePer==='all'?' on':''}" onclick="setActivePer('all')">전체</button>
  </div>`;
}


function scheduleGroupDate(n){
  return scheduleDateKey(n)||n.start||'';
}
function scheduleGroupLabel(k){
  if(!k)return '날짜 없음';
  const [y,m,d]=k.split('-').map(Number);
  const dt=new Date(y,m-1,d);
  const md=`${m}/${d}`;
  if(k===todayKey())return `오늘 (${md})`;
  if(k===tomorrowKey())return `내일 (${md})`;
  return `${md} (${DAYS[dt.getDay()]})`;
}

function toggleRoutine(){
  routineOpen=!routineOpen;
  render();
}
function sectionHeader(title,count,isOpen,toggleFn,actions=''){
  return `<div class="sec compact-sec unified-sec sec-toggle" onclick="${toggleFn}()" style="cursor:pointer">
    <span class="sec-title">${escapeHtml(title)}</span>
    <span class="sec-cnt">· ${count}</span>
    <div class="sec-actions">
      ${actions}
      <button class="fold-btn${isOpen?' open':''}" onclick="event.stopPropagation();${toggleFn}()" aria-label="${isOpen?'접기':'펼치기'}"><span class="fold-chevron"></span></button>
    </div>
  </div>`;
}
function weekCount(){
  let c=0;
  for(let i=0;i<7;i++){
    const k=addDaysStr(todayKey(),i);
    c+=notes.filter(n=>!n.repeat&&occursOn(n,k)).length;
  }
  return c;
}


function targetLabel(v){
  return v==='all'?'가족':(v||'가족');
}
function openScheduleTargetSheet(){
  const opts=[['all','가족'],...getPersons().map(p=>[p,p])];
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">대상 선택</div>
      ${opts.map(o=>`<button class="sort-row${subF===o[0]?' on':''}" onclick="setScheduleTarget(${onclickArg(o[0])})">
        <span class="sort-check">${subF===o[0]?'✓':''}</span>
        <span><b>${escapeHtml(o[1])}</b><em>${o[0]==='all'?'가족 전체 일정':'선택한 대상 일정만 표시'}</em></span>
      </button>`).join('')}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function setScheduleTarget(t){
  filterToday=false;
  subF=t||'all';
  closeM();
  render();
}
function scheduleFilterLabel(){
  return `${targetLabel(subF)} · ${periodLabel(activePer)}`;
}
function setScheduleTargetQuick(t){
  filterToday=false;
  subF=t||'all';
  render({preserveScroll:true});
  openScheduleFilterSheet();
}
function setActivePerQuick(t){
  activePer=t;
  render({preserveScroll:true});
  openScheduleFilterSheet();
}
function setScheduleSortQuick(t){
  scheduleSort=t;
  render({preserveScroll:true});
  openScheduleFilterSheet();
}
function openScheduleFilterSheet(){
  const peopleOpts=getPersons().map(p=>[p,p]);
  const periodOpts=[['today','당일'],['1w','1주'],['1m','1개월'],['3m','3개월'],['all','전체']];
  const targetChip=o=>{
    const selected=subF===o[0];
    const icon=avatarMarkup(personAvatar(o[0]),o[0],'avatar-img-small');
    return `<button class="filter-sheet-chip filter-person-chip${selected?' on':''}" onclick="setScheduleTargetQuick(${onclickArg(o[0])})" aria-label="${escapeAttr(o[1])}" title="${escapeAttr(o[1])}">${icon}</button>`;
  };
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet schedule-filter-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">일정 보기</div>
      <div class="filter-sheet-group">
        <div class="filter-sheet-title">누구</div>
        <div class="filter-sheet-options filter-person-options">${peopleOpts.map(targetChip).join('')}</div>
      </div>
      <div class="filter-sheet-group">
        <div class="filter-sheet-title">언제</div>
        <div class="filter-sheet-options">${periodOpts.map(o=>`<button class="filter-sheet-chip${activePer===o[0]?' on':''}" onclick="setActivePerQuick('${o[0]}')">${escapeHtml(o[1])}</button>`).join('')}</div>
      </div>
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}


const EMPTY_SCHEDULE_VARIANTS=[
  {emoji:'📭', title:'일정이 없어요', sub:'여유로운 하루네요. 잠시 숨을 고르며 천천히 쉬어가요.'},
  {emoji:'🫖', title:'일정이 없어요', sub:'따뜻한 차 한 잔처럼 부드럽고 느긋한 하루가 기다리고 있어요.'},
  {emoji:'🧺', title:'일정이 없어요', sub:'빈 바구니처럼 가벼운 날이에요. 마음도 한결 편안하게 보내보세요.'},
  {emoji:'☕', title:'일정이 없어요', sub:'잠깐 쉬어가기 좋은 타이밍이에요. 느긋하게 하루를 시작해도 좋아요.'},
  {emoji:'🌿', title:'일정이 없어요', sub:'바람처럼 가볍게 흘러가는 하루예요. 여유를 마음껏 누려보세요.'},
  {emoji:'🪴', title:'일정이 없어요', sub:'작은 식물처럼 천천히 숨 고르기 좋은 날이에요.'},
  {emoji:'🛋️', title:'일정이 없어요', sub:'소파에 기대듯 편안한 하루예요. 쉬어도 괜찮아요.'},
  {emoji:'🌤️', title:'일정이 없어요', sub:'가족과 웃으며 보내기 좋은 맑은 하루예요.'},
  {emoji:'🕊️', title:'일정이 없어요', sub:'조용하고 포근한 하루예요. 잠시 여백을 즐겨보세요.'},
  {emoji:'🍪', title:'일정이 없어요', sub:'달콤한 간식처럼 기분 좋은 여유가 있는 날이에요.'},
  {emoji:'📚', title:'일정이 없어요', sub:'책갈피를 잠시 덮어두듯 쉬어가기 좋은 시간이에요.'},
  {emoji:'🧸', title:'일정이 없어요', sub:'포근한 인형처럼 마음이 말랑해지는 하루예요.'},
  {emoji:'🏡', title:'일정이 없어요', sub:'집 안의 작은 평화가 반가운 날이에요.'},
  {emoji:'🌈', title:'일정이 없어요', sub:'무지개처럼 기분 좋은 여유가 살짝 걸려 있어요.'},
  {emoji:'🍵', title:'일정이 없어요', sub:'따뜻한 차를 마시며 가족과 느긋하게 보내보세요.'},
  {emoji:'🧁', title:'일정이 없어요', sub:'작은 디저트처럼 달콤한 빈 시간이 생겼어요.'},
  {emoji:'🌙', title:'일정이 없어요', sub:'조용한 달빛처럼 차분하게 쉬어갈 수 있어요.'},
  {emoji:'🧡', title:'일정이 없어요', sub:'가족과 마음을 나누기 좋은 여백이 있어요.'},
  {emoji:'🎈', title:'일정이 없어요', sub:'가벼운 풍선처럼 부담 없는 하루예요.'},
  {emoji:'🐻', title:'일정이 없어요', sub:'곰돌이처럼 느긋하고 포근한 하루를 보내요.'}
];
let EMPTY_SCHEDULE_PICK=Math.floor(Math.random()*EMPTY_SCHEDULE_VARIANTS.length);
const EMPTY_ROUTINE_VARIANTS=[
  {emoji:'🎒', title:'반복이 없어요', sub:'오늘은 정해진 반복이 잠시 쉬어가는 날이에요.'},
  {emoji:'🪁', title:'반복이 없어요', sub:'바람 따라 가볍게 흘러가는 하루예요.'},
  {emoji:'📘', title:'반복이 없어요', sub:'정해진 순서가 비어 있어 마음도 한결 여유로워요.'},
  {emoji:'🎧', title:'반복이 없어요', sub:'편안한 리듬으로 보내도 좋은 날이에요.'},
  {emoji:'🧩', title:'반복이 없어요', sub:'오늘은 꼭 맞춰야 할 조각이 없어요.'},
  {emoji:'🌼', title:'반복이 없어요', sub:'꽃처럼 가볍게 쉬어가는 일정이에요.'},
  {emoji:'🛴', title:'반복이 없어요', sub:'정해진 동선이 없어 발걸음이 가벼워요.'},
  {emoji:'🍎', title:'반복이 없어요', sub:'학원이나 등교 준비 없이 숨 돌리기 좋아요.'},
  {emoji:'🎨', title:'반복이 없어요', sub:'정해진 반복 대신 하고 싶은 걸 채워봐요.'},
  {emoji:'⛅', title:'반복이 없어요', sub:'조금 느긋한 템포로 보내기 좋은 하루예요.'},
  {emoji:'🫧', title:'반복이 없어요', sub:'가볍고 산뜻한 여백이 생겼어요.'},
  {emoji:'🪵', title:'반복이 없어요', sub:'편안한 휴식이 들어온 날이에요.'},
  {emoji:'🍀', title:'반복이 없어요', sub:'운 좋게 생긴 여유를 즐겨보세요.'},
  {emoji:'🎈', title:'반복이 없어요', sub:'풍선처럼 유연하게 움직여도 돼요.'},
  {emoji:'🕶️', title:'반복이 없어요', sub:'조금 더 가볍고 멋지게 쉬어갈 수 있어요.'},
  {emoji:'🏕️', title:'반복이 없어요', sub:'캠핑처럼 느긋한 분위기를 즐겨보세요.'},
  {emoji:'🧺', title:'반복이 없어요', sub:'빈 시간 바구니에 휴식을 담아보세요.'},
  {emoji:'🌙', title:'반복이 없어요', sub:'차분한 호흡으로 보내기 좋은 리듬이에요.'},
  {emoji:'🧸', title:'반복이 없어요', sub:'포근하게 쉬어가는 하루예요.'},
  {emoji:'🥛', title:'반복이 없어요', sub:'부드러운 템포의 하루예요.'}
];
const EMPTY_REQUEST_VARIANTS=[
  {emoji:'📭', title:'부탁할 일이 없어요', sub:'잠시 여유를 즐겨도 괜찮아요.'},
  {emoji:'🧺', title:'부탁할 일이 없어요', sub:'오늘은 부탁 바구니가 비어 있어요.'},
  {emoji:'☕', title:'부탁할 일이 없어요', sub:'차 한 잔의 여유를 누리기 좋아요.'},
  {emoji:'🌿', title:'부탁할 일이 없어요', sub:'잔잔하게 흘러가는 하루예요.'},
  {emoji:'🫖', title:'부탁할 일이 없어요', sub:'따뜻한 티타임 같은 여유가 있어요.'},
  {emoji:'🍪', title:'부탁할 일이 없어요', sub:'작은 간식처럼 달콤한 빈 시간이에요.'},
  {emoji:'🕊️', title:'부탁할 일이 없어요', sub:'마음이 한결 가볍고 포근해요.'},
  {emoji:'🏡', title:'부탁할 일이 없어요', sub:'집 안에 평화가 머무는 하루예요.'},
  {emoji:'🧡', title:'부탁할 일이 없어요', sub:'부탁 대신 미소를 나누기 좋은 날이에요.'},
  {emoji:'🎈', title:'부탁할 일이 없어요', sub:'부담이 적어 가볍게 흘러가요.'},
  {emoji:'📚', title:'부탁할 일이 없어요', sub:'비어 있는 틈에 좋아하는 시간을 채워봐요.'},
  {emoji:'🌤️', title:'부탁할 일이 없어요', sub:'햇살처럼 산뜻하게 넘어가는 하루예요.'},
  {emoji:'🛋️', title:'부탁할 일이 없어요', sub:'소파에 기대듯 편안히 쉬어보세요.'},
  {emoji:'🍵', title:'부탁할 일이 없어요', sub:'한숨 돌리기에 딱 좋은 타이밍이에요.'},
  {emoji:'🌈', title:'부탁할 일이 없어요', sub:'기분 좋은 여백이 생겼어요.'},
  {emoji:'🪴', title:'부탁할 일이 없어요', sub:'작은 화분처럼 천천히 쉬어가요.'},
  {emoji:'🧁', title:'부탁할 일이 없어요', sub:'달콤한 여유가 놓여 있어요.'},
  {emoji:'🧸', title:'부탁할 일이 없어요', sub:'포근하게 마음을 풀어놓기 좋아요.'},
  {emoji:'🐻', title:'부탁할 일이 없어요', sub:'느긋하고 포근한 하루를 보내요.'},
  {emoji:'🌙', title:'부탁할 일이 없어요', sub:'차분하게 숨 고르기 좋은 시간이에요.'}
];
let EMPTY_ROUTINE_PICK=Math.floor(Math.random()*EMPTY_ROUTINE_VARIANTS.length);
let EMPTY_REQUEST_PICK=Math.floor(Math.random()*EMPTY_REQUEST_VARIANTS.length);
function refreshEmptyStatePick(kind='all'){
  if(kind==='all' || kind==='schedule')EMPTY_SCHEDULE_PICK=Math.floor(Math.random()*EMPTY_SCHEDULE_VARIANTS.length);
  if(kind==='all' || kind==='routine')EMPTY_ROUTINE_PICK=Math.floor(Math.random()*EMPTY_ROUTINE_VARIANTS.length);
  if(kind==='all' || kind==='request')EMPTY_REQUEST_PICK=Math.floor(Math.random()*EMPTY_REQUEST_VARIANTS.length);
}
function pickScheduleEmpty(title,sub){
  const base=EMPTY_SCHEDULE_VARIANTS[EMPTY_SCHEDULE_PICK]||EMPTY_SCHEDULE_VARIANTS[0];
  return {emoji:base.emoji,title:title||base.title,sub:base.sub};
}

function pickRoutineEmpty(title,sub){
  const base=EMPTY_ROUTINE_VARIANTS[EMPTY_ROUTINE_PICK]||EMPTY_ROUTINE_VARIANTS[0];
  return {emoji:base.emoji,title:title||base.title,sub:sub||base.sub};
}
function pickRequestEmpty(title,sub){
  const base=EMPTY_REQUEST_VARIANTS[EMPTY_REQUEST_PICK]||EMPTY_REQUEST_VARIANTS[0];
  return {emoji:base.emoji,title:title||base.title,sub:sub||base.sub};
}
function renderBriefEmptyState(kind,title,sub=''){
  const c=kind==='routine'?pickRoutineEmpty(title,sub):kind==='request'?pickRequestEmpty(title,sub):pickScheduleEmpty(title,sub);
  return `<div class="brief-empty-state brief-empty-${kind}"><div class="brief-empty-art">${escapeHtml(c.emoji)}</div><div class="brief-empty-title">${escapeHtml(c.title)}</div>${c.sub?`<div class="brief-empty-sub">${escapeHtml(c.sub)}</div>`:''}</div>`;
}
function compactSchedulePrompt(){
  const prompts=[
    '오늘 등록 일정이 없어요.',
    '오늘은 조금 가볍게 보내도 좋아요.',
    '새 일정은 +에서 바로 등록해요.',
    '챙길 일정이 생기면 적어둘게요.'
  ];
  return prompts[EMPTY_SCHEDULE_PICK%prompts.length];
}function emptyMessageHtml(message){
  return escapeHtml(String(message||'')).replace(/&lt;br\s*\/?&gt;/gi,'<br>');
}
function renderEmptyState(kind,title,sub=''){
  const known=['schedule','routine','request','done','generic'];
  if(!known.includes(kind)){
    return `<div class="empty-state empty-generic"><div class="empty-emoji">${escapeHtml(kind||'🌿')}</div><div class="empty-title">${emptyMessageHtml(title||'표시할 내용이 없어요')}</div></div>`;
  }
  const cfg={
    schedule:pickScheduleEmpty(title,sub),
    routine:pickRoutineEmpty(title,sub),
    request:pickRequestEmpty(title,sub),
    done:{emoji:'✅',title:title||'완료된 항목이 없어요',sub:sub||'완료 기록이 생기면 이곳에 차곡차곡 모여요.'},
    generic:{emoji:'🌿',title:title||'표시할 내용이 없어요',sub:sub||'조금 더 편안한 화면이에요.'}
  };
  const c=cfg[kind]||cfg.generic;
  return `<div class="empty-state empty-${kind}"><div class="empty-emoji">${escapeHtml(c.emoji)}</div><div class="empty-title">${escapeHtml(c.title)}</div>${c.sub?`<div class="empty-sub">${escapeHtml(c.sub)}</div>`:''}</div>`;
}


function compactSchedulePrompt(){
  const prompts=[
    '오늘은 조금 가볍게 보내도 좋아요.',
    '가족과 쉬어가는 하루예요.',
    '오늘은 비교적 여유로운 하루예요.',
    '잠깐 숨 고르기 좋은 날이에요.'
  ];
  return prompts[EMPTY_SCHEDULE_PICK%prompts.length];
}

function scheduleListDate(n){
  if(!n)return '';
  if(n._displayDate)return n._displayDate;
  if(n.repeat)return nextOccurrence(n,scheduleBaseKey?scheduleBaseKey():todayKey());
  return n.start||'';
}
function shortDateWithDow(k){
  if(!k)return '';
  const [y,m,d]=String(k).split('-').map(Number);
  if(!y||!m||!d)return '';
  const dow=DAYS[new Date(y,m-1,d).getDay()]||'';
  return `${m}/${d}(${dow})`;
}
function scheduleListDateTime(n){
  const k=scheduleListDate(n);
  const date=shortDateWithDow(k);
  const s=n?.sT||'';
  const e=n?.eT||'';
  let time='';
  if(s&&e)time=`${s} ~ ${e}`;
  else if(s)time=s;
  else if(e)time=`~ ${e}`;
  return [date,time].filter(Boolean).join(' ');
}
function isMissedSchedule(n,baseKey=scheduleBaseKey?scheduleBaseKey():todayKey()){
  if(!n||n._autoFamilyInfo)return false;
  if(n.repeat)return false;
  const k=n.start||'';
  if(!k)return false;
  if(isDone(n))return true;
  if(k<baseKey)return true;
  if(k>baseKey || baseKey!==todayKey())return false;
  const now=new Date();
  const nowMin=now.getHours()*60+now.getMinutes();
  const end=minuteOf(n.eT||'');
  const start=minuteOf(n.sT||'');
  const mark=end!==null?end:start;
  return mark!==null && mark<nowMin;
}
function scheduleListSort(arr){
  return [...(arr||[])].sort((a,b)=>{
    const pa=personRank(a), pb=personRank(b);
    const da=scheduleListDate(a)||'', db=scheduleListDate(b)||'';
    if(scheduleSort==='person' && pa!==pb)return pa-pb;
    if(da!==db)return da.localeCompare(db);
    const ta=scheduleTimeKey(a), tb=scheduleTimeKey(b);
    if(ta!==tb)return ta.localeCompare(tb);
    if(pa!==pb)return pa-pb;
    return String(a.title||'').localeCompare(String(b.title||''),'ko');
  });
}
function postponeNoteToToday(id){
  if(!requireEditMode())return;
  const n=notes.find(x=>String(x.id)===String(id));
  if(!n)return;
  const oldStart=n.start||'';
  const oldEnd=n.end||'';
  let dur=0;
  if(oldStart&&oldEnd&&oldEnd>oldStart){
    dur=Math.max(0,daysBetween(oldStart,oldEnd));
  }
  n.start=todayKey();
  n.end=dur?addDaysStr(todayKey(),dur):'';
  addChangeLog(`일정 오늘로 미루기: ${n.title||'일정'}`);
  saveNoteOnly(n);
  closeM();
  render({preserveScroll:true});
  showToast('오늘 일정으로 미뤘어요.');
}
function scheduleRowMetaClass(n){
  if(isDone(n))return ' done';
  if(isMissedSchedule(n))return ' missed';
  return '';
}

function scheduleDdayTextForList(n,opts={}){
  const k=scheduleListDate(n)||n.start||'';
  const diff=daysUntilDate(k);
  if(diff===null || diff===undefined || Number.isNaN(diff))return '';
  if(diff===0)return 'D-Day';
  if(diff>0 && diff<=365)return `D-${diff}`;
  if(diff<0){
    const past=Math.abs(diff);
    if(opts.past && past>7)return '';
    return `D+${past}`;
  }
  return '';
}
function scheduleListDateLine(n){
  const text=shortDateWithDow(scheduleListDate(n))||'날짜 없음';
  return text.replace(/\s+/g,' ').trim();
}

function makeScheduleRowCard(n,opts={}){
  if(!n)return '';
  const done=false;
  const missed=opts.missed || isMissedSchedule(n);
  const who=n.who||'공통';
  const id=String(n.id||'');
  const isAuto=!!n._autoFamilyInfo;
  const click=isAuto?'':`onclick="if(!consumeSwipeTap())openEditNote('${id}')"`;
  const swipe=isAuto?'':`
    ontouchstart="startItemSwipe(event,'note','${id}')" ontouchmove="moveItemSwipe(event)" ontouchend="endItemSwipe(event)"
    onmousedown="startItemSwipe(event,'note','${id}')" onmousemove="moveItemSwipe(event)" onmouseup="endItemSwipe(event)" onmouseleave="endItemSwipe(event)"`;
  const drag=isAuto?'':`draggable="true" ondragstart="dragStart(event,'notes','${id}')" ondragover="dragOver(event)" ondrop="dropItem(event,'notes','${id}')" ondragend="dragEnd(event)"`;
  const dday=scheduleDdayTextForList(n,opts);
  return `<div class="modern-schedule-item schedule-line-card swipe-card${done?' done':''}${missed?' missed':''}${isAuto?' auto':''}${n.isPrivate?' private':''}" ${click} ${swipe} ${drag}>
    <div class="swipe-bg swipe-bg-right">수정</div><div class="swipe-bg swipe-bg-left">메뉴</div>
    <div class="modern-schedule-avatar" title="${escapeAttr(who)}">${avatarMarkup(personAvatar(who),who,'avatar-img')}</div>
    <div class="modern-schedule-content">
      <div class="modern-schedule-inline${done?' done':''}"><span class="modern-schedule-person" style="color:${familyAccentColor(who)}">${escapeHtml(who)}</span><span class="modern-schedule-dotsep">·</span><span class="modern-schedule-when">${escapeHtml(scheduleListDateLine(n))}</span><span class="modern-schedule-title-inline">${highlightText(displayNoteTitle(n))}</span>${privateChip(n)}</div>
    </div>
    ${dday?`<div class="modern-dday-badge${missed?' missed':''}${done?' done':''}">${escapeHtml(dday)}</div>`:''}
  </div>`;
}
function renderSchedulePersonGroups(list,opts={}){
  const arr=opts.keepOrder||opts.past ? (list||[]) : scheduleListSort(list||[]);
  if(!arr.length)return '';
  return arr.map(n=>makeScheduleRowCard(n,opts)).join('');
}
function renderScheduleDashboardList(normal=[],missed=[],emptyText='등록 일정이 없어요',opts={}){
  if(!normal.length&&!missed.length)return renderEmptyState('schedule',emptyText,opts.past?'지난 일정이 없어요.':'오늘은 조금 가볍게 보내도 좋아요.');
  let html='';
  if(missed.length){
    html+=`<div class="schedule-warning-group">
      <div class="schedule-warning-title">지난 일정</div>
      ${scheduleListSort(missed).map(n=>makeScheduleRowCard(n,{missed:true})).join('')}
    </div>`;
  }
  html+=renderSchedulePersonGroups(normal,opts);
  return html;
}

function renderScheduleCardList(list,emptyText='진행 중인 일정이 없어요'){
  return renderScheduleDashboardList(list,[],emptyText,{});
}
function openRoutineFabSheet(){
  if(!requireEditMode())return;
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet smart-fab-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">반복 추가</div>
      <div class="smart-fab-grid">
        <button class="smart-fab-option" onclick="closeM();addRepeatItem()">
          <span class="smart-fab-emoji">🔁</span>
          <b>반복 일정</b>
          <em>반복되는 일정을 추가해요</em>
        </button>
        <button class="smart-fab-option" onclick="closeM();addKid()">
          <span class="smart-fab-emoji">👤</span>
          <b>가족 추가</b>
          <em>가족 프로필을 추가해요</em>
        </button>
      </div>
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}

function calendarFabDate(){
  if(selDate)return selDate;
  if(calY===TY && calM===TM)return todayKey();
  const last=new Date(calY,calM+1,0).getDate();
  const day=Math.min(TD,last);
  return dk(calY,calM,day);
}
function performSwipeDelete(kind,id){
  if(!requireEditMode())return;
  if(kind==='request')return delReq(id);
  if(kind==='note')return delNote(id);
  if(kind==='memory')return delMemory(id);
  if(kind==='family'){
    const idx=family.findIndex(x=>String(x.id)===String(id));
    if(idx>=0)return delKid(idx);
  }
}

function renderFab(){
  if(main==='s'){
    return `<button class="fab-add smart-fab smart-fab-extended" onclick="openQuickAddSheet()" aria-label="추가"><span class="fab-plus">+</span><span class="fab-label">추가</span></button>`;
  }
  if(main==='c' && calViewMode!=='work' && !shiftSelectMode){
    return `<button class="fab-add smart-fab smart-fab-extended calendar-fab-add" onclick="openQuickAddSheet('${calendarFabDate()}')" aria-label="추가"><span class="fab-plus">+</span><span class="fab-label">추가</span></button>`;
  }
  if(main==='i'){
    return `<button class="fab-add smart-fab smart-fab-extended" onclick="openRoutineFabSheet()" aria-label="추가"><span class="fab-plus">+</span><span class="fab-label">추가</span></button>`;
  }
  if(main==='r'){
    return `<button class="fab-add smart-fab smart-fab-extended" onclick="openReqModal()" aria-label="추가"><span class="fab-plus">+</span><span class="fab-label">추가</span></button>`;
  }
  if(main==='m'){
    return `<button class="fab-add smart-fab smart-fab-extended" onclick="openMemoryModal()" aria-label="추가"><span class="fab-plus">+</span><span class="fab-label">추가</span></button>`;
  }
  return '';
}

function quickAddSvg(kind){
  const map={
    schedule:'<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/><path d="M8.5 14h3M8.5 17h5"/></svg>',
    todo:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12.5 2.4 2.4L16.5 9"/></svg>',
    routine:'<svg viewBox="0 0 24 24"><path d="M17.5 7.5A7 7 0 0 0 5.2 11"/><path d="M5 6.5V11h4.5"/><path d="M6.5 16.5A7 7 0 0 0 18.8 13"/><path d="M19 17.5V13h-4.5"/></svg>',
    memory:'<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/><path d="M12 17s-3.2-1.8-3.2-4a1.9 1.9 0 0 1 3.2-1.3A1.9 1.9 0 0 1 15.2 13c0 2.2-3.2 4-3.2 4Z"/></svg>',
    family:'<svg viewBox="0 0 24 24"><path d="M9 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M15.5 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M4.5 19c.5-3.2 2.1-5 4.5-5s4 1.8 4.5 5"/><path d="M13.5 14.4c.7-.4 1.4-.6 2.2-.6 2 0 3.3 1.5 3.8 4.2"/></svg>'
  };
  return `<span class="quick-add-icon quick-add-icon-${kind}" aria-hidden="true">${map[kind]||map.schedule}</span>`;
}

function openQuickAddSheet(dateVal){
  const d=dateVal||todayKey();
  document.body.classList.add('quick-add-open');
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg quick-add-bg" onclick="closeM(event)">
    <div class="modal-sheet smart-fab-sheet quick-add-sheet" onclick="event.stopPropagation()">
      <div class="quick-add-panel">
        <div class="quick-add-title">무엇을 추가할까요?</div>
        <button class="smart-fab-option quick-add-row" onclick="closeM();openAddModal('${d}')">
          ${quickAddSvg('schedule')}
          <span><b>일정</b></span>
        </button>
        <button class="smart-fab-option quick-add-row" onclick="closeM();openRoutineManagerFromSchedule();setTimeout(addRepeatItem,80)">
          ${quickAddSvg('routine')}
          <span><b>반복</b></span>
        </button>
        <button class="smart-fab-option quick-add-row" onclick="closeM();openReqModal()">
          ${quickAddSvg('todo')}
          <span><b>부탁</b></span>
        </button>
        <button class="smart-fab-option quick-add-row" onclick="closeM();openProfileCenter()">
          ${quickAddSvg('family')}
          <span><b>가족</b></span>
        </button>
      </div>
    </div>
  </div>`;
}

function renderS(){
  const baseKey=scheduleBaseKey();
  const targetOk=n=>subF==='all'||(n.who||'공통')===subF;
  const noteOk=n=>matchSearchNote(n)&&targetOk(n);

  const past=notes.filter(n=>{
    if(!noteOk(n))return false;
    if(!isMissedSchedule(n,baseKey))return false;
    return pastInPeriod(n,baseKey);
  }).map(n=>({...n,_displayDate:n.start||''}));

  let active=notes.filter(n=>{
    if(!noteOk(n))return false;
    if(isMissedSchedule(n,baseKey))return false;
    if(filterToday)return occursOn(n,baseKey);
    return activeInPeriod(n);
  }).map(n=>{
    const k=n.repeat?nextOccurrence(n,baseKey):(n.start||'');
    return {...n,_displayDate:k||n.start||''};
  });

  active=scheduleListSort(active);

  const pastList=applyPastPeriodFilter(sortPastScheduleList(past,baseKey),baseKey);

  const activeCount=active.length;
  const activeAll=[...active];
  const warmPreviewHtml=activeCount<=1?renderUpcomingPreview(3,baseKey):'';
  const activeCards = activeOpen
    ? `<div class="card-wrap schedule-card-list schedule-dashboard-list">${renderScheduleDashboardList(active,[],'등록 일정이 없어요')}</div>`
    : `<div class="schedule-collapsed-hint warm-collapsed-hint" onclick="toggleActive()" role="button" tabindex="0">${escapeHtml(scheduleCollapsedSummary(activeAll,activeCount,'active'))}</div>`;

  const doneCards = doneOpen
    ? `<div class="card-wrap schedule-card-list schedule-dashboard-list done-list" style="margin-top:8px">${renderScheduleDashboardList(pastList,[],'지난 일정이 없어요',{past:true})}</div>`
    : `<div class="schedule-collapsed-hint warm-collapsed-hint" onclick="toggleDone()" role="button" tabindex="0">${escapeHtml(scheduleCollapsedSummary(pastList,pastList.length,'done'))}</div>`;

  return`<div class="schedule-swipe-sync">
    ${filterToday?`<div class="sync-pill" style="margin:10px 16px 0">기준일 일정만 보는 중 · <button class="small-link" onclick="filterToday=false;render()">전체 보기</button></div>`:''}
    ${sectionHeader('등록 일정',activeCount,activeOpen,'toggleActive',`
      <button class="sec-chip-btn filter-icon-btn schedule-filter-pill" onclick="event.stopPropagation();openScheduleFilterSheet()" aria-label="일정 보기 필터: ${escapeAttr(scheduleFilterLabel())}, ${escapeAttr(scheduleSortLabel())}" title="${escapeAttr(`${scheduleFilterLabel()} · ${scheduleSortLabel()}`)}">${filterSearchSvg()}</button>
    `)}
    ${activeCards}
    ${warmPreviewHtml}
    <div class="div"></div>
    ${sectionHeader('지난 일정',pastList.length,doneOpen,'toggleDone',`
      <button class="sec-chip-btn filter-icon-btn schedule-filter-pill" onclick="event.stopPropagation();openScheduleFilterSheet()" aria-label="지난 일정 보기 필터: ${escapeAttr(scheduleFilterLabel())}, 가까운 순" title="${escapeAttr(`${scheduleFilterLabel()} · 가까운 순`)}">${filterSearchSvg()}</button>
    `)}
    ${doneCards}
  </div>`;
}

let doneOpen=false;
function toggleDone(){doneOpen=!doneOpen;render();}

function setSub(t){subF=t;render()}
function setDoneF(t){doneF=t;render()}
function setPer(t){donePer=t;render()}


function calendarTimeOnly(n){
  const s=n.sT||'';
  const e=n.eT||'';
  if(s&&e)return `${s} ~ ${e}`;
  if(s)return `${s} ~`;
  if(e)return `~ ${e}`;
  return '시간 미정';
}
function calendarDateTime(n,selDate=''){
  const v=dateTimeRange({...n,start:n.start||selDate,end:n.end||''});
  return v || calendarTimeOnly(n) || '시간 미정';
}

function calendarDetailSort(a,b){
  const pa=personRank(a), pb=personRank(b);
  if(pa!==pb)return pa-pb;
  const ta=scheduleTimeKey(a), tb=scheduleTimeKey(b);
  if(ta!==tb)return ta.localeCompare(tb);
  return String(a.title||'').localeCompare(String(b.title||''));
}
function calendarMemorySort(a,b){
  const pa=personRank({who:memoryPerson(a)}), pb=personRank({who:memoryPerson(b)});
  if(pa!==pb)return pa-pb;
  return String(a.name||'').localeCompare(String(b.name||''));
}
function calendarMemoryItem(x,sp){
  const mp=memoryDisplaySubject(x);
  return `<div class="ev-item cal-selected-event memory-selected-event">
    <div class="ev-birthday-icon memory-display-avatar-sm">${memoryDisplayAvatarHtml(x,'avatar-img')}</div>
    <div class="ev-info">
      <div class="ev-title">${escapeHtml(x.name)}</div>
      <div class="ev-sub"><span class="ev-meta-kind">축하</span><span class="ev-meta-sep">·</span><span class="ev-meta-person">${escapeHtml(mp)}</span><span class="ev-meta-sep">·</span><span class="ev-meta-time">${escapeHtml(memoryAgeLabel(x))}</span></div>
    </div>
  </div>`;
}
function skipRoutineInstance(routineId,dateKey){
  if(!requireEditMode())return;
  const r=(repeatItems||[]).find(x=>String(x.id)===String(routineId));
  if(!r)return;
  if(!Array.isArray(r.skipDates))r.skipDates=[];
  if(!r.skipDates.includes(dateKey))r.skipDates.push(dateKey);
  saveSettingsOnly();
  render({preserveScroll:true});
  showToast('해당 날짜의 반복을 삭제했습니다.', '실행 취소', ()=>{
    r.skipDates=(r.skipDates||[]).filter(x=>x!==dateKey);
    saveSettingsOnly();render({preserveScroll:true});
  }, 5000);
}
function routineInstanceActions(n,selDate){
  return '';
}

function openCalendarNoteActions(id){
  openEditNote(id);
}
function openRoutineInstanceDetail(title,who,timeText,dateKey,kind,id){
  if(kind==='auto'){
    const idx=(repeatItems||[]).findIndex(x=>String(x.id)===String(id));
    if(idx>=0){
      openRepeatEditModal(idx);
      return;
    }
  }
  if(kind==='note' && id){
    openEditNote(id);
    return;
  }
  openRoutineManagerFromSchedule();
}
function skipCalendarRoutineInstance(kind,id,dateKey){
  if(kind==='auto')skipRoutineInstance(id,dateKey);
  else skipRepeatInstance(id,dateKey);
  closeM();
}
function calendarEventItem(n,selDate){
  const whoRaw=n.who||'공통';
  const who=escapeHtml(whoRaw);
  const tm=calendarTimeOnly(n);
  const title=highlightText(displayNoteTitle(n));
  return `<div class="ev-item cal-selected-event oneoff-selected-event${n.isPrivate?' private':''}">
    <div class="oneoff-avatar-col" onclick="openEditNote('${n.id}')" style="cursor:pointer">
      <div class="ev-avatar oneoff-avatar">${avatarMarkup(personAvatar(whoRaw),whoRaw)}</div>
      <div class="oneoff-person under-avatar">${who}</div>
    </div>
    <div class="ev-info oneoff-info" onclick="openEditNote('${n.id}')" style="cursor:pointer">
      <div class="oneoff-box">
        <div class="oneoff-main">
          <div class="ev-title oneoff-title">${title}${privateChip(n)}</div>
          ${tm&&tm!=='시간 미정'?`<div class="ev-meta-time oneoff-time">${escapeHtml(tm)}</div>`:''}
        </div>
        ${n.alertMemo && !noteIsMasked(n)?`<div class="ev-alert">${escapeHtml(n.alertMemo)}</div>`:''}
      </div>
    </div>
    <button class="dots-menu-btn" onclick="openEditNote('${n.id}')" aria-label="일정 메뉴">···</button>
  </div>`;
}

function renderC(){
  const y=calY,m=calM;
  ensureHolidayYear(y);
  if(calViewMode==='work' || !isEditMode()){
    shiftSelectMode=false;
    shiftSelectedDates=[];
  }
  ensureCalendarTargetForView();
  const dInM=new Date(y,m+1,0).getDate();
  const firstDay=new Date(y,m,1).getDay();
  let g='';
  DAYS.forEach((d,idx)=>{g+=`<div class="cal-dname${idx===0?' sun-dname':idx===6?' sat-dname':''}">${d}</div>`});
  for(let i=0;i<firstDay;i++)g+=`<div></div>`;
  for(let d=1;d<=dInM;d++){
    const key=dk(y,m,d);
    const dayOfWeek=new Date(y,m,d).getDay();
    const hName=holidayName(key);
    const isToday=y===TY&&m===TM&&d===TD;
    const isSel=selDate===key;
    const isBulk=shiftSelectedDates.includes(key);
    const syncOff=isSyncOffDay(key);
    const allEvs=notesOnDateAll(y,m,d);
    const allMems=memoriesOnDate(y,m,d);
    const evs=filterCalendarEventsByTarget(allEvs);
    const mems=filterCalendarMemoriesByTarget(allMems);
    const showShift=(calViewMode==='all'||calViewMode==='work');
    const dotHtml=renderCalendarCellDots(allEvs,allMems);
    const hasCalSearch=!!String(searchQ||'').trim();
    const q=normText(searchQ);
    const searchHit=calViewMode==='work' || !hasCalSearch || allEvs.some(n=>matchSearchNote(n)) || allMems.some(x=>[x.name,x.memo,x.birth].some(v=>normText(v).includes(q)));
    const searchCls=hasCalSearch?(searchHit?' search-hit':' search-dim'):'';
    const numCls=isToday?' today-n':(hName||dayOfWeek===0?' holiday-n':(dayOfWeek===6?' sat-n':''));

    g+=`<div class="cal-cell${isToday?' today-cell':''}${syncOff?' sync-off':''}${isSel?' sel':''}${isBulk?' bulk-sel':''}${searchCls}"
      onclick="if(!consumeSwipeTap())${shiftSelectMode?`toggleShiftDate('${key}')`:`selCal('${key}')`}"
      onmousedown="if(!shiftSelectMode)startLongAdd(event,'${key}')"
      onmouseup="cancelLongAdd()"
      onmouseleave="cancelLongAdd()"
      ontouchstart="if(!shiftSelectMode)startLongAdd(event,'${key}')"
      ontouchend="cancelLongAdd()"
      ontouchmove="cancelLongAdd()">
      <div class="cal-date-line"><div class="cal-num${numCls}" ${hName?`title="${escapeAttr(hName)}"`:''}>${d}</div></div>
      <div class="cal-shift-line">${showShift?renderCalendarShiftBadges(key):(dotHtml||'<span style="display:inline-block;height:15px"></span>')}</div>
      <div class="cal-dots">${calViewMode==='all'?dotHtml:''}</div>
    </div>`;
  }

  let evHtml='';
  if(selDate && !shiftSelectMode){
    const sp=selDate.split('-');
    const allEvs=notesOnDateAll(+sp[0],+sp[1]-1,+sp[2]);
    const allMems=memoriesOnDate(+sp[0],+sp[1]-1,+sp[2]);
    const evs=filterCalendarEventsByTarget(allEvs);
    const mems=filterCalendarMemoriesByTarget(allMems);
    if(calViewMode==='work'){
      evHtml='';
    }else if(calViewMode==='routine'){
      evHtml=renderRepeatOnlyDetail(selDate,evs);
    }else{
      const detailEvs=calViewMode==='all'?evs:evs.filter(n=>!isRoutineCalendarEvent(n));
      evHtml=renderCalendarWWWDetailCard(selDate,renderCalendarWWWDetailRows(selDate,{
        evs:detailEvs,
        mems,
        includeShift:calViewMode==='all',
        hideEmpty:false
      }));
    }
  }

  return`<div class="cal-outer cal-mode-${calViewMode}">
    <div class="cal-top-select-row calendar-control-line calendar-view-control-line">
      ${renderCalendarViewModeChips()}
    </div>
    <div class="cal-card" ontouchstart="startLayerSwipe(event,\'calendar\',\'.cal-card\')" ontouchmove="moveLayerSwipe(event)" ontouchend="endLayerSwipe(event)" onmousedown="startLayerSwipe(event,\'calendar\',\'.cal-card\')" onmousemove="moveLayerSwipe(event)" onmouseup="endLayerSwipe(event)" onmouseleave="endLayerSwipe(event)">
      <div class="cal-nav">
        <button class="cal-nav-btn" onclick="chCal(-1)">‹</button>
        <div class="cal-nav-title"><span class="cal-nav-year">${y}</span><span class="cal-nav-month">${m+1}월</span></div>
        <button class="cal-nav-btn" onclick="chCal(1)">›</button>
      </div>
      <div class="cal-grid">${g}</div>
      ${calViewMode==='work'?renderCalendarShiftCounts():renderCalendarPersonLegend()}
    </div>
    ${renderShiftQuickInputBar()}
    ${evHtml}
  </div>`;
}
function setShift(k,t){
  setShiftStatus(k,firstShiftUser(),t||'',false);
}
function selectShiftQuickDate(dateKey){
  if(!dateKey)return;
  calViewMode='work';
  shiftSelectMode=false;
  shiftSelectedDates=[];
  setGlobalDateContext(dateKey,{syncCalendar:true,doRender:false});
  render({preserveScroll:true});
}
function shiftQuickInputUser(){
  normalizeShiftUsers();
  if(calViewMode==='work')return calendarWorkUser();
  if(calWhoF!=='all' && shiftUsers.includes(calWhoF))return calWhoF;
  if(shiftBulkUser && shiftUsers.includes(shiftBulkUser))return shiftBulkUser;
  shiftBulkUser=firstShiftUser();
  return shiftBulkUser;
}
function shiftQuickDateLabel(dateKey){
  if(!dateKey)return '날짜를 선택해 주세요';
  const [y,m,d]=dateKey.split('-').map(Number);
  const day=DAYS[new Date(y,m-1,d).getDay()];
  return `${m}/${d} ${day}`;
}
function shiftQuickDateTitle(dateKey){
  if(!dateKey)return '날짜를 선택해 주세요';
  const [y,m,d]=dateKey.split('-').map(Number);
  const day=DAYS[new Date(y,m-1,d).getDay()];
  return `${m}월 ${d}일 ${day}요일`;
}
function workQuickShiftLabel(status){
  const v=String(status||'').toUpperCase();
  if(v==='OFF'||v==='O')return 'OFF';
  return workCalendarShiftLabel(status);
}
function advanceShiftQuickDate(dateKey){
  const next=addDaysStr(dateKey,1);
  setGlobalDateContext(next,{syncCalendar:true,doRender:false});
}
function applyQuickShift(status){
  if(!requireEditMode())return;
  if(!selDate){
    showToast('먼저 날짜를 선택해 주세요.');
    return;
  }
  const user=shiftQuickInputUser();
  if(!user)return;
  if(!shiftData[selDate]||typeof shiftData[selDate]==='string')shiftData[selDate]={};
  if(status===SHIFT_DEFAULT){
    delete shiftData[selDate][user];
  }else if(status===SHIFT_NONE){
    shiftData[selDate][user]=SHIFT_NONE;
  }else if(status){
    shiftData[selDate][user]=status;
  }else{
    delete shiftData[selDate][user];
  }
  if(shiftData[selDate] && !Object.keys(shiftData[selDate]).length)delete shiftData[selDate];
  const savedDate=selDate;
  saveShiftOnly(savedDate,status||'');
  advanceShiftQuickDate(savedDate);
  render({preserveScroll:true});
  try{showToast(`${shiftQuickDateLabel(savedDate)} ${user} ${status===SHIFT_NONE?'미입력':status||'기본값'} 저장`)}catch(e){}
}
function clearShiftQuickSelection(){
  selDate=null;
  render({preserveScroll:true});
}
function renderShiftQuickInputBar(){
  if(!isEditMode() || calViewMode!=='work')return '';
  const user=shiftQuickInputUser();
  const primaryLabels=['D','E','N','OFF'];
  const current=selDate?shiftDisplayStatusFor(selDate,user):'';
  const currentLabel=workQuickShiftLabel(current);
  const hasDate=!!selDate;
  const selectedLabel=hasDate?shiftQuickDateLabel(selDate):'날짜를 선택해 주세요';
  return `<div class="shift-quick-input-bar">
    <div class="shift-quick-head">
      <div class="shift-quick-title-line">
        <b>${escapeHtml(selectedLabel)}</b>
        <span>·</span>
        <em>${escapeHtml(user)}</em>
      </div>
      <button type="button" class="shift-quick-target" onclick="openShiftTargetSheet()">${escapeHtml(user)} <span>⌄</span></button>
    </div>
    <div class="shift-quick-actions primary-shift-actions">
      ${primaryLabels.map(s=>`<button class="shift-quick-chip${currentLabel===s?' on':''}" ${hasDate?'':'disabled'} onclick="applyQuickShift(${onclickArg(s)})">${escapeHtml(s)}</button>`).join('')}
    </div>
    <div class="shift-quick-sub-actions">
      <button class="shift-quick-chip secondary clear" ${hasDate?'':'disabled'} onclick="applyQuickShift(SHIFT_NONE)">미입력</button>
    </div>
  </div>`;
}
function selCal(k){
  if(calViewMode==='work'){
    selectShiftQuickDate(k);
    return;
  }
  setGlobalDateContext(k,{syncCalendar:false,doRender:false});
  selDate=selDate===k?null:k;
  const sp=k.split('-');
  calY=+sp[0];
  calM=+sp[1]-1;
  render();
  if(selDate){
    setTimeout(()=>{
      const el=document.getElementById('selected-day-panel');
      if(el && el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'});
    },80);
  }
}
function chCal(d){
  calM+=d;
  if(calM<0){calM=11;calY--}
  if(calM>11){calM=0;calY++}
  selDate=null;
  render({preserveScroll:true});
}

function addRepeatItem(){
  if(!requireEditMode())return;
  routineOpen=true;
  const item={id:Date.now(),who:(routineTargetFilter&&routineTargetFilter!=='all'?routineTargetFilter:(getPersons()[0]||'공통')),title:'',days:[],start:'',sT:'',eT:'',repeatEnd:'',pauseOnVacation:false};
  repeatItems.unshift(item);
  saveSettingsOnly();
  render({preserveScroll:true});
  setTimeout(()=>openRepeatEditModal(0),60);
}
function delRepeatItem(ii){
  if(!requireEditMode())return;
  if(!repeatItems[ii])return;
  const removed=repeatItems[ii];
  trashItem('repeat',removed);
  const trashId=deletedItems[deletedItems.length-1].id;
  repeatItems.splice(ii,1);
  saveSettingsOnly();
  render();
  showToast('반복 일정을 삭제했습니다.', '실행 취소', ()=>undoTrashById(trashId,'repeat',ii), 5000);
}
function togglePauseOnVacation(ii){
  if(!requireEditMode())return;
  if(!repeatItems[ii])return;
  repeatItems[ii].pauseOnVacation=!repeatItems[ii].pauseOnVacation;
  saveSettingsOnly();
  render({preserveScroll:true});
}
function updRepeatVal(ii,key,val){
  if(!requireEditMode())return;
  if(!repeatItems[ii])return;
  repeatItems[ii][key]=val;
  saveSettingsOnly();
}
function toggleRepeatDay(ii,di){
  if(!requireEditMode())return;
  const item=repeatItems[ii]; if(!item)return;
  if(!Array.isArray(item.days))item.days=[];
  const idx=item.days.indexOf(di);
  if(idx>=0)item.days.splice(idx,1);else item.days.push(di);
  item.days.sort((a,b)=>a-b);
  saveSettingsOnly();render();
}

function toggleBasicInfo(){
  basicInfoOpen=!basicInfoOpen;
  render();
}
function reorderListItem(listName,id,targetId){
  if(!requireEditMode())return;
  if(!id || !targetId || String(id)===String(targetId))return;
  let arr=null;
  if(listName==='notes')arr=notes;
  else if(listName==='requests')arr=requests;
  else if(listName==='family')arr=family;
  else if(listName==='repeatItems')arr=repeatItems;
  else if(listName==='memories')arr=memories;
  if(!arr)return;
  const from=arr.findIndex(x=>String(x.id)===String(id));
  const to=arr.findIndex(x=>String(x.id)===String(targetId));
  if(from<0||to<0)return;
  const [item]=arr.splice(from,1);
  arr.splice(to,0,item);
  if(listName==='notes'||listName==='requests')saveAll();
  else saveSettingsOnly();
  render();
}
function touchReorderStart(e,listName,id){
  if(e.target && e.target.closest && e.target.closest('input,select,button,textarea,.person-check-label,.day-btn'))return;
  const p=swipePoint(e);
  clearTimeout(touchReorderTimer);
  __touchReorderPending={listName,id,el:e.currentTarget,startX:p.x,startY:p.y,cancelled:false};
  touchReorderTimer=setTimeout(()=>{
    if(!__touchReorderPending || __touchReorderPending.cancelled)return;
    touchReorderInfo={listName,id,el:e.currentTarget};
    __touchReorderPending=null;
    e.currentTarget.classList.add('dragging');
  },500);
}
function touchReorderMove(e){
  const t=e.touches&&e.touches[0];
  if(__touchReorderPending && t){
    const dx=Math.abs(t.clientX-__touchReorderPending.startX);
    const dy=Math.abs(t.clientY-__touchReorderPending.startY);
    if(dx>10 || dy>10){
      __touchReorderPending.cancelled=true;
      __touchReorderPending=null;
      clearTimeout(touchReorderTimer);
    }
  }
  if(!touchReorderInfo)return;
  e.preventDefault();
  if(!t)return;
  document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
  const el=document.elementFromPoint(t.clientX,t.clientY)?.closest('[data-reorder-list]');
  if(el && el.dataset.reorderList===touchReorderInfo.listName && el.dataset.reorderId!==String(touchReorderInfo.id)){
    el.classList.add('drop-target');
  }
}
function touchReorderEnd(e){
  clearTimeout(touchReorderTimer);
  __touchReorderPending=null;
  if(!touchReorderInfo)return;
  const info=touchReorderInfo;
  if(info.el)info.el.classList.remove('dragging');
  const t=e.changedTouches&&e.changedTouches[0];
  let target=null;
  if(t)target=document.elementFromPoint(t.clientX,t.clientY)?.closest('[data-reorder-list]');
  document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
  touchReorderInfo=null;
  if(target && target.dataset.reorderList===info.listName){
    reorderListItem(info.listName,info.id,target.dataset.reorderId);
  }
}
function touchReorderCancel(){
  clearTimeout(touchReorderTimer);
  __touchReorderPending=null;
  if(touchReorderInfo?.el)touchReorderInfo.el.classList.remove('dragging');
  touchReorderInfo=null;
  document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
}

function requestWriterOptions(){
  return getPersons().filter(Boolean);
}
function selectReqWriter(v){
  const mode=document.getElementById('rq-writer-mode');
  if(mode)mode.value=v||'__direct';
  document.querySelectorAll('.rq-writer-btn').forEach(b=>{
    b.classList.toggle('on', b.dataset.writer===String(v||'__direct'));
  });
  const direct=document.getElementById('rq-wr');
  if(direct){
    const isDirect=String(v||'__direct')==='__direct';
    direct.style.display=isDirect?'block':'none';
    if(isDirect)setTimeout(()=>direct.focus(),40);
  }
}

function toggleFamilyToday(ki){
  if(!requireEditMode())return;
  if(!family[ki])return;
  family[ki].showToday=!family[ki].showToday;
  saveSettingsOnly();
  render();
}
function toggleFamilyRoutine(ki){
  if(!requireEditMode())return;
  if(!family[ki])return;
  family[ki].showRoutine=!family[ki].showRoutine;
  saveSettingsOnly();
  render();
}
function toggleFamilyRequestWriter(ki){
  if(!requireEditMode())return;
  if(!family[ki])return;
  family[ki].showRequestWriter=!family[ki].showRequestWriter;
  saveSettingsOnly();
  render({preserveScroll:true});
}
function openQuickColorPicker(ki){
  if(!requireEditMode())return;
  const k=family[ki];
  if(!k)return;
  const curColor=k.color||defaultPersonColor(k.name);
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">${escapeHtml(k.name||'대상')} 달력 색상</div>
      <div class="quick-color-desc">달력 점과 일정 표시 색상을 선택하세요.</div>
      <div class="color-choice-row">
        ${PERSON_COLOR_PALETTE.map(c=>`
          <button type="button" class="color-choice${c===curColor?' on':''}" data-color="${c}" onclick="saveQuickColor(${ki},'${c}')" style="background:${c}"></button>
        `).join('')}
      </div>
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function saveQuickColor(ki,color){
  if(!requireEditMode())return;
  if(!family[ki])return;
  family[ki].color=color;
  saveSettingsOnly();
  render({preserveScroll:true});
  showToast('색상을 변경했어요.');
  openProfileCenter();
}


function setRoutineTargetFilter(v){
  routineTargetFilter=v||'all';
  render({preserveScroll:true});
}
function repeatDaysSummary(days){
  const a=Array.isArray(days)?days:[];
  if(!a.length)return '반복 요일을 선택해 주세요';
  if(a.length===7)return '매일';
  const weekday=[1,2,3,4,5];
  if(a.length===5 && weekday.every(x=>a.includes(x)))return '평일';
  return a.map(i=>DAYS[i]).join('·');
}
function repeatTimeSummary(item){
  const s=item?.sT||'';
  const e=item?.eT||'';
  if(s&&e)return `${s} ~ ${e}`;
  if(s&&!e)return `${s}`;
  if(!s&&e)return `~ ${e}`;
  return '시간 없음';
}
function syncRepeatTimeSummary(ii){
  const s=getPickerVal(`rp-st-${ii}`);
  const e=getPickerVal(`rp-et-${ii}`);
  const btn=document.getElementById(`rp-time-summary-${ii}`);
  const fields=document.getElementById(`rp-time-fields-${ii}`);
  const label=s&&e?`${s} ~ ${e}`:s?s:e?`~ ${e}`:'시간 없음';
  if(btn){
    btn.textContent=label;
    btn.classList.toggle('empty',!(s||e));
  }
  if(fields)fields.classList.toggle('has-time',!!(s||e));
}
function toggleRepeatTimeFields(ii,force){
  const fields=document.getElementById(`rp-time-fields-${ii}`);
  if(!fields)return;
  const show=force===undefined?!fields.classList.contains('show'):!!force;
  fields.classList.toggle('show',show);
  syncRepeatTimeSummary(ii);
}
function repeatDateSummary(item){
  const parts=[];
  if(item?.start)parts.push(`시작 ${dateLabel(item.start)}`);
  if(item?.repeatEnd)parts.push(`종료 ${dateLabel(item.repeatEnd)}`);
  return parts.join(' · ');
}
function renderRoutineTargetFilter(){
  const opts=[['all','가족'],...getPersons().map(p=>[p,p])];
  return `<div class="routine-filter-row">${opts.map(([k,label])=>{
    const on=(routineTargetFilter||'all')===k;
    return `<button class="routine-filter-chip${on?' on':''}" onclick="setRoutineTargetFilter(${onclickArg(k)})">${escapeHtml(label)}</button>`;
  }).join('')}</div>`;
}
function toggleRepeatModalDay(ii,di){
  const item=repeatItems[ii]; if(!item)return;
  const draft=__repeatEditDrafts[ii] || deepCopy(item);
  __repeatEditDrafts[ii]=draft;
  if(!Array.isArray(draft.days))draft.days=[];
  const idx=draft.days.indexOf(di);
  if(idx>=0)draft.days.splice(idx,1);else draft.days.push(di);
  draft.days.sort((a,b)=>a-b);
  const btn=document.querySelector(`[data-edit-day="${ii}-${di}"]`);
  if(btn)btn.classList.toggle('on',draft.days.includes(di));
  const summary=document.getElementById(`repeat-days-summary-${ii}`);
  if(summary)summary.textContent=repeatDaysSummary(draft.days);
}
function toggleRepeatModalVacation(ii){
  const item=repeatItems[ii]; if(!item)return;
  const draft=__repeatEditDrafts[ii] || deepCopy(item);
  __repeatEditDrafts[ii]=draft;
  draft.pauseOnVacation=!draft.pauseOnVacation;
  const btn=document.getElementById(`repeat-vacation-${ii}`);
  if(btn){
    btn.classList.toggle('on',!!draft.pauseOnVacation);
    btn.textContent=draft.pauseOnVacation?'🌴 방학 쉼 ON':'🌴 방학 쉼 OFF';
  }
}
function openRepeatEditModal(ii){
  if(!requireEditMode())return;
  const item=repeatItems[ii];
  if(!item)return;
  const draft=deepCopy(item);
  __repeatEditDrafts[ii]=draft;
  const idp=`${ii}`;
  const who=draft.who||'공통';
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet routine-edit-sheet add-flow-sheet routine-www-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="add-flow-head">
        <div>
          <div class="modal-hd">반복 일정 수정</div>
        </div>
      </div>
      <div class="add-flow-card">
        <div class="add-step-head"><span>WHO</span><b>누가</b></div>
        <input type="hidden" id="re-who-${ii}" value="${escapeAttr(who)}"/>
        <div class="type-sel person-chip-selector routine-person-selector">
          ${repeatPersonChoiceButtons(ii,who)}
        </div>
      </div>

      <div class="add-flow-card">
        <div class="add-step-head"><span>WHEN</span><b>언제</b></div>
        <div class="repeat-days-summary-line" id="repeat-days-summary-${ii}">${escapeHtml(repeatDaysSummary(draft.days))}</div>
        <div class="day-sel routine-edit-days">${DAYS.map((d,di)=>`<button class="day-btn${draft.days&&draft.days.includes(di)?' on':''}" data-edit-day="${ii}-${di}" onclick="toggleRepeatModalDay(${ii},${di})">${d}</button>`).join('')}</div>
        <div class="add-when-grid add-when-compact routine-time-compact">
          <div class="add-when-time-summary"><div class="sublabel">시간</div><button type="button" class="picker-field add-time-summary${(draft.sT||draft.eT)?'':' empty'}" id="rp-time-summary-${idp}" onclick="toggleRepeatTimeFields(${ii})">${repeatTimeSummary(draft)}</button></div>
        </div>
        <div class="add-time-fields${(draft.sT||draft.eT)?' show has-time':''}" id="rp-time-fields-${idp}">
          <div><div class="sublabel">시작</div><input class="picker-field${draft.sT?'':' empty'}" id="rp-st-${idp}" readonly data-val="${draft.sT||''}" value="${draft.sT?timeLabel(item.sT):'시간 없음'}" onclick="openTimePicker('rp-st-${idp}')"/></div>
          <div><div class="sublabel">종료</div><input class="picker-field${draft.eT?'':' empty'}" id="rp-et-${idp}" readonly data-val="${draft.eT||''}" value="${draft.eT?timeLabel(item.eT):'시간 없음'}" onclick="openTimePicker('rp-et-${idp}')"/></div>
        </div>
      </div>

      <div class="add-flow-card add-what-card">
        <div class="add-step-head"><span>WHAT</span><b>무엇을</b></div>
        <input class="mi add-title-input" id="re-title-${ii}" value="${escapeAttr(draft.title||'')}" placeholder="무엇을 반복하나요?"/>
      </div>

      <details class="detail-settings">
        <summary>반복 조건 더 설정</summary>
        <div class="detail-settings-panel">
          <div class="ml">방학</div>
          <button class="today-toggle-pill vacation-toggle modal-vacation-toggle${draft.pauseOnVacation?' on':''}" id="repeat-vacation-${ii}" onclick="event.stopPropagation();toggleRepeatModalVacation(${ii})">
            ${draft.pauseOnVacation?'🌴 방학 쉼 ON':'🌴 방학 쉼 OFF'}
          </button>

          <div class="ml">날짜</div>
          <div class="mi-2">
            <div><div class="sublabel">시작일</div><input class="picker-field${draft.start?'':' empty'}" id="rp-sd-${idp}" readonly data-val="${draft.start||''}" value="${draft.start?dateLabel(item.start):'시작일'}" onclick="openDatePicker('rp-sd-${idp}')"/></div>
            <div><div class="sublabel">종료일</div><input class="picker-field${draft.repeatEnd?'':' empty'}" id="rp-re-${idp}" readonly data-val="${draft.repeatEnd||''}" value="${draft.repeatEnd?dateLabel(item.repeatEnd):'종료일'}" onclick="openDatePicker('rp-re-${idp}')"/></div>
          </div>
        </div>
      </details>

      <div class="edit-sheet-actions routine-edit-actions">
        <button class="primary-btn" onclick="saveRepeatEdit(${ii})">저장</button>
        <button class="edit-danger-text" onclick="delRepeatItem(${ii});closeM()">반복 일정 삭제</button>
      </div>
    </div>
  </div>`;
}
function saveRepeatEdit(ii){
  if(!requireEditMode())return;
  const item=repeatItems[ii];
  if(!item)return;
  const draft=__repeatEditDrafts[ii] || deepCopy(item);
  const title=(document.getElementById(`re-title-${ii}`)||{}).value||'';
  if(!title.trim()){
    alert('반복 일정 이름을 먼저 적어주세요!');
    return;
  }
  item.title=title.trim();
  item.who=(document.getElementById(`re-who-${ii}`)||{}).value||draft.who||'공통';
  item.days=Array.isArray(draft.days)?[...draft.days]:[];
  item.pauseOnVacation=!!draft.pauseOnVacation;
  item.start=getPickerVal(`rp-sd-${ii}`);
  item.repeatEnd=getPickerVal(`rp-re-${ii}`);
  item.sT=getPickerVal(`rp-st-${ii}`);
  item.eT=getPickerVal(`rp-et-${ii}`);
  delete __repeatEditDrafts[ii];
  saveSettingsOnly();
  closeM();
  render({preserveScroll:true});
  showToast('반복 일정을 저장했어요 👏');
}


function repeatFutureStartSummary(item){
  const start=item?.start||'';
  if(start && start>todayKey())return `시작 ${dateLabel(start)}`;
  return '';
}
function repeatCompactMeta(item){
  const parts=[repeatDaysSummary(item?.days)];
  const futureStart=repeatFutureStartSummary(item);
  if(futureStart)parts.push(futureStart);
  if(item?.pauseOnVacation)parts.push('방학 쉼');
  return parts.filter(Boolean).join(' · ');
}

function renderI(){
  let h=`<div class="routine-subscreen-head"><button class="subscreen-back-btn" onclick="backToScheduleFromRoutine()">← 일정으로 돌아가기</button><div class="subscreen-title">반복 관리</div></div><div class="fi-outer routine-only-outer">`;

  const visibleRepeats=(repeatItems||[]).map((item,ii)=>({item,ii})).filter(x=>{
    if((routineTargetFilter||'all')==='all')return true;
    return (x.item.who||'공통')===routineTargetFilter;
  });

  h+=`${sectionHeader('반복 일정',visibleRepeats.length,routineOpen,'toggleRoutine',`
    <span class="collapsed-hint routine-reorder-hint">카드를 누르면 수정해요</span>
  `)}`;

  if(routineOpen){
    h+=renderRoutineTargetFilter();

    if(visibleRepeats.length){
      const groups={};
      visibleRepeats.forEach(x=>{
        const who=x.item.who||'공통';
        if(!groups[who])groups[who]=[];
        groups[who].push(x);
      });
      const order=getPersons();
      const groupKeys=Object.keys(groups).sort((a,b)=>{
        const ia=order.indexOf(a), ib=order.indexOf(b);
        return (ia<0?999:ia)-(ib<0?999:ib);
      });

      h+=`<div class="repeat-tab-grid">`;
      groupKeys.forEach(who=>{
        const arr=groups[who];
        h+=`<div class="person-routine-card" style="--person-color:${familyTintColor(who,.10)};--person-accent:${familyAccentColor(who)}">
          <div class="card-avatar">${avatarMarkup(personAvatar(who),who)}</div>
          <div class="card-name" style="color:${familyAccentColor(who)}">${escapeHtml(who)} <span class="person-routine-count">${arr.length}</span></div>
          <div class="person-routine-items">`;
        arr.forEach(({item,ii})=>{
          const rid=item.id||ii;
          const time=repeatTimeSummary(item);
          const meta=repeatCompactMeta(item);
          h+=`<div class="card-routine-item reorder-card"
            draggable="true"
            data-reorder-list="repeatItems" data-reorder-id="${rid}"
            onclick="if(!consumeSwipeTap())openRepeatEditModal(${ii})"
            ondragstart="dragStart(event,'repeatItems','${rid}')"
            ondragover="dragOver(event)"
            ondrop="dropItem(event,'repeatItems','${rid}')"
            ondragend="dragEnd(event)"
            ontouchstart="touchReorderStart(event,'repeatItems','${rid}')"
            ontouchmove="touchReorderMove(event)"
            ontouchend="touchReorderEnd(event)"
            ontouchcancel="touchReorderCancel()">
            <div class="routine-title-wrap">
              <div class="routine-title">${escapeHtml(item.title||'등록된 반복 일정이 없어요')}</div>
              <div class="routine-submeta">${escapeHtml(meta)}</div>
            </div>
            <div class="routine-meta">${escapeHtml(time)}</div>
          </div>`;
        });
        h+=`</div></div>`;
      });
      h+=`</div>`;
    }else{
      h+=renderEmptyState('routine','등록된 반복 일정이 없어요','오른쪽 아래 + 버튼으로 반복 일정을 추가해 보세요.');
    }
  }else{
    h+=`<div class="basic-info-collapsed" onclick="toggleRoutine()">${escapeHtml(collapsedStateLabel({count:(repeatItems||[]).length,sectionName:'반복 일정',sectionType:'repeat',singleNoun:'일정',state:'fold'}))}</div>`;
  }
  h+=`</div>`;
  return h;
}
function editCatLabel(ki,ci){
  const cat=family?.[ki]?.cats?.[ci];
  if(!cat)return;
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">반복 이름 수정</div>
      <div class="ml">이름</div>
      <input class="mi" id="cat-name" value="${escapeAttr(cat.label||'')}" placeholder="예: 학교 시간, 학원, 기타"/>
      <button class="primary-btn" onclick="saveCatLabel(${ki},${ci})">저장</button>
      <button class="cancel-link" onclick="closeM()">취소</button>
    </div>
  </div>`;
}
function saveCatLabel(ki,ci){
  if(!requireEditMode())return;
  const cat=family?.[ki]?.cats?.[ci];
  if(!cat)return;
  const name=(document.getElementById('cat-name')||{}).value||'';
  cat.label=name.trim()||'반복';
  saveSettingsOnly();
  closeM();
  render();
}
function toggleDay(ki,ci,ii,di){
  if(!requireEditMode())return;
const a=family[ki].cats[ci].items[ii].days;const idx=a.indexOf(di);if(idx>=0)a.splice(idx,1);else a.push(di);a.sort((x,y)=>x-y);saveSettingsOnly();render()}
function updVal(ki,ci,ii,v){
  if(!requireEditMode())return;
family[ki].cats[ci].items[ii].val=v;saveSettingsOnly()}
function addRow(ki,ci){
  if(!requireEditMode())return;
  family[ki].cats[ci].items.push({days:[], val:'', start:'', sT:'', eT:'', repeatEnd:''});
  saveSettingsOnly();render();
  setTimeout(()=>{const ins=document.querySelectorAll('.fi-input');if(ins.length)ins[ins.length-1].focus()},50);
}
function delRow(ki,ci,ii){
  if(!requireEditMode())return;
if(!confirmDelete('이 항목을 지울까요?'))return;family[ki].cats[ci].items.splice(ii,1);saveSettingsOnly();render()}
function delCat(ki,ci){
  if(!requireEditMode())return;
if(!confirmDelete('이 카테고리를 지울까요?'))return;family[ki].cats.splice(ci,1);saveSettingsOnly();render()}
function delKid(i){
  if(!requireEditMode())return;
  const k=family[i];
  if(!k)return;
  const nm=(k.name||'').trim()||'대상';
  if(BASE_PERSONS.includes(nm))hideBasePerson(nm);
  addChangeLog(`대상 삭제: ${nm}`);
  softDelete('kid',family,i,`${nm} 대상을`);
  closeM();
}


function toggleReq(id){
  if(!requireEditMode())return;
  const r=requests.find(x=>String(x.id)===String(id));
  if(r){
    const willDone=!isDone(r);
    r.done=willDone;
    r.doneAt=r.done?todayKey():'';
    addChangeLog(`${r.done?'부탁 해결':'부탁 해결 취소'}: ${r.title||'부탁'}`);
    saveRequestOnly(r);
    render({preserveScroll:true});
    if(willDone)launchDoneConfetti();
  }
}
function delReq(id){
  if(!requireEditMode())return;
  const idx=requests.findIndex(x=>String(x.id)===String(id));
  if(idx>=0){
    addChangeLog(`부탁 삭제: ${requests[idx].title||'부탁'}`);
    softDelete('request',requests,idx,'부탁을');
  }
}

function makeReqCard(r){
  const due = requestDueLabel(r);
  const done = isDone(r);
  const writer = r.writer || '공통';
  const avatar = `<div class="todo-compact-avatar" title="${escapeAttr(writer)}">${avatarMarkup(personAvatar(writer), writer, 'avatar-img-small')}</div>`;
  const writerName = `<div class="todo-compact-person" style="color:${familyAccentColor(writer)}">${escapeHtml(writer)}</div>`;
  const check = `<div class="chk ${done ? 'on' : ''}" onclick="event.stopPropagation(); toggleReq('${r.id}')">
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5L5 9L13 1" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>`;
  return `<div class="card swipe-card request-swipe-card todo-compact-card ${done ? 'done-card' : ''}" 
    ontouchstart="startItemSwipe(event,'request','${r.id}')" ontouchmove="moveItemSwipe(event)" ontouchend="endItemSwipe(event)"
    onmousedown="startItemSwipe(event,'request','${r.id}')" onmousemove="moveItemSwipe(event)" onmouseup="endItemSwipe(event)" onmouseleave="endItemSwipe(event)"
    draggable="true" ondragstart="dragStart(event,'requests','${r.id}')" ondragover="dragOver(event)" ondrop="dropItem(event,'requests','${r.id}')" ondragend="dragEnd(event)"
    onclick="if(!consumeSwipeTap())openEditReq('${r.id}')" style="cursor:pointer">
    <div class="swipe-bg swipe-bg-right">해결</div><div class="swipe-bg swipe-bg-left">수정 · 삭제</div>
    <div class="todo-compact-grid ${done?'todo-done-grid':'todo-active-grid'}">
      ${check}
      ${avatar}
      ${writerName}
      <div class="todo-compact-main">
        <div class="todo-compact-title ${done ? 'done' : ''}">${highlightText(r.title)}</div>
        ${r.comment ? `<div class="todo-memo">↳ ${escapeHtml(r.comment)}</div>` : ''}
      </div>
      <div class="todo-compact-due">${due ? escapeHtml(due) : ''}</div>
    </div>
  </div>`;
}


function toggleRequest(){
  requestOpen=!requestOpen;
  render({preserveScroll:true});
}
function toggleRequestDone(){
  requestDoneOpen=!requestDoneOpen;
  render({preserveScroll:true});
}

function renderRequestAllClearState(){
  return `<div class="request-clear-state">
    <div class="request-clear-icon">🙏</div>
    <div class="request-clear-title">남은 부탁이 없어요</div>
    <div class="request-clear-sub">오늘은 모두 정리됐어요.</div>
    <button type="button" class="request-clear-add" onclick="openReqModal()">+ 부탁 추가</button>
  </div>`;
}

function renderR(){
  const active=requests.filter(r=>!isDone(r)&&matchSearchReq(r));
  const done=requests.filter(r=>isDone(r)&&matchSearchReq(r));
  if(!active.length && !done.length){
    return `<div class="request-empty-page">${renderRequestAllClearState()}</div>`;
  }
  if(!active.length){
    return `
      <div class="request-empty-page">${renderRequestAllClearState()}</div>
      <div class="div"></div>
      ${sectionHeader('최근 해결한 부탁',done.length,requestDoneOpen,'toggleRequestDone')}
      ${requestDoneOpen?`<div class="request-list-wrap todo-list-wrap done-list">${done.map(makeReqCard).join('')}</div>`:`<div class="schedule-collapsed-hint warm-collapsed-hint">해결한 부탁 ${done.length}개가 숨겨져 있어요.</div>`}
    `;
  }
  const activeBody = `<div class="request-list-wrap todo-list-wrap">${active.map(makeReqCard).join('')}</div>`;
  return`
    ${sectionHeader('남은 부탁',active.length,requestOpen,'toggleRequest')}
    ${requestOpen?activeBody:`<div class="schedule-collapsed-hint warm-collapsed-hint">부탁 목록을 잠시 접어뒀어요.</div>`}
    <div class="div"></div>
    ${sectionHeader('해결한 부탁',done.length,requestDoneOpen,'toggleRequestDone')}
    ${requestDoneOpen?`<div class="request-list-wrap todo-list-wrap done-list">${done.length?done.map(makeReqCard).join(''):renderEmptyState('done','해결한 부탁이 없어요','해결한 부탁은 이곳에 차곡차곡 모여요.')}</div>`:''}
  `;
}

function openReqModal(id){
  const r=id?requests.find(x=>String(x.id)===String(id)):null;
  const reqDate=(r&&r.requestDate)||todayKey();
  const writer=(r&&r.writer)||'';
  const writers=requestWriterOptions();
  const selectedWriter=(writer&&writers.includes(writer))?writer:(writers[0]||'공통');
  const dueDate=(r&&r.dueDate)||'';
  const dueTime=(r&&r.dueTime)||'';
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet schedule-edit-sheet add-flow-sheet todo-flow-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="add-flow-head">
        <div>
          <div class="modal-hd">${r?'부탁 수정':'부탁 추가'}</div>
        </div>
      </div>
      <div class="add-flow-card">
        <div class="add-step-head"><span>WHO</span><b>누가</b></div>
        <input type="hidden" id="rq-writer-mode" value="${escapeAttr(selectedWriter)}"/>
        <div class="request-writer-tabs todo-person-row">
          ${writers.map(w=>`<button type="button" class="rq-writer-btn avatar-only${selectedWriter===w?' on':''}" data-writer="${escapeAttr(w)}" onclick="selectReqWriter(${onclickArg(w)})" aria-label="${escapeAttr(w)}" title="${escapeAttr(w)}">${avatarMarkup(personAvatar(w),w,'avatar-img-small')}</button>`).join('')}
        </div>
      </div>
      <div class="add-flow-card">
        <div class="add-step-head"><span>WHEN</span><b>언제</b></div>
        <input type="hidden" id="rq-date" data-val="${reqDate}" value="${dateLabel(reqDate)}"/>
        <div class="add-when-grid todo-when-grid">
          <div><div class="sublabel">부탁한 날</div><input class="picker-field" id="rq-date-view" readonly data-val="${reqDate}" value="${dateLabel(reqDate)}" onclick="openTodoRequestDatePicker()"/></div>
          <div><div class="sublabel">언제까지</div><input class="picker-field${dueDate?'':' empty'}" id="rq-due-date" readonly data-val="${dueDate}" value="${dueDate?dateLabel(dueDate):'마감 없음'}" onclick="openDatePicker('rq-due-date')"/></div>
          <div><div class="sublabel">시간</div><input class="picker-field${dueTime?'':' empty'}" id="rq-due-time" readonly data-val="${dueTime}" value="${dueTime?timeLabel(dueTime):'시간 없음'}" onclick="openTimePicker('rq-due-time')"/></div>
        </div>
      </div>
      <div class="add-flow-card add-what-card">
        <div class="add-step-head"><span>WHAT</span><b>무엇을</b></div>
        <input class="mi add-title-input" id="rq-ti" placeholder="무엇을 부탁할까요?" value="${r?escapeAttr(r.title):''}"/>
      </div>
      <details class="detail-settings">
        <summary>메모, 해결 설정</summary>
        <div class="detail-settings-panel">
          ${r&&isDone(r)?`<div class="ml">해결일</div><input class="picker-field${r.doneAt?'':' empty'}" id="rq-done" readonly data-val="${r.doneAt||''}" value="${r.doneAt?dateLabel(r.doneAt):'해결일 없음'}" onclick="openDatePicker('rq-done')"/>`:''}
          <div class="ml">메모</div>
          <textarea class="ta" id="rq-cm" placeholder="진행 상황이나 메모를 적어주세요">${r?escapeHtml(r.comment||''):''}</textarea>
        </div>
      </details>
      <button class="primary-btn" onclick="saveReq('${r?r.id:''}')">저장</button>
      <button class="cancel-link" onclick="closeM()">취소</button>
    </div>
  </div>`;
}
function openTodoRequestDatePicker(){
  const main=document.getElementById('rq-date');
  const view=document.getElementById('rq-date-view');
  if(main&&view)main.dataset.val=view.dataset.val||main.dataset.val||todayKey();
  openDatePicker('rq-date-view');
}
function openEditReq(id){openReqModal(id)}
function saveReq(id){
  if(!requireEditMode())return;
  const title=(document.getElementById('rq-ti')||{}).value||'';
  if(!title.trim()){
    alert('부탁 이름을 먼저 적어주세요!');
    return;
  }
  const writer=((document.getElementById('rq-writer-mode')||{}).value||requestWriterOptions()[0]||'공통').trim();
  const comment=(document.getElementById('rq-cm')||{}).value||'';
  const requestDate=getPickerVal('rq-date-view')||getPickerVal('rq-date')||todayKey();
  const dueDate=getPickerVal('rq-due-date');
  const dueTime=getPickerVal('rq-due-time');
  let r=null;
  if(id){
    r=requests.find(x=>String(x.id)===String(id)); if(!r)return;
    const oldTitle=r.title;
    r.title=title.trim(); r.writer=writer; r.comment=comment; r.requestDate=requestDate; r.dueDate=dueDate; r.dueTime=dueTime;
    if(document.getElementById('rq-done'))r.doneAt=getPickerVal('rq-done');
    addChangeLog(`부탁 수정: ${oldTitle||r.title} → ${r.title}`);
    showToast('부탁을 저장했어요 👏');
  }else{
    r={id:Date.now(),title:title.trim(),writer,requestDate,dueDate,dueTime,done:false,doneAt:'',comment};
    requests.push(r);
    addChangeLog(`부탁 추가: ${r.title}`);
    showToast('부탁을 등록했어요 👏');
  }
  saveRequestOnly(r);closeM();render({preserveScroll:true});
}


function delMemory(id){
  if(!requireEditMode())return;
  const idx=memories.findIndex(x=>String(x.id)===String(id));
  if(idx>=0)softDelete('memory',memories,idx,'축하를');
}
function memoryUpcomingDiff(x){
  if(!x||!x.birth)return Number.POSITIVE_INFINITY;
  const nb=nextBirthInfo(x.birth,memoryCalendarType(x)==='lunar');
  if(!nb.date)return Number.POSITIVE_INFINITY;
  const diff=Math.ceil((new Date(nb.date+'T00:00:00')-new Date(todayKey()+'T00:00:00'))/86400000);
  return diff<0?Number.POSITIVE_INFINITY:diff;
}
function sortedMemoriesForDisplay(){
  return [...memories].sort((a,b)=>{
    const da=memoryUpcomingDiff(a), db=memoryUpcomingDiff(b);
    if(da!==db)return da-db;
    return String(a?.name||'').localeCompare(String(b?.name||''),'ko');
  });
}

function memoryDdayClass(dday){
  if(!dday)return '';
  if(dday==='D-Day')return ' due-now';
  const m=String(dday).match(/^D-([0-9]+)$/);
  if(!m)return ' far';
  const n=Number(m[1]);
  if(n<=7)return ' due-soon';
  if(n<=30)return ' due-month';
  if(n<=100)return ' due-later';
  return ' far';
}
function memoryEventKind(x){
  const title=String(x?.name||'');
  if(title.includes('결혼'))return {icon:'💍',label:'결혼기념일'};
  if(title.includes('생일')||title.includes('탄생'))return {icon:'🎂',label:'생일'};
  return {icon:memoryIcon(x)||'🎉',label:title||'기념일'};
}
function makeMemoryCard(x){
  const calType=memoryCalendarType(x);
  const isLunar=calType==='lunar';
  const nb=nextBirthInfo(x.birth,isLunar);
  const ageLabel=memoryAgeLabel(x);
  const upcomingFullLabel=nb.date?fullDateWithDow(nb.date):'';
  const birthFullLabel=x.birth?fullDateWithDow(x.birth):'';
  const subject=memoryDisplaySubject(x);
  return `<div class="card mem-card reorder-card swipe-card"
    draggable="true"
    data-reorder-list="memories" data-reorder-id="${x.id}"
    ondragstart="dragStart(event,'memories','${x.id}')"
    ondragover="dragOver(event)"
    ondrop="dropItem(event,'memories','${x.id}')"
    ondragend="dragEnd(event)"
    ontouchstart="startItemSwipe(event,'memory','${x.id}')" ontouchmove="moveItemSwipe(event)" ontouchend="endItemSwipe(event)"
    onmousedown="startItemSwipe(event,'memory','${x.id}')" onmousemove="moveItemSwipe(event)" onmouseup="endItemSwipe(event)" onmouseleave="endItemSwipe(event)">
    <div class="swipe-bg swipe-bg-left"></div>
    <div class="c-row memory-row memory-row-v2" onclick="if(!consumeSwipeTap())openMemoryModal('${x.id}')" style="cursor:pointer">
      <div class="memory-card-icon memory-display-avatar">${memoryDisplayAvatarHtml(x,'avatar-img')}</div>
      <div class="memory-body-grid memory-body-grid-v2">
        <div class="memory-info-col">
          <div class="memory-title-line-v2"><span class="memory-title-text">${escapeHtml(x.name)}</span>${upcomingFullLabel?`<span class="memory-title-dot">·</span><span class="memory-upcoming-inline">${escapeHtml(upcomingFullLabel)}</span>`:''}</div>
          <div class="memory-sub-text">
            ${x.birth ? `${escapeHtml(ageLabel)} · ${escapeHtml(birthFullLabel)}${isLunar?'(음)':'(양)'}` : ''}
            ${subject&&subject!=='공통'?`<span class="memory-subject-mini"> · ${escapeHtml(subject)}</span>`:''}
          </div>
        </div>
        <div class="memory-date-col memory-date-col-v2">
          ${x.birth ? `<div class="modern-dday-badge memory-dday-standard">${escapeHtml(nb.dday)}</div>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}
function makeMemoryCard(x){
  const calType=memoryCalendarType(x);
  const isLunar=calType==='lunar';
  const nb=nextBirthInfo(x.birth,isLunar);
  const ageLabel=memoryAgeLabel(x);
  const upcomingFullLabel=nb.date?fullDateWithDow(nb.date):'';
  const subject=memoryDisplaySubject(x);
  const kind=memoryEventKind(x);
  const ddayClass=memoryDdayClass(nb.dday);
  const calChip=isLunar?'음력':'양력';
  return `<div class="card mem-card reorder-card swipe-card memory-feed-card"
    draggable="true"
    data-reorder-list="memories" data-reorder-id="${x.id}"
    ondragstart="dragStart(event,'memories','${x.id}')"
    ondragover="dragOver(event)"
    ondrop="dropItem(event,'memories','${x.id}')"
    ondragend="dragEnd(event)"
    ontouchstart="startItemSwipe(event,'memory','${x.id}')" ontouchmove="moveItemSwipe(event)" ontouchend="endItemSwipe(event)"
    onmousedown="startItemSwipe(event,'memory','${x.id}')" onmousemove="moveItemSwipe(event)" onmouseup="endItemSwipe(event)" onmouseleave="endItemSwipe(event)">
    <div class="swipe-bg swipe-bg-left"></div>
    <div class="c-row memory-row memory-row-v3" onclick="if(!consumeSwipeTap())openMemoryModal('${x.id}')" style="cursor:pointer">
      <div class="memory-card-icon memory-display-avatar memory-avatar-v3">${memoryDisplayAvatarHtml(x,'avatar-img')}</div>
      <div class="memory-body-grid memory-body-grid-v3">
        <div class="memory-info-col memory-info-v3">
          <div class="memory-event-line">
            <span class="memory-event-kind">${escapeHtml(kind.icon)} ${escapeHtml(kind.label)}</span>
            ${subject&&subject!=='공통'&&subject!=='怨듯넻'?`<span class="memory-title-dot">·</span><span class="memory-subject-name" style="color:${familyAccentColor(subject)}">${escapeHtml(subject)}</span>`:''}
          </div>
          <div class="memory-date-line">${upcomingFullLabel?escapeHtml(upcomingFullLabel):'날짜 없음'}</div>
          <div class="memory-helper-line">
            ${ageLabel?`<span>${escapeHtml(ageLabel)}</span>`:''}
            ${x.birth?`<span>${escapeHtml(calChip)}</span>`:''}
          </div>
        </div>
        <div class="memory-date-col memory-date-col-v3">
          ${x.birth ? `<div class="modern-dday-badge memory-dday-standard memory-dday-v3${ddayClass}">${escapeHtml(nb.dday)}</div>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}
function noopSection(){}
let memoryOpen=true;
function toggleMemory(){memoryOpen=!memoryOpen;render({preserveScroll:true});}

function renderM(){
  const memList=sortedMemoriesForDisplay();
  const body=memoryOpen
    ? `<div class="card-wrap memory-card-wrap">${memList.length?memList.map(makeMemoryCard).join(''):renderEmptyState('generic','축하할 날이 없어요','생일, 축하, 여행의 순간을 예쁘게 기록해 보세요.')}</div>`
    : `<div class="schedule-collapsed-hint warm-collapsed-hint">축하 목록을 잠시 접어뒀어요.</div>`;
  return`
    ${sectionHeader('축하',memories.length,memoryOpen,'toggleMemory')}
    ${memoryOpen?`<div class="memory-www-head"><div class="memory-www-title">WWW CELEBRATION</div><div class="memory-www-sub">가족의 특별한 날</div></div>`:''}
    ${body}
  `;
}
function openMemoryModal(id){
  const x=id?memories.find(v=>String(v.id)===String(id)):null;
  const icon=x?memoryIcon(x):'🎂';
  const calType=x?memoryCalendarType(x):'solar';
  const displayMode=x?memoryDisplayMode(x):'icon';
  const linkedPerson=(x&&x.linkedPerson)||memoryPerson(x)||((getPersons().filter(p=>p!=='공통')[0])||'');
  const subjectName=(x&&x.subjectName)||'';
  const subjectAvatar=(x&&x.subjectAvatar)||'seniorF_1';
  const subjectColor=(x&&x.subjectColor)||'#A2845E';
  const linkedPeople=getPersons().filter(p=>p!=='공통');
  const subjectAvatars=[...avatarItems('seniorF'),...avatarItems('seniorM')];
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">${x?'축하 수정':'축하 추가'}</div>
      <div class="ml">표시 방식</div>
      <input type="hidden" id="mem-display-mode" value="${escapeAttr(displayMode)}"/>
      <div class="type-sel memory-display-mode-sel" style="margin-bottom:8px">
        <button class="type-btn memory-display-mode-btn${displayMode==='icon'?' tf':''}" data-mode="icon" onclick="selectMemoryDisplayMode('icon')">아이콘</button>
        <button class="type-btn memory-display-mode-btn${displayMode==='linked'?' tf':''}" data-mode="linked" onclick="selectMemoryDisplayMode('linked')">가족 연결</button>
        <button class="type-btn memory-display-mode-btn${displayMode==='direct'?' tf':''}" data-mode="direct" onclick="selectMemoryDisplayMode('direct')">직접 입력</button>
      </div>

      <div id="mem-icon-panel" style="display:${displayMode==='icon'?'block':'none'}">
        <div class="ml">아이콘</div>
        <input type="hidden" id="mem-icon" value="${escapeAttr(icon)}"/>
        <div class="memory-icon-grid">
          ${MEMORY_ICONS.map(ic=>`<button class="memory-icon-btn${ic===icon?' on':''}" data-icon="${escapeAttr(ic)}" onclick="selectMemoryIcon('${ic}')">${ic}</button>`).join('')}
        </div>
      </div>

      <div id="mem-linked-panel" style="display:${displayMode==='linked'?'block':'none'}">
        <div class="ml">가족 대상 연결</div>
        <input type="hidden" id="mem-linked-person" value="${escapeAttr(linkedPerson)}"/>
        <div class="type-sel person-chip-selector memory-linked-selector">
          ${linkedPeople.length?linkedPeople.map(p=>`<button type="button" class="person-check-label mem-linked-person-btn${p===linkedPerson?' selected':''}" data-person="${escapeAttr(p)}" onclick="selectMemoryLinkedPerson(${onclickArg(p)})">${avatarMarkup(personAvatar(p),p,'avatar-img-small')}<span>${escapeHtml(p)}</span></button>`).join(''):'<div class="empty compact-empty">연결할 가족 대상이 없어요</div>'}
        </div>
      </div>

      <div id="mem-direct-panel" style="display:${displayMode==='direct'?'block':'none'}">
        <div class="ml">표시 인물 이름</div>
        <input class="mi" id="mem-subject-name" placeholder="예: 할머니, 할아버지, 친구" value="${escapeAttr(subjectName)}"/>
        <div class="ml">표시 인물 이미지</div>
        <input type="hidden" id="mem-subject-avatar" value="${escapeAttr(subjectAvatar)}"/>
        <div class="memory-subject-avatar-grid">
          ${subjectAvatars.map(av=>`<button type="button" class="avatar-choice mem-subject-avatar-btn${av===subjectAvatar?' on':''}" data-avatar="${escapeAttr(av)}" onclick="selectMemorySubjectAvatar(${onclickArg(av)})">${avatarMarkup(av,av,'avatar-img')}</button>`).join('')}
        </div>
        <div class="ml">표시 색상</div>
        <input type="hidden" id="mem-subject-color" value="${escapeAttr(subjectColor)}"/>
        <div class="kid-color-choice-row memory-subject-color-row">
          ${PERSON_COLOR_PALETTE.map(c=>`<button type="button" class="color-choice mem-subject-color-choice${c===subjectColor?' on':''}" data-color="${escapeAttr(c)}" onclick="selectMemorySubjectColor('${escapeAttr(c)}')" style="background:${c}"></button>`).join('')}
        </div>
        <div class="memory-direct-note">직접 입력 인물은 일정·부탁·상태 대상자에는 추가되지 않고, 축하 탭과 달력 축하 표시에만 사용돼요.</div>
      </div>

      <div class="ml">날짜 방식</div>
      <input type="hidden" id="mem-cal" value="${escapeAttr(calType)}"/>
      <div class="type-sel" style="margin-bottom:8px">
        <button class="type-btn${calType==='solar'?' tf':''}" id="mem-solar" onclick="selectMemoryCal('solar')">양력</button>
        <button class="type-btn${calType==='lunar'?' tf':''}" id="mem-lunar" onclick="selectMemoryCal('lunar')">음력</button>
      </div>
      <div class="ml">축하 이름</div>
      <input class="mi" id="mem-name" placeholder="예: 도미 생일, 할머니 생신, 결혼축하" value="${x?escapeAttr(x.name):''}"/>
      <div class="ml">날짜</div>
      <input class="picker-field${x&&x.birth?'':' empty'}" id="mem-birth" readonly data-val="${x&&x.birth?x.birth:''}" value="${x&&x.birth?dateLabel(x.birth):'날짜 선택'}" onclick="openBirthPicker('mem-birth')"/>
      <div class="ml">메모</div>
      <textarea class="ta" id="mem-memo" placeholder="선물, 좋아하는 것, 참고할 내용">${x?escapeHtml(x.memo||''):''}</textarea>
      <button class="primary-btn" onclick="saveMemory('${x?x.id:''}')">저장</button>
      <button class="cancel-link" onclick="closeM()">취소</button>
    </div>
  </div>`;
}
function saveMemory(id){
  if(!requireEditMode())return;

  const name=(document.getElementById('mem-name')||{}).value||'';
  if(!name.trim())return;
  const birth=getPickerVal('mem-birth');
  const memo=(document.getElementById('mem-memo')||{}).value||'';
  const icon=(document.getElementById('mem-icon')||{}).value||'🎂';
  const displayMode=(document.getElementById('mem-display-mode')||{}).value||'icon';
  const linkedPerson=displayMode==='linked'?((document.getElementById('mem-linked-person')||{}).value||''):'';
  const subjectName=displayMode==='direct'?(((document.getElementById('mem-subject-name')||{}).value||'').trim()):'';
  const subjectAvatar=displayMode==='direct'?(((document.getElementById('mem-subject-avatar')||{}).value)||'seniorF_1'):'';
  const subjectColor=displayMode==='direct'?(((document.getElementById('mem-subject-color')||{}).value)||'#A2845E'):'';
  const lunarBtn=document.getElementById('mem-lunar');
  const isLunar=lunarBtn?lunarBtn.classList.contains('tf'):((document.getElementById('mem-cal')||{}).value==='lunar');
  const calendarType=isLunar?'lunar':'solar';
  const lunar=isLunar;
  const payload={name:name.trim(),birth,memo,icon,isLunar,calendarType,lunar,displayMode,linkedPerson,subjectName,subjectAvatar,subjectColor};
  if(id){
    const x=memories.find(v=>String(v.id)===String(id)); if(!x)return;
    Object.assign(x,payload);
  }else{
    memories.push({id:Date.now(),...payload});
  }
  saveSettingsOnly();closeM();render();
}


let dragInfo=null;

function dragStart(e, listName, id){
  if(e.target && e.target.closest && e.target.closest('input,select,button,textarea'))return;
  dragInfo={listName,id};
  e.currentTarget.classList.add('dragging');
  if(e.dataTransfer){
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain', id);
  }
}
function dragOver(e){
  e.preventDefault();
  if(e.currentTarget)e.currentTarget.classList.add('drop-target');
  if(e.dataTransfer)e.dataTransfer.dropEffect='move';
}
function dragEnd(e){
  if(e&&e.currentTarget)e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
  dragInfo=null;
}
function dropItem(e, listName, targetId){
  e.preventDefault();
  if(e.currentTarget)e.currentTarget.classList.remove('drop-target');
  if(!dragInfo || dragInfo.listName!==listName || String(dragInfo.id)===String(targetId)) return;
  reorderListItem(listName,dragInfo.id,targetId);
}



let toastTimer=null;
function toastRoot(){
  let t=document.getElementById('toast-root') || window.__toastRoot;
  if(!t){
    t=document.createElement('div');
    t.id='toast-root';
    t.className='toast-wrap';
    document.body.appendChild(t);
  }
  window.__toastRoot=t;
  return t;
}
function showToast(msg, actionText='', actionFn=null, ms=3200){
  clearTimeout(toastTimer);
  const root=toastRoot();
  root.innerHTML=`<div class="toast">
    <div class="toast-msg">${escapeHtml(msg)}</div>
    ${actionFn?`<button class="toast-btn" id="toast-action">${escapeHtml(actionText||'실행 취소')}</button>`:''}
  </div>`;
  if(actionFn){
    document.getElementById('toast-action').onclick=()=>{
      clearTimeout(toastTimer);
      root.innerHTML='';
      actionFn();
    };
  }
  toastTimer=setTimeout(()=>{root.innerHTML=''},ms);
}
function undoTrashById(trashId,kind,insertIndex){
  const ti=deletedItems.findIndex(x=>String(x.id)===String(trashId));
  if(ti<0)return;
  const x=deletedItems[ti];
  deletedItems.splice(ti,1);
  const arr=kind==='note'?notes:kind==='request'?requests:kind==='memory'?memories:kind==='kid'?family:kind==='repeat'?repeatItems:null;
  if(!arr)return;
  if(kind==='kid')unhideBasePerson((x.item||{}).name);
  arr.splice(Math.min(insertIndex,arr.length),0,x.item);
  if(kind==='note')saveNoteOnly(x.item);
  else if(kind==='request')saveRequestOnly(x.item);
  else saveSettingsOnly();
  saveSettingsOnly();
  render({preserveScroll:true});
  showToast('삭제를 취소했어요.');
}
function softDelete(kind,arr,idx,label){
  saveAfterSoftDelete(kind,arr,idx,label);
}

function confirmDelete(msg){
  return true;
}
function normText(v){return String(v||'').toLowerCase().trim()}
function matchSearchNote(n){
  if(!searchQ)return true;
  const q=normText(searchQ);
  return [n.title,n.comment,n.who,typeName(n.type),n.start,n.end,n.sT,n.eT,repeatName(n.repeat||'')].some(v=>normText(v).includes(q));
}
function matchSearchReq(r){
  if(!searchQ)return true;
  const q=normText(searchQ);
  return [r.title,r.writer,r.comment].some(v=>normText(v).includes(q));
}

function applySearch(){
  searchQ=searchDraft.trim();
  render();
}
function clearSearch(){
  searchQ='';
  searchDraft='';
  render();
}
function renderSearchBox(){
  return '';
}


function updateTabUI(){
  const activeMain = main==='i' ? 'set' : main;
  const keys=['s','c','r','m','set'];
  keys.forEach(k=>{
    const el=document.getElementById('tab-'+k);
    if(!el)return;
    const cls=k==='s'?'tab-s':k==='c'?'tab-c':k==='r'?'tab-r':k==='m'?'tab-m':'tab-set';
    const on=k===activeMain;
    el.className=`tab ${cls} tab-item${on?' on active':''}`;
    el.setAttribute('aria-selected',on?'true':'false');
  });
}


function trashItem(kind,item){
  deletedItems.push({id:Date.now()+Math.random(),kind,item:deepCopy(item),deletedAt:Date.now()});
}
function trashKindName(k){
  return k==='note'?'일정':k==='request'?'부탁':k==='memory'?'축하':k==='kid'?'아이정보':'항목';
}
function trashTitle(x){
  const it=x.item||{};
  return it.title||it.name||it.writer||trashKindName(x.kind);
}
function purgeOldTrash(save=true){
  const limit=Date.now()-7*24*60*60*1000;
  const before=deletedItems.length;
  deletedItems=deletedItems.filter(x=>(x.deletedAt||0)>=limit);
  if(save && before!==deletedItems.length)saveAll();
}
function openTrash(){
  purgeOldTrash(false);
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">휴지통</div>
      ${deletedItems.length?deletedItems.map(x=>`<div class="trash-item">
        <div class="trash-title">[${trashKindName(x.kind)}] ${escapeHtml(trashTitle(x))}</div>
        <div class="trash-sub">${new Date(x.deletedAt||Date.now()).toLocaleString()} 삭제됨</div>
        <div class="action-grid">
          <button class="toss-btn primary" onclick="restoreTrash('${x.id}')">복구</button>
          <button class="toss-btn" onclick="deleteTrashForever('${x.id}')">완전 삭제</button>
        </div>
      </div>`).join(''):'<div class="empty">휴지통이 비어 있어요</div>'}
      ${deletedItems.length?`<button class="cancel-link" onclick="emptyTrash()">휴지통 비우기</button>`:''}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function restoreTrash(id){
  if(!requireEditMode())return;

  const idx=deletedItems.findIndex(x=>String(x.id)===String(id));
  if(idx<0)return;
  const x=deletedItems[idx];
  if(x.kind==='note')notes.push(x.item);
  else if(x.kind==='request')requests.push(x.item);
  else if(x.kind==='memory')memories.push(x.item);
  else if(x.kind==='kid'){unhideBasePerson((x.item||{}).name);family.push(x.item);}
  deletedItems.splice(idx,1);
  saveAll();openTrash();render();
}
function deleteTrashForever(id){
  if(!requireEditMode())return;

  
  deletedItems=deletedItems.filter(x=>String(x.id)!==String(id));
  saveAll();openTrash();
}
function emptyTrash(){
  autoBackupBefore('휴지통 비우기 전');

  if(!requireEditMode())return;

  
  deletedItems=[];
  saveAll();openTrash();
}
function repairData(){
  autoBackupBefore('데이터 점검 전');

  if(!requireEditMode())return;
  const validTypes=['family','personal','work'];
  const validRepeats=['','daily','weekly','monthly'];
  const validShifts=['',...shiftLabelList()];
  const isDate=v=>!v || /^\d{4}-\d{2}-\d{2}$/.test(v);
  const seen=new Set();
  let fixed=0;

  notes=Array.isArray(notes)?notes:[];
  requests=Array.isArray(requests)?requests:[];
  memories=Array.isArray(memories)?memories:[];
  notices=Array.isArray(notices)?notices:[];
  family=Array.isArray(family)?family:[];
  deletedItems=Array.isArray(deletedItems)?deletedItems:[];
  shiftData=shiftData&&typeof shiftData==='object'?shiftData:{};

  notes.forEach(n=>{
    if(!n.id || seen.has('n'+n.id)){n.id=Date.now()+Math.random();fixed++}
    seen.add('n'+n.id);
    if(!n.title){n.title='제목 없는 일정';fixed++}
    if(!n.who){n.who='공통';fixed++}
    if(!validTypes.includes(n.type)){n.type='family';fixed++}
    if(!validRepeats.includes(n.repeat)){n.repeat='';fixed++}
    if(!Array.isArray(n.skipDates)){n.skipDates=[];fixed++}
    n.skipDates=n.skipDates.filter(isDate);
    if(!isDate(n.start)){n.start='';fixed++}
    if(!isDate(n.end)){n.end='';fixed++}
    if(!isDate(n.repeatEnd)){n.repeatEnd='';fixed++}
    if(!n.alertMemo)n.alertMemo='';
    if(!('done' in n))n.done=false;
  });

  requests.forEach(r=>{
    if(!r.id || seen.has('r'+r.id)){r.id=Date.now()+Math.random();fixed++}
    seen.add('r'+r.id);
    if(!r.title){r.title='제목 없는 부탁';fixed++}
    if(!r.dueDate)r.dueDate='';
    if(!r.dueTime)r.dueTime='';
    if(!('done' in r))r.done=false;
  });

  memories.forEach(m=>{
    if(!m.id || seen.has('m'+m.id)){m.id=Date.now()+Math.random();fixed++}
    seen.add('m'+m.id);
    if(!m.name){m.name='이름 없음';fixed++}
    if(!isDate(m.birth)){m.birth='';fixed++}
  });

  notices.forEach(n=>{
    if(!n.id || seen.has('nt'+n.id)){n.id=Date.now()+Math.random();fixed++}
    seen.add('nt'+n.id);
    if(!n.title){n.title='가족 공지';fixed++}
    if(!('read' in n))n.read=false;
    if(!('important' in n))n.important=false;
    if(!n.createdAt)n.createdAt=Date.now();
  });

  Object.keys(shiftData).forEach(k=>{
    const val=shiftData[k];
    if(!isDate(k)){delete shiftData[k];fixed++;return;}
    if(typeof val==='string'){
      if(val && !validShifts.includes(val)){delete shiftData[k];fixed++}
      return;
    }
    if(isShiftObject(val)){
      Object.keys(val).forEach(user=>{
        if(val[user] && !validShifts.includes(val[user])){delete val[user];fixed++}
      });
      if(!Object.keys(val).length)delete shiftData[k];
    }
  });

  purgeOldTrash(false);
  saveAll();render();
  alert(`데이터 점검 완료${fixed?` · 보정 ${fixed}건`:''}`);
}
function copyNote(id){
  if(!requireEditMode())return;
  const n=notes.find(x=>String(x.id)===String(id)); if(!n)return;
  const c=deepCopy(n);
  c.id=Date.now();
  c.title=(c.title||'일정')+' 복사';
  c.done=false;
  notes.push(c);
  saveNoteOnly(c);render({preserveScroll:true});
  showToast('일정을 복사했어요. 필요하면 날짜를 수정하세요.');
}
let longAddTimer=null,longAddOpened=false;
function startLongAdd(e,k){
  longAddOpened=false;
  clearTimeout(longAddTimer);
  longAddTimer=setTimeout(()=>{longAddOpened=true;openAddModal(k);},650);
}
function cancelLongAdd(){
  clearTimeout(longAddTimer);
  setTimeout(()=>{longAddOpened=false;},80);
}
function notesForCalendarDay(y,m,d){
  return notesOnDateAll(y,m,d);
}
function openRepeatExceptions(id){
  const n=notes.find(x=>String(x.id)===String(id)); if(!n)return;
  const arr=Array.isArray(n.skipDates)?n.skipDates:[];
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">반복 예외</div>
      <div style="font-size:13px;color:var(--t2);line-height:1.45">${escapeHtml(n.title)}에서 이번 회차만 삭제한 날짜 목록입니다.</div>
      ${arr.length?arr.sort().map(k=>`<div class="trash-item">
        <div class="trash-title">${dateLabel(k)}</div>
        <div class="action-grid"><button class="toss-btn primary" onclick="restoreRepeatException('${n.id}','${k}')">복구</button></div>
      </div>`).join(''):'<div class="empty">등록된 예외가 없어요</div>'}
      <button class="cancel-link" onclick="openDetailNote('${n.id}')">돌아가기</button>
    </div>
  </div>`;
}
function restoreRepeatException(id,k){
  if(!requireEditMode())return;
  const n=notes.find(x=>String(x.id)===String(id)); if(!n)return;
  n.skipDates=(n.skipDates||[]).filter(x=>x!==k);
  saveNoteOnly(n);openRepeatExceptions(id);render({preserveScroll:true});
}





function clearShiftData(){
  if(!requireEditMode())return;
  const cnt=Object.keys(shiftData||{}).length;
  if(!cnt){
    alert('초기화할 상태 데이터가 없어요.');
    return;
  }
  if(!confirm(`상태표 데이터 ${cnt}일치를 모두 초기화할까요?`))return;
  autoBackupBefore('상태표 전체 초기화 전');
  shiftData={};
  saveAll();
  render();
  alert('상태표 전체 초기화 완료');
}

function prunePastShiftData(){
  if(!requireEditMode())return;
  const today=todayKey();
  const keys=Object.keys(shiftData||{}).filter(k=>k<today);
  if(!keys.length){
    alert('정리할 과거 상태 데이터가 없어요.');
    return;
  }
  if(!confirm(`오늘 이전 상태 데이터 ${keys.length}일치를 정리할까요?`))return;
  autoBackupBefore('과거 상태 정리 전');
  keys.forEach(k=>delete shiftData[k]);
  saveAll();
  render();
  alert('과거 상태 데이터 정리 완료');
}


function autoBackupBefore(label){
  try{
    const key=SK.data+'_auto_backups';
    const list=JSON.parse(localStorage.getItem(key)||'[]');
    list.unshift({label,time:new Date().toISOString(),data:currentData()});
    localStorage.setItem(key,JSON.stringify(list.slice(0,5)));
  }catch(e){console.warn(e)}
}
function openAutoBackups(){
  let list=[];
  try{list=JSON.parse(localStorage.getItem(SK.data+'_auto_backups')||'[]')}catch(e){}
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">자동 백업</div>
      ${list.length?list.map((b,i)=>`<div class="trash-item">
        <div class="trash-title">${escapeHtml(b.label||'백업')}</div>
        <div class="trash-sub">${new Date(b.time||Date.now()).toLocaleString()}</div>
        <div class="action-grid"><button class="toss-btn primary" onclick="restoreAutoBackup(${i})">복구</button></div>
      </div>`).join(''):'<div class="empty">자동 백업이 없어요</div>'}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function restoreAutoBackup(i){
  if(!requireEditMode())return;
  let list=[];
  try{list=JSON.parse(localStorage.getItem(SK.data+'_auto_backups')||'[]')}catch(e){}
  const b=list[i]; if(!b||!b.data)return;
  if(!confirm('이 자동 백업으로 복구할까요?'))return;
  normalizeData(b.data);
  saveAll();closeM();render();
}

function openDiagnostics(){
  const dataStr=JSON.stringify(currentData());
  const sw=('serviceWorker' in navigator)?(navigator.serviceWorker.controller?'등록됨':'지원됨/대기중'):'미지원';
  const localSize=(dataStr.length/1024).toFixed(1)+' KB';
  const shiftCnt=Object.keys(shiftData||{}).filter(k=>shiftData[k]).length;
  const last=currentData().updatedAt?new Date(currentData().updatedAt).toLocaleString():'-';
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">앱 진단</div>
      <div class="detail-row"><span class="detail-key">현재 방</span><span class="detail-val">${escapeHtml(roomId)}</span></div>
      <div class="detail-row"><span class="detail-key">Firebase</span><span class="detail-val">${remoteReady?'연결됨':(window.__firebaseReady?'준비됨':'로컬 모드')}</span></div>
      <div class="detail-row"><span class="detail-key">편집 모드</span><span class="detail-val">${isEditMode()?'켜짐':'꺼짐'}</span></div>
      <div class="detail-row"><span class="detail-key">Service Worker</span><span class="detail-val">${sw}</span></div>
      <div class="detail-row"><span class="detail-key">앱 버전</span><span class="detail-val">${APP_VERSION}</span></div>
      <div class="detail-row"><span class="detail-key">저장 구조</span><span class="detail-val">하위 컬렉션</span></div>
      <div class="detail-row"><span class="detail-key">로컬 데이터</span><span class="detail-val">${localSize}</span></div>
      <div class="detail-row"><span class="detail-key">상태 데이터</span><span class="detail-val">${shiftCnt}개</span></div>
      <div class="detail-row"><span class="detail-key">공휴일 캐시</span><span class="detail-val">${Object.keys(holidayCache||{}).length}개</span></div>
      <div class="detail-row"><span class="detail-key">마지막 저장</span><span class="detail-val">${last}</span></div>
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
async function clearAppCache(){
  if(!confirm('앱 캐시를 초기화하고 새로고침할까요?'))return;
  try{
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
    if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
  }catch(e){console.warn(e)}
  location.reload();
}





function toggleShiftSelectMode(){
  if(!requireEditMode())return;
  shiftSelectMode=!shiftSelectMode;
  shiftSelectedDates=[];
  selDate=null;
  if(shiftSelectMode)calViewMode='work';
  render();
  if(shiftSelectMode){
    try{showToast('날짜를 여러 개 선택한 뒤 상태 버튼을 눌러 주세요.')}catch(e){}
  }
}
function toggleShiftDate(k){
  const idx=shiftSelectedDates.indexOf(k);
  if(idx>=0)shiftSelectedDates.splice(idx,1);
  else shiftSelectedDates.push(k);
  shiftSelectedDates.sort();
  render();
}
function clearShiftSelected(){
  shiftSelectedDates=[];
  render();
}
function applyBulkShift(t){
  if(!requireEditMode())return;
  if(!shiftSelectedDates.length){
    alert('상태를 입력할 날짜를 선택해 주세요.');
    return;
  }
  normalizeShiftUsers();
  const user=shiftBulkUser || firstShiftUser();
  const label=t===SHIFT_DEFAULT?'기본값으로':(t===SHIFT_NONE?'오늘만 미입력':(t||'미입력'));
  if(!confirm(`${escapeHtml(user)}의 선택 날짜 ${shiftSelectedDates.length}개를 ${label}(으)로 변경할까요?`))return;
  autoBackupBefore('상태 일괄 입력 전');

  shiftSelectedDates.forEach(k=>{
    if(!shiftData[k]||typeof shiftData[k]==='string')shiftData[k]={};
    if(t===SHIFT_DEFAULT){
      delete shiftData[k][user];
    }else if(t===SHIFT_NONE){
      shiftData[k][user]=SHIFT_NONE;
    }else if(t){
      shiftData[k][user]=t;
    }else{
      delete shiftData[k][user];
    }
    if(shiftData[k] && !Object.keys(shiftData[k]).length)delete shiftData[k];
  });

  saveAll();

  const cnt=shiftSelectedDates.length;
  shiftSelectedDates=[];
  shiftSelectMode=false;
  render();
  showToast(`${user}의 ${cnt}개 날짜 상태를 변경했어요.`);
}
function renderShiftBulkBar(){
  if(!isEditMode() || !shiftSelectMode)return '';
  normalizeShiftUsers();
  if(!shiftBulkUser || !shiftUsers.includes(shiftBulkUser))shiftBulkUser=firstShiftUser();
  const labels=shiftPersonLabelList(shiftBulkUser);
  return `<div class="shift-bulk-bar selecting compact-bulk-bar">
    <div class="shift-bulk-actions multi-bulk-actions">
      <span class="shift-bulk-count">선택 ${shiftSelectedDates.length}개</span>
      <select class="shift-bulk-user-select" onchange="shiftBulkUser=this.value;render({preserveScroll:true})">
        ${shiftUsers.map(u=>`<option value="${escapeAttr(u)}" ${shiftBulkUser===u?'selected':''}>${escapeHtml(u)}</option>`).join('')}
      </select>
      ${labels.map(s=>`<button class="shift-bulk-chip ${shiftBadgeClass(s)}" onclick="applyBulkShift(${onclickArg(s)})">${escapeHtml(s)}</button>`).join('')}
      <button class="shift-bulk-chip clear" onclick="applyBulkShift(SHIFT_DEFAULT)">기본값</button>
      <button class="shift-bulk-chip clear" onclick="applyBulkShift(SHIFT_NONE)">미입력</button>
      <button class="shift-bulk-chip clear" onclick="toggleShiftSelectMode()">취소</button>
    </div>
  </div>`;
}

function openHolidayManager(){
  const list=[...(customHolidays||[])].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">공휴일 관리</div>
      <div class="ml">날짜</div>
      <input class="picker-field empty" id="hol-date" readonly data-val="" value="날짜 선택" onclick="openDatePicker('hol-date')"/>
      <div class="ml">공휴일 이름</div>
      <input class="mi" id="hol-name" placeholder="예: 우리 가족 축하"/>
      <button class="primary-btn" onclick="saveCustomHoliday()">추가</button>
      <div class="div"></div>
      ${list.length?list.map(h=>`<div class="trash-item">
        <div class="trash-title">${dateLabel(h.date)} · ${escapeHtml(h.name)}</div>
        <div class="action-grid"><button class="toss-btn" onclick="delCustomHoliday('${h.id}')">삭제</button></div>
      </div>`).join(''):'<div class="empty">추가한 공휴일이 없어요</div>'}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function saveCustomHoliday(){
  if(!requireEditMode())return;
  const date=getPickerVal('hol-date');
  const name=(document.getElementById('hol-name')||{}).value||'';
  if(!date||!name.trim())return alert('날짜와 이름을 입력해 주세요.');
  customHolidays.push({id:Date.now(),date,name:name.trim()});
  saveSettingsOnly();openHolidayManager();render();
}
function delCustomHoliday(id){
  if(!requireEditMode())return;
  
  customHolidays=customHolidays.filter(h=>String(h.id)!==String(id));
  saveSettingsOnly();openHolidayManager();render();
}

function copyNoteWithDate(id){
  const n=notes.find(x=>String(x.id)===String(id)); if(!n)return;
  const def=n.start||todayKey();
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">다른 날짜에 복사</div>
      <div class="ml">새 날짜</div>
      <input class="picker-field" id="copy-date" readonly data-val="${def}" value="${dateLabel(def)}" onclick="openDatePicker('copy-date')"/>
      <button class="primary-btn" onclick="saveCopyNoteWithDate('${id}')">복사하기</button>
      <button class="cancel-link" onclick="openEditNote('${id}')">수정으로 돌아가기</button>
    </div>
  </div>`;
}
function saveCopyNoteWithDate(id){
  if(!requireEditMode())return;
  const n=notes.find(x=>String(x.id)===String(id)); if(!n)return;
  const date=getPickerVal('copy-date')||todayKey();
  const c=deepCopy(n);
  c.id=Date.now();
  c.title=(c.title||'일정')+' 복사';
  c.start=date;
  c.end='';
  c.done=false;
  notes.push(c);
  saveNoteOnly(c);closeM();render({preserveScroll:true});
}

function setMain(t){
  if(t==='s')refreshEmptyStatePick('all');
  if(t==='r')refreshEmptyStatePick('request');
  if(main!==t){searchQ='';searchDraft='';}
  filterToday=false;
  if(t==='c')syncCalendarDateContext(scheduleBaseKey());
  main=t;
  updateTabUI();
  render({preserveScroll:false});
  try{window.scrollTo(0,0)}catch(e){}
}
function openActiveRequestTab(){
  requestOpen=true;
  requestDoneOpen=false;
  doneF='all';
  setMain('r');
}




function onWidgetClick(el){
  const action = el?.dataset?.action || '';
  if(action==='today'){
    main='s';
    subF='all';
    searchQ='';
    searchDraft='';
    filterToday=true;
    updateTabUI();
    render();
    return;
  }
  if(action==='request'){
    setMain('r');
    return;
  }
}




function shortShiftLabel(status){
  const s=String(status||'').trim();
  if(!s)return '-';
  const upper=s.toUpperCase();
  if(upper==='OFF' || upper==='O')return 'OFF';
  if(s.includes('연차') || s.includes('반차') || s.includes('휴'))return '휴';
  return Array.from(s)[0] || '-';
}
function workCalendarShiftLabel(status){
  const s=String(status||'').trim();
  if(!s)return '-';
  const upper=s.toUpperCase();
  if(upper==='OFF' || upper==='O')return 'OFF';
  return shortShiftLabel(s);
}
function scheduleCountsByPerson(baseKey){
  const items=[
    ...notes.filter(n=>!isDone(n)&&!n._autoFamilyInfo&&occursOn(n,baseKey)),
    ...familyInfoEventsForKey(baseKey)
  ];
  normalizeShiftUsers();
  shiftUsers.forEach(user=>{
    const status=shiftDisplayStatusFor(baseKey,user);
    if(status)items.push({who:user,title:workCalendarShiftLabel(status),_shiftStatus:status});
  });
  if(!items.length)return [];
  const counts={};
  items.forEach(n=>{
    const who=(n&&n.who)||'공통';
    counts[who]=(counts[who]||0)+1;
  });
  const persons=[...getPersons(),...Object.keys(counts)];
  return Object.keys(counts).sort((a,b)=>{
    const ia=persons.indexOf(a), ib=persons.indexOf(b);
    return (ia<0?999:ia)-(ib<0?999:ib);
  }).map(who=>`${who} ${counts[who]}개`);
}
function scheduleCheckCountForDate(baseKey){
  return scheduleCountsByPerson(baseKey).reduce((sum,line)=>{
    const m=String(line||'').match(/(\d+)개/);
    return sum+(m?Number(m[1]):0);
  },0);
}
function calendarMiniButtonSvg(){
  return `<svg class="shift-mini-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="5" width="15" height="15" rx="3"/><path d="M8 3.8v2.8"/><path d="M16 3.8v2.8"/><path d="M4.5 9h15"/><path d="M9 12.2h6"/><path d="M9 15.7h4.2"/></svg>`;
}

function renderNoticeBanner(){
  if(main!=='s')return '';
  const base=scheduleBaseKey ? scheduleBaseKey() : todayKey();
  const req=requests.filter(r=>!isDone(r));
  const due=dueRequestsForDate(base);
  const scheduleParts=scheduleCountsByPerson(base);
  const scheduleCount=scheduleCheckCountForDate(base);
  const parts=[];
  if(scheduleParts.length){
    parts.push(`<button type="button" class="home-status-summary-item" onclick="openScheduleCheckSheet('${base}')" aria-label="일정 ${scheduleCount||scheduleParts.length}개 보기"><span class="home-status-summary-icon">🔔</span><span>일정 ${scheduleCount||scheduleParts.length}</span></button>`);
  }
  if(req.length||due.length){
    parts.push(`<button type="button" class="home-status-summary-item" onclick="openActiveRequestTab()" aria-label="부탁 ${req.length||due.length}개 보기"><span class="home-status-summary-icon">🙏</span><span>부탁 ${req.length||due.length}</span></button>`);
  }
  if(!parts.length)return '';
  return `<div class="notice-banner compact-status-banner home-status-summary" role="group" aria-label="오늘 상태 요약">${parts.join('<span class="home-status-summary-sep">·</span>')}</div>`;
}

function todayScheduleHubItems(baseKey=scheduleBaseKey()){
  const normal=notes.filter(n=>!isDone(n)&&!n.repeat&&!n._autoFamilyInfo&&occursOn(n,baseKey));
  const routine=[
    ...familyInfoEventsForKey(baseKey).map(n=>({...n,_rangeDate:baseKey})),
    ...notes.filter(n=>!isDone(n)&&n.repeat&&occursOn(n,baseKey)).map(n=>({...n,start:baseKey,end:baseKey,_rangeDate:baseKey,_repeatInstance:true}))
  ];
  return {normal,routine};
}

function renderHubMiniGroups(groups,{emptyText='확인할 항목이 없어요'}={}){
  if(!groups.length)return `<div class="hub-empty">${escapeHtml(emptyText)}</div>`;
  return `<div class="hub-mini-list">${groups.map(g=>`
    <div class="hub-mini-person">
      <div class="hub-mini-head">
        ${avatarFrameMarkup(personAvatarConfig(g.who),g.who,'avatarFrame hub-mini-avatar')}
        <b style="color:${familyAccentColor(g.who)}">${escapeHtml(g.who)}</b>
      </div>
      <div class="hub-mini-chips">
        ${g.items.map(item=>`<button type="button" class="www-chip ${item.className||''}" ${item.click?`onclick="event.stopPropagation();${item.click}"`:''}>${item.html}</button>`).join('')}
      </div>
    </div>`).join('')}</div>`;
}

function openScheduleCheckSheet(baseKey=''){
  const k=baseKey||scheduleBaseKey();
  const {normal,routine}=todayScheduleHubItems(k);
  const groups=makeTodayWWWGroups(normal,routine)
    .filter(g=>g.items.length);
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet hub-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="hub-sheet-title">확인할 일정</div>
      <div class="hub-sheet-sub">${escapeHtml(dateLabel(k))}</div>
      ${renderHubMiniGroups(groups,{emptyText:'확인할 일정이 없어요'})}
    </div>
  </div>`;
}

function openTodayInboxSheet(baseKey=''){
  const k=baseKey||scheduleBaseKey();
  const {normal,routine}=todayScheduleHubItems(k);
  const groups=makeTodayWWWGroups(normal,routine).filter(g=>g.items.length);
  const activeRequests=(requests||[]).filter(r=>!isDone(r));
  const upcoming=upcomingEvents(7,k);
  const requestHtml=activeRequests.length?`
    <div class="hub-inbox-section">
      <div class="hub-inbox-section-title">남은 부탁</div>
      <div class="hub-inbox-list">
        ${activeRequests.slice(0,4).map(r=>`<button type="button" class="hub-inbox-row" onclick="openEditReq('${r.id}')">
          <span>${escapeHtml(r.title||'부탁')}</span>
          <em>${escapeHtml(r.dueDate?dateLabel(r.dueDate):'마감 없음')}</em>
        </button>`).join('')}
      </div>
    </div>`:'';
  const upcomingHtml=upcoming.length?`
    <div class="hub-inbox-section">
      <div class="hub-inbox-section-title">다가오는 일정</div>
      <div class="hub-inbox-list">
        ${upcoming.map(n=>`<button type="button" class="hub-inbox-row" onclick="openEditNote('${n.id}')">
          <span>${escapeHtml(n.title||'일정')}</span>
          <em>${escapeHtml(`${dateLabel(n.start||k)} · ${n.who||'가족'}`)}</em>
        </button>`).join('')}
      </div>
    </div>`:'';
  const hasAnything=groups.length||activeRequests.length||upcoming.length;
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet hub-sheet today-inbox-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="hub-sheet-title">오늘 확인할 것</div>
      <div class="hub-sheet-sub">${escapeHtml(dateLabel(k))}</div>
      ${groups.length?`
        <div class="hub-inbox-section">
          <div class="hub-inbox-section-title">오늘 일정</div>
          ${renderHubMiniGroups(groups,{emptyText:'확인할 일정이 없어요'})}
        </div>`:''}
      ${requestHtml}
      ${upcomingHtml}
      ${hasAnything?'':'<div class="hub-empty">오늘 확인할 항목이 없어요.</div>'}
    </div>
  </div>`;
}

function openPersonTodaySheet(who){
  const baseKey=scheduleBaseKey();
  const {normal,routine}=todayScheduleHubItems(baseKey);
  const groups=makeTodayWWWGroups(normal,routine);
  const group=groups.find(g=>g.who===who)||{who,items:[]};
  const reqs=(requests||[]).filter(r=>!isDone(r)&&(r.writer||'공통')===who);
  const reqChips=reqs.slice(0,3).map(r=>({
    kind:'request',
    title:r.title||'부탁',
    className:'request',
    html:`<span class="www-chip-title">부탁 ${escapeHtml(r.title||'부탁')}</span>`,
    click:`openReqModal('${r.id}')`
  }));
  const allItems=[...group.items,...reqChips];
  const sheetGroup={who,items:allItems};
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet hub-sheet person-today-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="person-sheet-head">
        ${avatarFrameMarkup(personAvatarConfig(who),who,'avatarFrame person-sheet-avatar')}
        <div>
          <div class="hub-sheet-title" style="color:${familyAccentColor(who)}">${escapeHtml(who)}</div>
          <div class="hub-sheet-sub">오늘 상태</div>
        </div>
      </div>
      ${renderHubMiniGroups(allItems.length?[sheetGroup]:[],{emptyText:'오늘 표시할 상태가 없어요'})}
    </div>
  </div>`;
}


function scheduleBaseKey(){
  return addDaysStr(todayKey(),scheduleBaseOffset||0);
}
function syncCalendarDateContext(dateKey){
  if(!dateKey)return;
  selDate=dateKey;
  const parts=String(dateKey).split('-').map(Number);
  if(parts.length>=2 && parts[0] && parts[1]){
    calY=parts[0];
    calM=parts[1]-1;
  }
}
function setGlobalDateContext(dateKey,{syncCalendar=true,doRender=true,preserveScroll=true}={}){
  const key=dateKey||todayKey();
  scheduleBaseOffset=daysBetween(todayKey(),key);
  if(syncCalendar)syncCalendarDateContext(key);
  if(doRender)render({preserveScroll});
}
function resetScheduleBase(){
  setGlobalDateContext(todayKey(),{syncCalendar:true,preserveScroll:false});
  try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){}
}
function scheduleBaseSuffix(){
  if(!scheduleBaseOffset)return '';
  const k=scheduleBaseKey();
  const [y,m,d]=k.split('-').map(Number);
  return ` · ${m}/${d} (${DAYS[new Date(y,m-1,d).getDay()]})`;
}
function moveScheduleBase(step=1){
  const next=addDaysStr(scheduleBaseKey(),step);
  setGlobalDateContext(next,{syncCalendar:true,preserveScroll:true});
  try{if(navigator.vibrate)navigator.vibrate(8)}catch(e){}
}
function daysBetween(fromKey,toKey){
  return Math.ceil((new Date(toKey+'T00:00:00')-new Date(fromKey+'T00:00:00'))/86400000);
}

let swipeState=null;
let swipeTapUntil=0;
function swipePoint(e){
  const p=(e.touches&&e.touches[0])||(e.changedTouches&&e.changedTouches[0])||e;
  return {x:p.clientX||0,y:p.clientY||0};
}
function rubberDx(dx){
  const abs=Math.abs(dx);
  if(abs<=130)return dx;
  return Math.sign(dx)*(130+(abs-130)*0.25);
}
function setSwipeTransform(target,dx){
  if(!target)return;
  target.style.transform=`translateX(${dx}px)`;
}
function setSwipeTransition(target,on=true){
  if(!target)return;
  target.style.transition=on?'transform .22s cubic-bezier(.2,.8,.2,1), opacity .18s ease':'none';
}
function clearSwipeElements(){
  if(!swipeState)return;
  const els=[swipeState.track,...(swipeState.sync||[])].filter(Boolean);
  els.forEach(el=>{
    setSwipeTransition(el,true);
    el.style.transform='translateX(0)';
    el.classList.remove('is-swiping','swipe-left','swipe-right');
  });
}
function startLayerSwipe(e,type,trackSelector='',syncSelector=''){
  if(e.target&&e.target.closest){
    const blockSelector='button,input,select,textarea,.chk,.small-link,.comment-pill,.day-btn,.shift-btn';
    if(e.target.closest(blockSelector))return;
    if(type!=='calendar' && e.target.closest('.cal-cell'))return;
  }
  const p=swipePoint(e);
  const root=e.currentTarget;
  const track=trackSelector?root.querySelector(trackSelector):root;
  const sync=syncSelector?[...document.querySelectorAll(syncSelector)]:[];
  swipeState={type,root,track,sync,startX:p.x,startY:p.y,lastX:p.x,lastT:Date.now(),dx:0,dy:0,active:false};
  [track,...sync].filter(Boolean).forEach(el=>{
    setSwipeTransition(el,false);
    el.classList.add('is-swiping');
  });
}
function moveLayerSwipe(e){
  if(!swipeState)return;
  const p=swipePoint(e);
  const dx=p.x-swipeState.startX;
  const dy=p.y-swipeState.startY;
  swipeState.dx=dx;
  swipeState.dy=dy;
  const horizontal=Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8;
  if(!horizontal)return;
  swipeState.active=true;
  if(e.cancelable)e.preventDefault();
  const vdx=rubberDx(dx);
  const els=[swipeState.track,...(swipeState.sync||[])].filter(Boolean);
  els.forEach(el=>{
    setSwipeTransform(el,vdx);
    el.classList.toggle('swipe-left',vdx<0);
    el.classList.toggle('swipe-right',vdx>0);
  });
  swipeState.lastX=p.x;
  swipeState.lastT=Date.now();
}
function endLayerSwipe(e){
  if(!swipeState)return;
  const p=swipePoint(e);
  const dt=Math.max(1,Date.now()-swipeState.lastT);
  const vx=(p.x-swipeState.lastX)/dt;
  const dx=swipeState.dx || (p.x-swipeState.startX);
  const dy=swipeState.dy || (p.y-swipeState.startY);
  const shouldMove=Math.abs(dx)>52 || Math.abs(vx)>0.42;
  const type=swipeState.type;
  const dir=dx<0?1:-1;
  const wasActive=swipeState.active;
  const els=[swipeState.track,...(swipeState.sync||[])].filter(Boolean);
  els.forEach(el=>setSwipeTransition(el,true));
  if(wasActive&&shouldMove){
    swipeTapUntil=Date.now()+500;
    const out=dir>0?-42:42;
    els.forEach(el=>setSwipeTransform(el,out));
    setTimeout(()=>{
      if(type==='shift')moveScheduleBase(dir);
      else if(type==='calendar')chCal(dir);
      else if(type==='home')moveScheduleBase(dir);
      swipeState=null;
    },95);
  }else{
    clearSwipeElements();
    setTimeout(()=>{swipeState=null},230);
  }
}
function startShiftSwipe(e){
  startLayerSwipe(e,'shift','.shift-5day-widget','');
}
function moveShiftSwipe(e){moveLayerSwipe(e)}
function endShiftSwipe(e){endLayerSwipe(e)}
function consumeSwipeTap(){
  if(Date.now()<swipeTapUntil)return true;
  return false;
}

function shiftColBadgeClass(status){
  const s=String(status||'').trim();
  const u=s.toUpperCase();
  if(!s)return 'shift-empty';
  if(u==='D' || s.includes('주'))return 'shift-day';
  if(u==='E' || s.includes('저녁') || s.includes('오후'))return 'shift-evening';
  if(u==='N' || s.includes('야'))return 'shift-night';
  if(s.includes('반'))return 'shift-half';
  if(u==='OFF' || u==='O' || s.includes('휴') || s.includes('연차'))return 'shift-off';
  return 'shift-custom';
}
function shiftDayColDateLabel(dateKey){
  const [yy,mm,dd]=dateKey.split('-').map(Number);
  const dow=DAYS[new Date(yy,mm-1,dd).getDay()];
  return `${dd} ${dow}`;
}
function shiftDayColDateHtml(dateKey){
  const [yy,mm,dd]=dateKey.split('-').map(Number);
  const dow=DAYS[new Date(yy,mm-1,dd).getDay()];
  return `<span class="col-date-num">${dd}</span><span class="col-date-dow">${escapeHtml(dow)}</span>`;
}

function renderShiftFiveDayBody(base=scheduleBaseKey()){
  normalizeShiftUsers();
  if(!shiftUsers.length)return '';
  const keys=[-2,-1,0,1,2].map(i=>addDaysStr(base,i));
  const showHint=shiftSwipeHintInfo();
  return `${shiftUsers.map(user=>`
    <div class="shift-5day-row">
      <div class="shift-person" title="${escapeAttr(user)}">
        ${avatarMarkup(personAvatar(user),user,'shift-micro-avatar')}
        <span class="shift-person-name">${escapeHtml(user)}</span>
      </div>
      <div class="shift-days-container">
        ${keys.map((k,i)=>{
          const status=shiftDisplayStatusFor(k,user);
          const label=status?shortShiftLabel(status):'-';
          const badgeClass=status?shiftBadgeClass(status):'shift-empty';
          const [yy,mm,dd]=k.split('-').map(Number);
          const dow=DAYS[new Date(yy,mm-1,dd).getDay()];
          return `<button type="button" class="shift-day-col ${i===2?'today':''}" title="${mm}/${dd} (${dow}) · ${escapeAttr(user)} · ${escapeAttr(status||'미입력')}" onclick="event.stopPropagation();openShiftPicker('${k}')">
            <span class="col-date">${shiftDayColDateHtml(k)}</span>
            <span class="col-badge shift-one ${badgeClass}">${escapeHtml(label)}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
  `).join('')}${showHint?`<div class="shift-swipe-hint-text compact">좌우로 밀어 날짜 이동</div>`:''}`;
}

function renderShiftWidget(){
  if(main!=='s')return '';
  normalizeShiftUsers();
  if(!shiftUsers.length)return '';
  return `<div class="shift-widget-shell shift-5day-shell"
    ontouchstart="startShiftSwipe(event)" ontouchmove="moveShiftSwipe(event)" ontouchend="endShiftSwipe(event)"
    onmousedown="startShiftSwipe(event)" onmousemove="moveShiftSwipe(event)" onmouseup="endShiftSwipe(event)" onmouseleave="endShiftSwipe(event)">
    <div class="shift-5day-widget calendar-sync-shift-widget">
      ${renderShiftFiveDayBody()}
    </div>
  </div>`;
}

function renderTodayShiftSection(){
  normalizeShiftUsers();
  if(!shiftUsers.length)return '';
  const baseKey=scheduleBaseKey();
  const rows=shiftUsers.map(user=>{
    const status=shiftDisplayStatusFor(baseKey,user);
    const label=status?shortShiftLabel(status):'-';
    const when=shortDateWithDow(baseKey);
    return `<button type="button" class="today-shift-current-row" onclick="openCalendarWorkTab('${baseKey}')" title="${escapeAttr(user)} · ${escapeAttr(status||'미입력')}">
      <span class="today-shift-person">
        ${avatarMarkup(personAvatar(user),user,'shift-micro-avatar')}
        <span class="today-shift-name" style="color:${familyAccentColor(user)}">${escapeHtml(user)}</span>
        <span class="modern-schedule-dotsep">·</span>
        <span class="today-shift-current-date">${escapeHtml(when)}</span>
        <span class="today-shift-badge shift-one ${status?shiftBadgeClass(status):'shift-empty'}">${escapeHtml(label)}</span>
      </span>
    </button>`;
  }).join('');
  return `<section class="today-shift-section" aria-label="근무표">
    <div class="today-shift-head">
      <div class="today-brief-section-title">근무</div>
    </div>
    <div class="today-shift-current-list">${rows}</div>
  </section>`;
}


function selectedTodayTargets(){
  return getPersons().map((label,i)=>({id:label||i,label}));
}
function selectedRoutineTargets(){
  return getPersons().map((label,i)=>({id:label||i,label}));
}
function toggleTodayDashboard(){
  todayDashboardOpen=!todayDashboardOpen;
  render();
}
function targetTodayEvents(target,sorted){
  return sorted.filter(n=>(n.who||'공통')===target);
}
function todayTimeOnly(n){
  const sT=n.sT||'';
  const eT=n.eT||'';
  if(sT&&eT)return `${sT} ~ ${eT}`;
  if(sT&&!eT)return `${sT} ~`;
  if(!sT&&eT)return eT;
  return '';
}
function toggleRoutineDashboard(){
  routineDashboardOpen=!routineDashboardOpen;
  render({preserveScroll:true});
}
function renderDashboardEventRows(list,minRows=0,opts={}){
  const limit=opts.limit||0;
  const expandable=!!opts.expandable;
  const expanded=!!opts.expanded;
  const shown=limit && !expanded ? list.slice(0,limit) : list;
  const rows=shown.map(n=>`<div class="today-event-row">
    <div class="today-event-title">${escapeHtml(n.title||'일정')}</div>
    <div class="today-event-time">${escapeHtml(todayTimeOnly(n)||'')}</div>
  </div>`);
  if(!rows.length){
    rows.push(`<div class="today-event-empty">일정 없음</div>`);
  }
  while(rows.length<minRows){
    rows.push(`<div class="today-event-placeholder"></div>`);
  }
  if(expandable && list.length>limit){
    rows.push(`<button class="routine-more-btn" onclick="event.stopPropagation();toggleRoutineDashboard()">${expanded?'▲':'▼'}</button>`);
  }
  return rows.join('');
}
function renderTargetDashboard(title,allEvents,minRows,cls,targetMode='routine'){
  const sourceTargets=targetMode==='today'?selectedTodayTargets():selectedRoutineTargets();
  const filteredAll=(allEvents||[]).filter(n=>{
    const who=n.who||'공통';
    if(subF!=='all'&&who!==subF)return false;
    return true;
  });
  const targetNames=[...new Set([...sourceTargets.map(t=>t.label),...filteredAll.map(n=>n.who||'공통')])];
  const targetOrder=[...getPersons(),...targetNames];
  targetNames.sort((a,b)=>{
    const ia=targetOrder.indexOf(a), ib=targetOrder.indexOf(b);
    return (ia<0?999:ia)-(ib<0?999:ib);
  });
  const targets=targetNames.length?targetNames.map((label,i)=>({id:label||i,label})):[{empty:true,label:'대상 선택'}];
  const filtered=sortByStartTime(filteredAll);
  const isRoutine=targetMode==='routine';
  const grid=targets.map(slot=>{
    if(slot.empty){
      return `<div class="today-target-card today-person-placeholder">
        <div class="today-target-name">대상 선택</div>
        <div class="today-target-empty-note">반복 기본 정보에서 표시 대상을 켜주세요</div>
      </div>`;
    }
    const list=targetTodayEvents(slot.label,filtered);
    // 사용자가 누락으로 느끼지 않도록 기본은 전체 출력, 하단 핸들로 접을 수 있게 유지합니다.
    const opts=isRoutine?{limit:4,expandable:true,expanded:true}:{};
    return `<div class="today-target-card">
      <div class="today-target-name" style="color:${familyAccentColor(slot.label)}">${escapeHtml(slot.label)}</div>
      <div class="today-event-list">${renderDashboardEventRows(list,0,opts)}</div>
    </div>`;
  }).join('');
  return `<div class="widget-wrap dashboard-wrap">
    <div class="widget-card ${cls}">
      <div class="today-dashboard-head inline-count">
        <div class="routine-title-row">
          <div class="widget-title">${escapeHtml(title)}</div>
          <div class="today-dashboard-count hot">${filtered.length}</div>
        </div>
      </div>
      <div class="today-target-grid">${grid}</div>
    </div>
  </div>`;
}


function makeTodayDashboardStandardRow(n,opts={}){
  if(!n)return '';
  const baseKey=opts.baseKey||scheduleBaseKey();
  const who=n.who||'공통';
  const isRoutine=!!opts.routine;
  const tm=todayTimeOnly(n)||'';
  const title=isRoutine?(n.title||'반복 일정'):displayNoteTitle(n);
  const kindLabel=isRoutine?'반복':'일정';
  const metaDate=isRoutine?dateLabel(baseKey):scheduleListDateLine({...n,start:n.start||baseKey});
  const meta=isRoutine
    ? `<span class="modern-schedule-person" style="color:${familyAccentColor(who)}">${escapeHtml(who)}</span><span class="modern-schedule-dotsep">·</span><span>${escapeHtml(kindLabel)}</span>${metaDate?`<span class="modern-schedule-dotsep">·</span><span>${escapeHtml(metaDate)}</span>`:''}`
    : `<span class="modern-schedule-person" style="color:${familyAccentColor(who)}">${escapeHtml(who)}</span><span class="modern-schedule-dotsep">·</span>${escapeHtml(metaDate)}`;
  let click='';
  if(isRoutine){
    const kind=n._autoFamilyInfo?'auto':'note';
    const rid=n._autoFamilyInfo?n._originalRoutineId:n.id;
    click=`onclick="openRoutineInstanceDetail(${onclickArg(title)},${onclickArg(who)},${onclickArg(tm)},${onclickArg(baseKey)},${onclickArg(kind)},${onclickArg(rid)})"`;
  }else if(n.id){
    click=`onclick="openEditNote('${n.id}')"`;
  }
  return `<div class="modern-schedule-item dashboard-standard-row${isRoutine?' routine':''}" ${click} style="cursor:pointer">
    <div class="modern-schedule-avatar" title="${escapeAttr(who)}">${avatarMarkup(personAvatar(who),who,'avatar-img')}</div>
    <div class="modern-schedule-content dashboard-standard-content">
      <div class="dashboard-standard-line">
        <span class="modern-schedule-person" style="color:${familyAccentColor(who)}">${escapeHtml(who)}</span>
        <span class="modern-schedule-dotsep">·</span>
        <span class="modern-schedule-date inline-date">${escapeHtml(metaDate)}</span>
        <span class="modern-schedule-title inline-title">${highlightText(title)}${!isRoutine?privateChip(n):''}</span>
      </div>
    </div>
    ${isRoutine&&tm?`<div class="dashboard-row-time">${escapeHtml(tm)}</div>`:''}
  </div>`;
}

function renderTodayListDashboard(title,allEvents,routineEvents=[]){
  const schedule=(allEvents||[]).filter(n=>{
    const who=n.who||'공통';
    if(subF!=='all'&&who!==subF)return false;
    return true;
  });
  const routines=(routineEvents||[]).filter(n=>{
    const who=n.who||'공통';
    if(subF!=='all'&&who!==subF)return false;
    return true;
  });

  const targetOrder=[...new Set([
    ...selectedTodayTargets().map(x=>x.label),
    ...selectedRoutineTargets().map(x=>x.label),
    ...getPersons(),
    ...schedule.map(n=>n.who||'공통'),
    ...routines.map(n=>n.who||'공통')
  ])];
  const personIdx=who=>{
    const i=targetOrder.indexOf(who||'공통');
    return i<0?999:i;
  };

  schedule.sort((a,b)=>{
    const pa=personIdx(a.who||'공통'), pb=personIdx(b.who||'공통');
    const ta=scheduleTimeKey(a), tb=scheduleTimeKey(b);
    if(ta!==tb)return ta.localeCompare(tb);
    if(pa!==pb)return pa-pb;
    return String(a.title||'').localeCompare(String(b.title||''),'ko');
  });

  routines.sort((a,b)=>{
    const pa=personIdx(a.who||'공통'), pb=personIdx(b.who||'공통');
    if(pa!==pb)return pa-pb;
    const ta=scheduleTimeKey(a), tb=scheduleTimeKey(b);
    if(ta!==tb)return ta.localeCompare(tb);
    return String(a.title||'').localeCompare(String(b.title||''),'ko');
  });

  const baseKey=scheduleBaseKey();
  const bothEmpty=!schedule.length&&!routines.length;

  const scheduleBody=schedule.length
    ? `<section class="today-brief-section today-schedule-section"><div class="today-brief-section-title">등록 일정</div><div class="dashboard-standard-list merged-schedule-wrap">${schedule.map(n=>makeTodayDashboardStandardRow(n,{baseKey})).join('')}</div></section>`
    : `<section class="today-brief-section today-schedule-section"><div class="today-brief-section-title">등록 일정</div><div class="dashboard-standard-list merged-schedule-wrap merged-empty-card compact-brief-empty clickable-empty" onclick="openAddModal('${baseKey}')" role="button" tabindex="0"><div class="compact-brief-empty-title">${escapeHtml(compactSchedulePrompt())}</div></div></section>`;

  const routineGroups={};
  routines.forEach(n=>{
    const who=n.who||'공통';
    if(!routineGroups[who])routineGroups[who]=[];
    routineGroups[who].push(n);
  });
  const groupKeys=Object.keys(routineGroups).sort((a,b)=>personIdx(a)-personIdx(b));
  const maxRows=groupKeys.length?Math.max(...groupKeys.map(w=>routineGroups[w].length)):0;
  const routineBody=groupKeys.length
    ? `<section class="today-brief-section today-routine-section"><div class="today-brief-section-head"><div class="today-brief-section-title">반복 일정</div></div><div class="merged-routine-wrap dashboard-routine-2col">${groupKeys.map(who=>{
        const rows=routineGroups[who];
        const filler=Math.max(0,maxRows-rows.length);
        return `<div class="merged-routine-group routine-2col-card">
          <div class="merged-routine-head routine-2col-head">
            <div class="merged-routine-avatar">${avatarMarkup(personAvatar(who),who)}</div>
            <div class="merged-routine-person beside-avatar" style="color:${familyAccentColor(who)}">${escapeHtml(who)}</div>
          </div>
          <div class="merged-routine-box routine-2col-box">${rows.map(n=>{
            const tm=todayTimeOnly(n)||'';
            const kind=n._autoFamilyInfo?'auto':'note';
            const rid=n._autoFamilyInfo?n._originalRoutineId:n.id;
            return `<div class="merged-routine-row routine-2col-row" onclick="openRoutineInstanceDetail(${onclickArg(n.title||'반복')},${onclickArg(n.who||'공통')},${onclickArg(tm)},${onclickArg(baseKey)},${onclickArg(kind)},${onclickArg(rid)})" style="cursor:pointer">
              <div class="merged-routine-title">${highlightText(n.title||'일정')}</div>
              <div class="merged-routine-time">${escapeHtml(tm)}</div>
            </div>`;
          }).join('')}${Array.from({length:filler},()=>`<div class="merged-routine-row routine-2col-row routine-placeholder-row" aria-hidden="true"><div class="merged-routine-title">&nbsp;</div><div class="merged-routine-time">&nbsp;</div></div>`).join('')}</div>
        </div>`;
      }).join('')}</div></section>`
    : `<section class="today-brief-section today-routine-section"><div class="today-brief-section-head"><div class="today-brief-section-title">반복 일정</div></div><div class="dashboard-standard-list dashboard-routine-list merged-empty-card compact-brief-empty"><div class="compact-brief-empty-title">반복 없음</div></div></section>`;

  const shiftSection=renderTodayShiftSection();
  const scheduleRoutineBody=bothEmpty
    ? `<div class="merged-empty-single">${renderBriefEmptyState('schedule','오늘 표시할 일정과 반복이 없어요')}</div>`
    : `${scheduleBody}${schedule.length&&routines.length?`<div class="dashboard-section-divider merged-section-divider" aria-hidden="true"></div>`:''}${routineBody}`;
  const body=`${shiftSection}${scheduleRoutineBody}`;

  return `<div class="widget-wrap dashboard-wrap">
    <div class="widget-card today-dashboard merged-today-dashboard today-briefing-capture no-dashboard-title" id="today-briefing-capture">
      ${body}
    </div>
  </div>`;
}

function todayChipTimeLabel(n){
  const datePrefix=n?._rangeMode&&n?._rangeDate?fmtD(n._rangeDate):'';
  const s=n?.sT||'';
  const e=n?.eT||'';
  let time='';
  if(s&&e)time=`${s}-${e}`;
  else if(s)time=s;
  else if(e)time=e;
  if(datePrefix&&time)return `${datePrefix} ${time}`;
  return time||datePrefix;
}
function todayChipClockLabel(n){
  const s=n?.sT||'';
  const e=n?.eT||'';
  if(s&&e)return `${s}-${e}`;
  return s||e||'';
}
function weekDayMeta(dateKey){
  const [y,m,d]=String(dateKey||todayKey()).split('-').map(Number);
  const dt=new Date(y,m-1,d);
  return {day:DAYS[dt.getDay()]||'',date:`${m}/${d}`,sort:dateKey||''};
}
function todayShiftChipLabel(status){
  const s=String(status||'').trim();
  if(!s)return '';
  const u=s.toUpperCase();
  if(u==='OFF'||u==='O')return 'OFF';
  return shortShiftLabel(s);
}
function todayChipSortKey(item){
  if(item.kind==='shift')return `0-${item.order}`;
  const t=item.time||'';
  return `${t?'1':'2'}-${t||'99:99'}-${item.order}`;
}
function makeTodayWWWGroups(schedule=[],routines=[]){
  normalizeShiftUsers();
  const baseKey=scheduleBaseKey();
  const peopleOrder=[...new Set([...getPersons(),...shiftUsers,...schedule.map(n=>n.who||'공통'),...routines.map(n=>n.who||'공통')])];
  const groups=new Map();
  const ensure=who=>{
    const key=who||'공통';
    if(!groups.has(key))groups.set(key,{who:key,items:[],seen:new Set()});
    return groups.get(key);
  };
  let order=0;
  const push=(who,item)=>{
    const group=ensure(who);
    const key=item.key||`${item.kind}|${who}|${item.time||''}|${item.title||''}`;
    if(group.seen.has(key))return;
    group.seen.add(key);
    group.items.push({...item,order:order++});
  };
  shiftUsers.forEach(user=>{
    const status=shiftDisplayStatusFor(baseKey,user);
    const label=todayShiftChipLabel(status);
    if(!label||label==='-')return;
    push(user,{
      kind:'shift',
      title:label,
      time:'',
      className:`shift-chip ${shiftBadgeClass(status)}`,
      html:`<span class="www-shift-label">${escapeHtml(label)}</span>`,
      click:`openShiftPicker('${baseKey}')`,
      key:`shift|${user}|${label}`
    });
  });
  (schedule||[]).forEach(n=>{
    const who=n.who||'공통';
    const time=todayChipTimeLabel(n);
    const title=displayNoteTitle(n);
    push(who,{
      kind:'schedule',
      title,
      time,
      className:isDone(n)?'done':'',
      html:`${time?`<span class="www-chip-time">${escapeHtml(time)}</span>`:''}<span class="www-chip-title">${highlightText(title)}</span>${privateChip(n)}`,
      click:n.id?`openEditNote('${n.id}')`:'',
      key:`schedule|${n.id||''}|${who}|${time}|${title}`
    });
  });
  (routines||[]).forEach(n=>{
    const who=n.who||'공통';
    const time=todayChipTimeLabel(n);
    const title=n.title||'반복';
    const kind=n._autoFamilyInfo?'auto':'note';
    const rid=n._autoFamilyInfo?n._originalRoutineId:n.id;
    const detailKey=n._rangeDate||baseKey;
    push(who,{
      kind:'routine',
      title,
      time,
      className:'routine',
      html:`<span class="www-repeat-mark">↻</span>${time?`<span class="www-chip-time">${escapeHtml(time)}</span>`:''}<span class="www-chip-title">${highlightText(title)}</span>`,
      click:`openRoutineInstanceDetail(${onclickArg(title)},${onclickArg(who)},${onclickArg(time)},${onclickArg(detailKey)},${onclickArg(kind)},${onclickArg(rid)})`,
      key:`routine|${rid||''}|${who}|${time}|${title}`
    });
  });
  return [...groups.values()]
    .filter(g=>g.items.length)
    .sort((a,b)=>{
      const ia=peopleOrder.indexOf(a.who), ib=peopleOrder.indexOf(b.who);
      return (ia<0?999:ia)-(ib<0?999:ib);
    })
    .map(g=>({...g,items:g.items.sort((a,b)=>todayChipSortKey(a).localeCompare(todayChipSortKey(b),'ko'))}));
}
function renderTodayWWWGroup(group){
  return `<div class="www-person-group">
    <div class="www-person-avatar-col">${avatarFrameMarkup(personAvatarConfig(group.who),group.who,'avatarFrame www-avatar-frame')}</div>
    <div class="www-person-name" style="color:${familyAccentColor(group.who)}">${escapeHtml(group.who)}</div>
    <div class="www-chip-wrap">
      ${group.items.map(item=>item.click?`<button type="button" class="www-chip ${item.className||''}" onclick="event.stopPropagation();${item.click}" aria-label="${escapeAttr(`${group.who} ${item.title||'항목'} 수정`)}">${item.html}</button>`:`<span class="www-chip ${item.className||''} static">${item.html}</span>`).join('')}
    </div>
  </div>`;
}
function makeWeekWWWGroups(schedule=[],routines=[],keys=[]){
  normalizeShiftUsers();
  const weekKeys=(keys&&keys.length?keys:homeRangeKeys()).filter(Boolean);
  const keyOrder=new Map(weekKeys.map((k,i)=>[k,i]));
  const peopleOrder=[...new Set([...getPersons(),...shiftUsers,...schedule.map(n=>n.who||'공통'),...routines.map(n=>n.who||'공통')])];
  const groups=new Map();
  const ensure=(who,dateKey)=>{
    const person=who||'공통';
    const dk=dateKey||weekKeys[0]||scheduleBaseKey();
    if(!groups.has(person))groups.set(person,{who:person,days:new Map(),seen:new Set()});
    const group=groups.get(person);
    if(!group.days.has(dk))group.days.set(dk,{dateKey:dk,items:[]});
    return {group,day:group.days.get(dk)};
  };
  let order=0;
  const push=(who,dateKey,item)=>{
    if(!dateKey)return;
    const {group,day}=ensure(who,dateKey);
    const key=item.key||`${item.kind}|${who}|${dateKey}|${item.time||''}|${item.title||''}`;
    if(group.seen.has(key))return;
    group.seen.add(key);
    day.items.push({...item,dateKey,order:order++});
  };
  weekKeys.forEach(dateKey=>{
    shiftUsers.forEach(user=>{
      const status=shiftDisplayStatusFor(dateKey,user);
      const label=todayShiftChipLabel(status);
      if(!label||label==='-')return;
      push(user,dateKey,{
        kind:'shift',
        title:label,
        time:'',
        className:`shift-chip ${shiftBadgeClass(status)}`,
        html:`<span class="www-shift-label">${escapeHtml(label)}</span>`,
        click:`openShiftPicker('${dateKey}')`,
        key:`shift|${user}|${dateKey}|${label}`
      });
    });
  });
  (schedule||[]).forEach(n=>{
    const who=n.who||'공통';
    const dateKey=n._rangeDate||n.start||weekKeys.find(k=>occursOn(n,k))||'';
    const time=todayChipClockLabel(n);
    const title=displayNoteTitle(n);
    push(who,dateKey,{
      kind:'schedule',
      title,
      time,
      className:isDone(n)?'done':'',
      html:`${time?`<span class="www-chip-time">${escapeHtml(time)}</span>`:''}<span class="www-chip-title">${highlightText(title)}</span>${privateChip(n)}`,
      click:n.id?`openEditNote('${n.id}')`:'',
      key:`schedule|${n.id||''}|${who}|${dateKey}|${time}|${title}`
    });
  });
  (routines||[]).forEach(n=>{
    const who=n.who||'공통';
    const dateKey=n._rangeDate||n.start||weekKeys.find(k=>occursOn(n,k))||'';
    const time=todayChipClockLabel(n);
    const title=n.title||'반복';
    const kind=n._autoFamilyInfo?'auto':'note';
    const rid=n._autoFamilyInfo?n._originalRoutineId:n.id;
    push(who,dateKey,{
      kind:'routine',
      title,
      time,
      className:'routine',
      html:`<span class="www-repeat-mark">&#8635;</span>${time?`<span class="www-chip-time">${escapeHtml(time)}</span>`:''}<span class="www-chip-title">${highlightText(title)}</span>`,
      click:`openRoutineInstanceDetail(${onclickArg(title)},${onclickArg(who)},${onclickArg(time)},${onclickArg(dateKey)},${onclickArg(kind)},${onclickArg(rid)})`,
      key:`routine|${rid||''}|${who}|${dateKey}|${time}|${title}`
    });
  });
  return [...groups.values()]
    .map(group=>({
      who:group.who,
      days:[...group.days.values()]
        .filter(day=>day.items.length)
        .sort((a,b)=>(keyOrder.get(a.dateKey)??999)-(keyOrder.get(b.dateKey)??999))
        .map(day=>({...day,items:day.items.sort((a,b)=>todayChipSortKey(a).localeCompare(todayChipSortKey(b),'ko'))}))
    }))
    .filter(group=>group.days.length)
    .sort((a,b)=>{
      const ia=peopleOrder.indexOf(a.who), ib=peopleOrder.indexOf(b.who);
      return (ia<0?999:ia)-(ib<0?999:ib);
    });
}
function renderWeekWWWGroup(group){
  const total=group.days.reduce((sum,day)=>sum+day.items.length,0);
  return `<div class="www-person-group www-week-person-group">
    <div class="www-person-avatar-col">${avatarFrameMarkup(personAvatarConfig(group.who),group.who,'avatarFrame www-avatar-frame')}</div>
    <div class="www-person-name www-week-person-name" style="color:${familyAccentColor(group.who)}"><span>${escapeHtml(group.who)}</span><em>이번주 ${total}개</em></div>
    <div class="www-week-days">
      ${group.days.map(day=>{
        const meta=weekDayMeta(day.dateKey);
        return `<div class="www-week-day-group">
          <div class="www-week-day-head"><b>${escapeHtml(meta.day)}</b><span>${escapeHtml(meta.date)}</span></div>
          <div class="www-chip-wrap www-week-chip-wrap">
            ${day.items.map(item=>item.click?`<button type="button" class="www-chip www-week-chip ${item.className||''}" onclick="event.stopPropagation();${item.click}" aria-label="${escapeAttr(`${group.who} ${item.title||'항목'} 수정`)}">${item.html}</button>`:`<span class="www-chip www-week-chip ${item.className||''} static">${item.html}</span>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}
function renderTodayListDashboard(title,allEvents,routineEvents=[]){
  const schedule=(allEvents||[]).filter(n=>{
    const who=n.who||'공통';
    if(subF!=='all'&&who!==subF)return false;
    return true;
  });
  const routines=(routineEvents||[]).filter(n=>{
    const who=n.who||'공통';
    if(subF!=='all'&&who!==subF)return false;
    return true;
  });
  const baseKey=scheduleBaseKey();
  const isWeek=homeViewRange==='week';
  const groups=isWeek?makeWeekWWWGroups(schedule,routines,homeRangeKeys()):makeTodayWWWGroups(schedule,routines);
  const body=groups.length
    ? `<div class="www-today-list ${isWeek?'www-week-list':''}">${groups.map(isWeek?renderWeekWWWGroup:renderTodayWWWGroup).join('')}</div>`
    : `<div class="www-empty compact-brief-empty clickable-empty" onclick="openAddModal('${baseKey}')" role="button" tabindex="0"><div class="compact-brief-empty-title">${escapeHtml(compactSchedulePrompt())}</div></div>`;

  return `<div class="widget-wrap dashboard-wrap">
    <div class="widget-card today-dashboard merged-today-dashboard today-briefing-capture no-dashboard-title www-today-card" id="today-briefing-capture">
      <div class="www-today-head">
        <div>
          <div class="www-today-title">${escapeHtml(title||'WWW TODAY')}</div>
          <div class="www-today-sub">Who · When · What</div>
        </div>
        <button type="button" class="www-share-btn" onclick="openTodayShareSheet()" aria-label="WWW TODAY 공유">${shareIconSvg()}</button>
      </div>
      ${body}
    </div>
  </div>`;
}

function daysUntilDate(dateStr){
  if(!dateStr)return null;
  const today=todayKey();
  const diff=Math.ceil((new Date(dateStr+'T00:00:00')-new Date(today+'T00:00:00'))/86400000);
  return diff;
}
function scheduleDdayChip(n){
  const k=n.start||'';
  const diff=daysUntilDate(k);
  if(diff===null || diff<0 || diff>30)return '';
  const label=diff===0?'D-Day':`D-${diff}`;
  return `<span class="chip dday-chip">${label}</span>`;
}
function scheduleDimClass(n){
  const diff=daysUntilDate(n.start||'');
  return diff!==null && diff>=7 && diff<=30 ? ' dim-future' : '';
}
function alertUrgentClass(n){
  const diff=daysUntilDate(n.start||'');
  return diff!==null && diff>=0 && diff<=1 ? ' urgent' : '';
}
function memoryCalendarType(x){
  return (x&&x.isLunar) || (x&&x.lunar) || (x&&x.calendarType)==='lunar' ? 'lunar' : 'solar';
}
function lunarPartsFromSolar(dateStr){
  try{
    const fmt=new Intl.DateTimeFormat('ko-KR-u-ca-chinese',{year:'numeric',month:'numeric',day:'numeric'});
    const parts=fmt.formatToParts(new Date(dateStr+'T00:00:00'));
    const get=t=>parts.find(p=>p.type===t)?.value||'';
    return {
      year:Number(get('relatedYear')||get('year')),
      month:Number(String(get('month')).replace(/[^\d]/g,'')),
      day:Number(String(get('day')).replace(/[^\d]/g,''))
    };
  }catch(e){
    return null;
  }
}
function lunarToSolarDate(year,month,day){
  try{
    if(typeof Lunar!=='undefined' && Lunar.fromYmd){
      return Lunar.fromYmd(Number(year),Number(month),Number(day)).getSolar().toYmd();
    }
  }catch(e){}
  try{
    const start=new Date(year,0,1);
    const end=new Date(year,11,31);
    for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
      const key=dk(d.getFullYear(),d.getMonth(),d.getDate());
      const p=lunarPartsFromSolar(key);
      if(p && p.year===Number(year) && p.month===Number(month) && p.day===Number(day))return key;
    }
  }catch(e){}
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
function memoryThisYearDate(x){
  const b=x&&x.birth;
  if(!b)return '';
  const [,mm,dd]=b.split('-').map(Number);
  if(memoryCalendarType(x)==='lunar')return lunarToSolarDate(TY,mm,dd);
  return birthDateInYear(b,TY);
}
function memoryAgeLabel(x){
  if(!x||!x.birth)return '';
  const nb=nextBirthInfo(x.birth,memoryCalendarType(x)==='lunar');
  const [by]=x.birth.split('-').map(Number);
  let age=Number((nb.date||'').slice(0,4))-by;
  if(nb.date>todayKey())age--;
  age=Math.max(0,age||0);
  const title=String(x.name||'');
  if(title.includes('축하') || title.includes('결혼'))return age===0?'올해':`${age}주년`;
  if(title.includes('생일') || title.includes('탄생'))return `만 ${age}세`;
  return `${age}년째`;
}
function upcomingEvents(days=7,baseKey=scheduleBaseKey(),limit=3){
  const end=addDaysStr(baseKey,days);
  return notes.filter(n=>{
    if(isDone(n)||n.repeat)return false;
    const k=n.start||'';
    if(!k || k<=baseKey || k>end)return false;
    if(subF!=='all' && (n.who||'공통')!==subF)return false;
    return true;
  }).sort((a,b)=>{
    const ka=(a.start||'')+'|'+scheduleTimeKey(a)+'|'+(a.who||'');
    const kb=(b.start||'')+'|'+scheduleTimeKey(b)+'|'+(b.who||'');
    return ka.localeCompare(kb);
  }).slice(0,limit);
}
function renderUpcomingPreview(limit=3,baseKey=scheduleBaseKey()){
  if(main!=='s')return '';
  const list=upcomingEvents(7,baseKey,limit);
  if(!list.length)return '';
  return `<div class="home-upcoming-preview">
    <div class="home-upcoming-head">
      <span>${'\uB2E4\uAC00\uC624\uB294 \uC77C\uC815'}</span>
      <em>${list.length}</em>
    </div>
    <div class="home-upcoming-list">
        ${list.map(n=>{
          const d=daysBetween(baseKey,n.start);
          const dd=d===1?'\uB0B4\uC77C':`D-${d}`;
          const dateText=shortDateWithDow(n.start||'');
          const who=n.who||'\uAC00\uC871';
          return `<button type="button" class="home-upcoming-row" onclick="openEditNote('${n.id}')">
            <span class="home-upcoming-date">${escapeHtml(dateText||dd)}</span>
            <span class="home-upcoming-main"><b style="color:${familyAccentColor(who)}">${escapeHtml(who)}</b><em>${escapeHtml(n.title||'\uC77C\uC815')}</em></span>
            <span class="home-upcoming-dday">${escapeHtml(dd)}</span>
          </button>`;
        }).join('')}
    </div>
  </div>`;
}
function openCalendarTargetSheet(){
  const opts=[['all','가족'],...getPersons().map(p=>[p,p])];
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">달력 가족 선택</div>
      ${opts.map(o=>`<button class="sort-row${calWhoF===o[0]?' on':''}" onclick="setCalendarTarget(${onclickArg(o[0])})">
        <span class="sort-check">${calWhoF===o[0]?'✓':''}</span>
        <span><b>${escapeHtml(o[1])}</b><em>${o[0]==='all'?'가족 전체 일정 표시':'선택한 가족만 표시'}</em></span>
      </button>`).join('')}
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}
function setCalendarTarget(t){
  calWhoF=t||'all';
  closeM();
  render();
}
function renderCalendarShiftCounts(){
  if(calViewMode!=='work')return '';
  normalizeShiftUsers();
  const user=calendarWorkUser();
  const sc=getShiftCount(calY,calM,[user]);
  const countFor=(label)=>label==='OFF'?((sc.OFF||0)+(sc.O||0)):(sc[label]||0);
  const labels=['D','E','N','OFF'].filter(x=>countFor(x)>0);
  if(!labels.length)return '';
  return `<div class="calendar-shift-summary" aria-label="${escapeAttr(user)} 월간 근무 집계">
    ${labels.map(s=>`<span class="calendar-shift-summary-item"><b class="${shiftBadgeClass(s)}">${escapeHtml(workCalendarShiftLabel(s))}</b><span>${countFor(s)}</span></span>`).join('<span class="calendar-shift-summary-sep">·</span>')}
  </div>`;
}


function dashboardDateKey(){
  // 일정 탭 상단 5일 상태 위젯의 첫 칸이 기준입니다.
  // 달력에서 선택한 날짜와 무관하게 항상 실제 오늘 날짜를 기준으로 대시보드를 표시합니다.
  return todayKey();
}
function dashboardDateLabel(){
  return '';
}
function familyInfoEventsForKey(k){
  const [y,m,d]=k.split('-').map(Number);
  return familyInfoEventsOnDate(y,m-1,d);
}

function getBriefingEvents(baseKey=scheduleBaseKey()){
  const normal=notes.filter(n=>!isDone(n)&&!n.repeat&&!n._autoFamilyInfo&&occursOn(n,baseKey));
  const manual=notes.filter(n=>!isDone(n)&&n.repeat&&occursOn(n,baseKey))
    .map(n=>({...n,start:baseKey,end:baseKey,_repeatInstance:true}));
  return sortByStartTime([...normal,...familyInfoEventsForKey(baseKey),...manual]);
}
function briefingPersonEmoji(who){
  const w=String(who||'공통');
  if(w.includes('아빠'))return '👨';
  if(w.includes('엄마'))return '👩';
  if(w.includes('첫째')||w.includes('초이'))return '👧';
  if(w.includes('둘째')||w.includes('도미'))return '👦';
  if(w==='공통')return '🏠';
  return '👤';
}
function stripTimeFromBriefingTitle(title){
  return String(title||'일정')
    .replace(/\b([01]?\d|2[0-3])[:시]\s*([0-5]\d)?\s*(분)?\b/g,'')
    .replace(/\s*[~\-–]\s*$/,'')
    .replace(/\s{2,}/g,' ')
    .trim() || String(title||'일정');
}
function briefingEventLine(n){
  const title=stripTimeFromBriefingTitle(n.title||'일정');
  const time=todayTimeOnly(n);
  return `${title}${time?` ${time}`:''}`;
}
function shareIconSvg(){
  return `<svg class="www-share-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.4 12.7 15.6 16.8"/><path d="M15.6 7.2 8.4 11.3"/><circle cx="6.5" cy="12" r="2.6"/><circle cx="17.5" cy="6" r="2.6"/><circle cx="17.5" cy="18" r="2.6"/></svg>`;
}

function todayShareDateTitle(key=scheduleBaseKey()){
  const [y,m,d]=String(key||todayKey()).split('-').map(Number);
  if(!y||!m||!d)return dateLabel(key||todayKey());
  const dow=DAYS[new Date(y,m-1,d).getDay()]||'';
  return `${y}.${m}.${d} ${dow}요일`;
}

function todayShareGroups(key=scheduleBaseKey()){
  const normal=notes.filter(n=>!isDone(n)&&!n.repeat&&!n._autoFamilyInfo&&occursOn(n,key))
    .map(n=>({...n,_rangeDate:key,_rangeMode:false}));
  const routine=[
    ...familyInfoEventsForKey(key).map(n=>({...n,_rangeDate:key,_rangeMode:false})),
    ...notes.filter(n=>!isDone(n)&&n.repeat&&occursOn(n,key))
      .map(n=>({...n,start:key,end:key,_rangeDate:key,_rangeMode:false,_repeatInstance:true}))
  ];
  return makeTodayWWWGroups(normal,routine).filter(g=>g.items.length);
}

function todayShareItemText(item){
  const title=String(item?.title||'').trim();
  const time=String(item?.time||'').trim();
  if(item?.kind==='shift')return title;
  const prefix=item?.kind==='routine'?'↻ ':'';
  return `${prefix}${time?`${time} `:''}${title}`.trim();
}

function buildTodayShareText(key=scheduleBaseKey()){
  const groups=todayShareGroups(key);
  const lines=[`📅 ${todayShareDateTitle(key)}`,''];
  if(groups.length){
    groups.forEach(g=>{
      const items=g.items.map(todayShareItemText).filter(Boolean).join(', ');
      lines.push(`${g.who}: ${items||'일정 없음'}`);
    });
  }else{
    lines.push('오늘 공유할 일정이 없어요.');
  }
  return lines.join('\n');
}

function openTodayShareSheet(){
  const key=scheduleBaseKey();
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet today-share-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="today-share-sheet-title">WWW TODAY 공유</div>
      <div class="today-share-sheet-sub">${escapeHtml(todayShareDateTitle(key))}</div>
      <div class="today-share-actions">
        <button class="today-share-row" onclick="saveTodayBriefingImage()"><span>${downloadIconSvg()}</span><b>이미지로 저장</b></button>
        <button class="today-share-row" onclick="shareTodayToKakao()"><span>${shareIconSvg()}</span><b>카카오톡 공유</b></button>
        <button class="today-share-row" onclick="copyTodayBriefing()"><span>${copyIconSvg()}</span><b>텍스트로 복사</b></button>
      </div>
    </div>
  </div>`;
  document.body.classList.add('modal-open');
}

function downloadIconSvg(){
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"/><path d="m8 10 4 4 4-4"/><path d="M5 19h14"/></svg>`;
}

function copyIconSvg(){
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="10" height="12" rx="2"/><path d="M6 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>`;
}

function todayShareTemplateHtml(key=scheduleBaseKey()){
  const groups=todayShareGroups(key);
  const rows=groups.length?groups.map(g=>`
    <div class="today-share-card-row">
      <div class="today-share-card-avatar">${avatarFrameMarkup(personAvatarConfig(g.who),g.who,'avatarFrame today-share-avatar')}</div>
      <div class="today-share-card-name" style="color:${familyAccentColor(g.who)}">${escapeHtml(g.who)}</div>
      <div class="today-share-card-items">
        ${g.items.map(item=>{
          const cls=item.kind==='shift'?` shift-chip ${item.className||''}`:(item.kind==='routine'?' routine':'');
          return `<span class="today-share-chip${cls}">${escapeHtml(todayShareItemText(item))}</span>`;
        }).join('')}
      </div>
    </div>`).join(''):`<div class="today-share-empty">오늘 공유할 일정이 없어요.</div>`;
  return `<div class="today-share-render-card">
    <div class="today-share-render-date">${escapeHtml(todayShareDateTitle(key))}</div>
    <div class="today-share-render-head">
      <div class="today-share-render-title">WWW TODAY</div>
      <div class="today-share-render-sub">Who · When · What</div>
    </div>
    <div class="today-share-render-list">${rows}</div>
    <div class="today-share-render-brand">Family Scheduler</div>
  </div>`;
}

async function createTodayShareCanvas(key=scheduleBaseKey()){
  if(!window.html2canvas)throw new Error('html2canvas unavailable');
  const host=document.createElement('div');
  host.className='today-share-render-host';
  host.innerHTML=todayShareTemplateHtml(key);
  document.body.appendChild(host);
  try{
    const card=host.querySelector('.today-share-render-card');
    return await html2canvas(card,{backgroundColor:null,scale:2,useCORS:true,width:540,height:675});
  }finally{
    host.remove();
  }
}

async function canvasToBlob(canvas){
  return await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
}

async function saveTodayBriefingImage(){
  const key=scheduleBaseKey();
  if(!window.html2canvas)return alert('이미지 저장 라이브러리를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.');
  try{
    const canvas=await createTodayShareCanvas(key);
    const blob=await canvasToBlob(canvas);
    const a=document.createElement('a');
    const url=blob?URL.createObjectURL(blob):canvas.toDataURL('image/png');
    a.href=url;
    a.download=`www-today-${key}.png`;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{
      a.remove();
      if(blob)URL.revokeObjectURL(url);
    },0);
    closeM();
    showToast('WWW TODAY 이미지를 저장했어요.');
  }catch(e){
    console.warn(e);
    showToast('이미지 저장 중 오류가 발생했어요.');
  }
}

async function shareTodayToKakao(){
  const key=scheduleBaseKey();
  const text=buildTodayShareText(key);
  if(!window.html2canvas)return copyTodayBriefing();
  try{
    const canvas=await createTodayShareCanvas(key);
    const blob=await canvasToBlob(canvas);
    if(blob&&navigator.share&&window.File){
      const file=new File([blob],`www-today-${key}.png`,{type:'image/png'});
      const payload={title:'오늘 가족 일정',text,files:[file]};
      if(!navigator.canShare || navigator.canShare(payload)){
        await navigator.share(payload);
        closeM();
        return;
      }
    }
    await copyTextToClipboard(text);
    showToast('공유가 지원되지 않아 텍스트를 복사했어요.');
  }catch(e){
    console.warn(e);
    await copyTextToClipboard(text);
    showToast('이미지 공유 대신 텍스트를 복사했어요.');
  }
}

async function copyTextToClipboard(txt){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    try{
      await navigator.clipboard.writeText(txt);
      return true;
    }catch(e){
      console.warn('clipboard api failed, falling back',e);
    }
  }
  const ta=document.createElement('textarea');
  ta.value=txt;
  ta.setAttribute('readonly','');
  ta.style.position='fixed';
  ta.style.left='-9999px';
  ta.style.top='0';
  document.body.appendChild(ta);
  ta.select();
  try{
    return document.execCommand('copy');
  }finally{
    ta.remove();
  }
}

function copyTodayBriefing(){
  const txt=buildTodayShareText(scheduleBaseKey());
  copyTextToClipboard(txt)
    .then(()=>{closeM();showToast('WWW TODAY 텍스트를 복사했어요.');})
    .catch(()=>alert(txt));
}
function renderHomeWidgets(){
  if(main!=='s')return '';
  const keys=homeRangeKeys();
  const baseKey=keys[0]||scheduleBaseKey();
  const isWeek=homeViewRange==='week';
  const normalToday=notes.filter(n=>!isDone(n)&&!n.repeat&&!n._autoFamilyInfo&&keys.some(k=>occursOn(n,k)))
    .map(n=>{
      const displayKey=keys.find(k=>occursOn(n,k))||baseKey;
      return {...n,_rangeDate:displayKey,_rangeMode:isWeek};
    });
  const noteRoutineToday=keys.flatMap(k=>notes.filter(n=>!isDone(n)&&n.repeat&&occursOn(n,k))
    .map(n=>({...n,start:k,end:k,_rangeDate:k,_rangeMode:isWeek,_repeatInstance:true})));
  const routineToday=keys.flatMap(k=>[
    ...familyInfoEventsForKey(k).map(n=>({...n,_rangeDate:k,_rangeMode:isWeek})),
    ...noteRoutineToday.filter(n=>n.start===k)
  ]);
  const dueToday=keys.flatMap(k=>dueRequestsForDate(k).map(r=>({...r,_rangeDate:k,_rangeMode:isWeek})));
  const dueHtml=dueToday.length?`<div class="today-todo-nudge">
    <div class="today-todo-nudge-title">${isWeek?'이번주 부탁':'오늘 부탁'}</div>
    ${dueToday.map(r=>`<button class="today-todo-nudge-row" onclick="setMain('r')">
      <span>${escapeHtml(r.title||'부탁')}</span>
      <em>${escapeHtml(r.dueTime?`${isWeek?fmtD(r._rangeDate)+' ':''}${timeLabel(r.dueTime)}`:(isWeek?fmtD(r._rangeDate):'오늘까지'))}</em>
    </button>`).join('')}
  </div>`:'';
  return `<div class="dashboard-swipe-sync">${dueHtml}${renderTodayListDashboard(isWeek?'WWW WEEK':'WWW TODAY',normalToday,routineToday)}</div>`;
}
function bellSvg(){
  return '<svg class="home-head-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9.8a6 6 0 1 0-12 0c0 6-2.4 6.7-2.4 6.7h16.8S18 15.8 18 9.8Z"/><path d="M9.8 19a2.4 2.4 0 0 0 4.4 0"/></svg>';
}
function familySettingsSvg(){
  return '<svg class="home-head-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.8 19c.7-3.2 2.5-5 5.2-5s4.5 1.8 5.2 5"/><path d="M14.5 15c2.4.1 4 .9 5.7 3.7"/></svg>';
}function renderHomeAppHeader(){
  if(main!=='s')return '';
  const base=scheduleBaseKey();
  const [hy,hm,hd]=String(base).split('-').map(Number);
  const dow=hy&&hm&&hd?`${DAYS[new Date(hy,hm-1,hd).getDay()]}요일`:'';
  return `<section class="home-app-head">
    <div class="home-head-row">
      <button type="button" class="home-date-button" onclick="handleDateHeaderClick('${base}')" aria-label="달력에서 ${escapeAttr(dateLabel(base))} 보기"><div class="home-kicker"><span class="home-date-main">${escapeHtml(dateLabel(base))}</span>${dow?`<span class="home-date-weekday">${escapeHtml(dow)}</span>`:''}</div></button>
      <div class="home-head-actions">
        <button onclick="openTodayInboxSheet('${base}')" aria-label="오늘 확인할 것">${bellSvg()}</button>
        <button onclick="openScheduleFilterSheet()" aria-label="검색">${filterSearchSvg()}</button>
      </div>
    </div>
    ${renderHomeRangePanel()}
  </section>`;
}
function renderHomeRangePanel(){
  return `<div class="home-range-panel" aria-label="보기 전환">
    <div class="home-range-tabs">
      <button type="button" class="home-range-tab${homeViewRange==='today'?' on':''}" onclick="setHomeViewRange('today')">오늘</button>
      <button type="button" class="home-range-tab${homeViewRange==='week'?' on':''}" onclick="setHomeViewRange('week')">이번주</button>
    </div>
  </div>`;
}
function renderTodayResetChip(){
  if(!scheduleBaseOffset)return '';
  return `<button type="button" class="today-reset-chip" onclick="resetScheduleBase()">오늘로 돌아가기</button>`;
}
function homeStatusSummary(){
  const keys=homeRangeKeys();
  const label=homeViewRange==='week'?'이번주':'오늘';
  const scheduleCount=notes.filter(n=>!isDone(n)&&!n.repeat&&!n._autoFamilyInfo&&keys.some(k=>occursOn(n,k))).length;
  const routineCount=keys.reduce((sum,k)=>sum+familyInfoEventsForKey(k).length+notes.filter(n=>!isDone(n)&&n.repeat&&occursOn(n,k)).length,0);
  const requestCount=keys.reduce((sum,k)=>sum+dueRequestsForDate(k).length,0);
  const doneReqCount=(requests||[]).filter(r=>isDone(r)&&keys.includes(r.doneAt||r.dueDate||r.requestDate||'')).length;
  const parts=[`${label} 일정 ${scheduleCount}개`, `부탁 ${requestCount}개`];
  if(routineCount)parts.push(`반복 ${routineCount}개`);
  if(doneReqCount)parts.push(`해결 ${doneReqCount}개`);
  return parts.join(' · ');
}
function renderTopSwipeZone(){
  if(main!=='s')return '';
  const parts=[renderHomeAppHeader(),renderTodayResetChip(),renderNoticeBanner(),renderManualNotice(),renderHomeWidgets()].filter(Boolean).join('');
  if(!parts)return '';
  return `<div class="top-swipe-zone"
    ontouchstart="startLayerSwipe(event,'home','.top-swipe-zone')"
    ontouchmove="moveLayerSwipe(event)"
    ontouchend="endLayerSwipe(event)"
    onmousedown="startLayerSwipe(event,'home','.top-swipe-zone')"
    onmousemove="moveLayerSwipe(event)"
    onmouseup="endLayerSwipe(event)"
    onmouseleave="endLayerSwipe(event)">${parts}</div>`;
}

function renderManualNotice(){
  if(main!=='s')return '';
  const list=(notices||[]).filter(n=>n.important||!n.read).sort((a,b)=>{
    if(!!b.important!==!!a.important)return b.important?1:-1;
    return (b.createdAt||0)-(a.createdAt||0);
  });
  if(!list.length)return '';
  const n=list[0];
  return `<div class="notice-manual${n.important?' important':''}" onclick="openNoticeList()" style="cursor:pointer">
    <div class="nt-title">${n.important?'⭐':'📌'} ${escapeHtml(n.title||'가족 공지')}</div>
    <div class="nt-body">${escapeHtml(n.body||'')}</div>
    ${list.length>1?`<div class="nt-body" style="margin-top:4px">외 ${list.length-1}개 공지</div>`:''}
  </div>`;
}

function openNoticeList(){
  const list=[...(notices||[])].sort((a,b)=>{
    if(!!b.important!==!!a.important)return b.important?1:-1;
    return (b.createdAt||0)-(a.createdAt||0);
  });
  let touched=false;
  list.forEach(n=>{
    if(!n.important && !n.read){n.read=true;touched=true;}
  });
  if(touched)saveSettingsOnly();
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">가족 공지</div>
      ${list.length?list.map(n=>`<div class="card" style="margin-bottom:8px">
        <div class="c-title">${n.important?'⭐ ':''}${escapeHtml(n.title||'가족 공지')}</div>
        <div class="c-meta">${n.important?`<span class="chip imp-chip">중요</span>`:''}</div>
        <div style="font-size:13px;color:var(--t2);line-height:1.45;margin-top:8px">${escapeHtml(n.body||'')}</div>
        <div class="action-grid notice-action-grid notice-action-grid-2">
          <button class="toss-btn primary" onclick="openNoticeModal('${n.id}')">수정</button>
          <button class="toss-btn danger" onclick="delNotice('${n.id}')">삭제</button>
        </div>
      </div>`).join(''):'<div class="empty">등록된 공지가 없어요</div>'}
      <button class="primary-btn" onclick="openNoticeModal()">+ 공지 추가</button>
      <button class="cancel-link" onclick="closeM()">닫기</button>
    </div>
  </div>`;
}

function markNoticeRead(id){
  if(!requireEditMode())return;

  const n=(notices||[]).find(x=>String(x.id)===String(id));
  if(n){n.read=true;saveSettingsOnly();render();}
}
function delNotice(id){
  if(!requireEditMode())return;
  const idx=(notices||[]).findIndex(x=>String(x.id)===String(id));
  if(idx<0)return;
  notices.splice(idx,1);
  saveSettingsOnly();
  openNoticeList();
  render();
  showToast('공지를 삭제했습니다.');
}

function openNoticeModal(id){
  const n=id?(notices||[]).find(x=>String(x.id)===String(id)):null;
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">${n?'공지 수정':'공지 추가'}</div>
      <div class="ml">제목</div>
      <input class="mi" id="nt-title" placeholder="예: 이번 주 금요일 조기하교" value="${n?escapeAttr(n.title):''}"/>
      <div class="ml">내용</div>
      <textarea class="ta" id="nt-body" placeholder="가족에게 공유할 내용을 적어주세요">${n?escapeHtml(n.body||''):''}</textarea>
      <div class="ml">중요 공지</div>
      <button class="type-btn${n&&n.important?' tf':''}" id="nt-important" data-val="${n&&n.important?'1':''}" onclick="this.dataset.val=this.dataset.val?'':'1';this.className='type-btn'+(this.dataset.val?' tf':'')">중요로 고정</button>
      <button class="primary-btn" onclick="saveNotice('${n?n.id:''}')">저장</button>
      <button class="cancel-link" onclick="closeM()">취소</button>
    </div>
  </div>`;
}

function saveNotice(id){
  if(!requireEditMode())return;

  const title=(document.getElementById('nt-title')||{}).value||'';
  const body=(document.getElementById('nt-body')||{}).value||'';
  const important=!!((document.getElementById('nt-important')||{}).dataset||{}).val;
  if(!title.trim())return;
  if(id){
    const n=(notices||[]).find(x=>String(x.id)===String(id)); if(!n)return;
    n.title=title.trim(); n.body=body; n.important=important; n.read=false;
  }else{
    notices.unshift({id:Date.now(),title:title.trim(),body,important,read:false,createdAt:Date.now()});
  }
  saveSettingsOnly();closeM();render();
}

function monthlyStats(){
  const y=calY,m=calM;
  const first=dk(y,m,1), last=dk(y,m,new Date(y,m+1,0).getDate());
  const monthNotes=notes.filter(n=>n.start && n.start>=first && n.start<=last);
  const done=monthNotes.filter(n=>isDone(n)).length;
  const doneRate=monthNotes.length?Math.round(done/monthNotes.length*100):0;
  const reqTotal=requests.length;
  const reqDone=requests.filter(r=>isDone(r)).length;
  const reqRate=reqTotal?Math.round(reqDone/reqTotal*100):0;
  const shiftCount=getShiftCount(y,m);
  return {total:monthNotes.length,done,doneRate,reqTotal,reqDone,reqRate,shiftCount};
}

function renderStatsCard(){
  const s=monthlyStats();
  return `<div class="stat-grid">
    <div class="stat-card"><div class="stat-k">이번 달 완료</div><div class="stat-v">${s.done}/${s.total}</div></div>
    <div class="stat-card"><div class="stat-k">일정 완료율</div><div class="stat-v">${s.doneRate}%</div></div>
    <div class="stat-card"><div class="stat-k">부탁 해결률</div><div class="stat-v">${s.reqRate}%</div></div>
    <div class="stat-card"><div class="stat-k">상태 분포</div><div class="stat-v" style="font-size:14px;line-height:1.7">D ${s.shiftCount.D} · E ${s.shiftCount.E}<br>N ${s.shiftCount.N} · OFF ${s.shiftCount.OFF}</div></div>
  </div>`;
}

function openDetailNote(id){
  openEditNote(id);
}

function downloadBackup(){
  const data=currentData();
  data.backupAt=new Date().toISOString();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`패스_백업_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function openRestore(){
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">백업 복구</div>
      <div style="font-size:13px;color:var(--t2);line-height:1.5">백업 JSON 파일을 선택하면 현재 데이터가 백업 내용으로 교체됩니다.</div>
      <div class="ml">백업 파일</div>
      <input class="mi" type="file" id="restore-file" accept="application/json,.json"/>
      <button class="primary-btn" onclick="restoreBackup()">복구하기</button>
      <button class="cancel-link" onclick="closeM()">취소</button>
    </div>
  </div>`;
}

function restoreBackup(){
  autoBackupBefore('백업 복구 전');

  if(!requireEditMode())return;

  const f=document.getElementById('restore-file')?.files?.[0];
  if(!f)return alert('파일을 선택해 주세요.');
  if(!confirm('현재 데이터를 백업 파일 내용으로 교체할까요?'))return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const d=JSON.parse(reader.result);
      normalizeData(d);
      saveAll();
      closeM();
      render();
      alert('복구 완료');
    }catch(e){
      alert('백업 파일을 읽을 수 없습니다.');
    }
  };
  reader.readAsText(f);
}

function openShareTools(){
  const url=`${location.origin}${location.pathname}?room=${encodeURIComponent(roomId)}`;
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="modal-hd">공유하기</div>
      <div class="share-banner" style="margin:0">
        <div><div class="share-txt">📎 가족 공유 링크</div><div class="share-sub">${url}</div></div>
        <button class="share-btn" onclick="copyShareLink()">복사</button>
      </div>
      <div class="qr-box"><canvas id="qr-canvas"></canvas></div>
      <div class="action-grid">
        <button class="toss-btn primary" onclick="shareNative()">공유</button>
        <button class="toss-btn" onclick="closeM()">닫기</button>
      </div>
    </div>
  </div>`;
  setTimeout(()=>{
    if(window.QRCode){
      QRCode.toCanvas(document.getElementById('qr-canvas'),url,{width:180,margin:1});
    }
  },50);
}

function shareNative(){
  const url=`${location.origin}${location.pathname}?room=${encodeURIComponent(roomId)}`;
  if(navigator.share){
    navigator.share({title:'가족 캘린더 - 패스',text:'가족 일정 공유 링크',url});
  }else{
    copyShareLink();
  }
}


let __renderErrorCount=0;
let __modalObserverReady=false;
let __repeatEditDrafts={};
let __touchReorderPending=null;
function htmlJoin(parts){return (parts||[]).filter(Boolean).join('');}
function bodyEl(){return document.getElementById('body');}
function renderErrorView(err){
  const msg=err&&err.message?err.message:'화면을 그리는 중 오류가 있었어요.';
  return `<div class="widget-wrap"><div class="widget-card render-error-card">
    <div class="render-error-title">화면 표시를 잠시 정리하고 있어요</div>
    <div class="render-error-sub">${escapeHtml(msg)}</div>
    <button class="toss-btn primary" onclick="location.reload()">새로고침</button>
  </div></div>`;
}
function clearTransientInteractionState(){
  clearTimeout(touchReorderTimer);
  __touchReorderPending=null;
  if(itemSwipe&&itemSwipe.card){
    itemSwipe.card.style.transition='';
    itemSwipe.card.style.transform='';
    itemSwipe.card.classList.remove('swipe-card-active','swipe-complete','swipe-actions');
  }
  itemSwipe=null;
  if(touchReorderInfo?.el)touchReorderInfo.el.classList.remove('dragging');
  touchReorderInfo=null;
  document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
}
function setupModalStateObserver(){
  if(__modalObserverReady)return;
  const modal=document.getElementById('modal');
  if(!modal)return;
  __modalObserverReady=true;
  const sync=()=>document.body.classList.toggle('modal-open',!!modal.children.length);
  new MutationObserver(sync).observe(modal,{childList:true});
  sync();
}
let __smartFabScrollReady=false;
function setupSmartFabScroll(){
  if(__smartFabScrollReady)return;
  __smartFabScrollReady=true;
  const sync=()=>{
    const y=Math.max(
      window.scrollY||0,
      document.documentElement?.scrollTop||0,
      document.body?.scrollTop||0,
      document.scrollingElement?.scrollTop||0,
      document.getElementById('app')?.scrollTop||0,
      document.getElementById('body')?.scrollTop||0
    );
    document.body.classList.toggle('smart-fab-compact',y>80);
  };
  window.addEventListener('scroll',sync,{passive:true});
  document.addEventListener('scroll',sync,{passive:true,capture:true});
  window.addEventListener('wheel',()=>document.body.classList.add('smart-fab-compact'),{passive:true});
  window.addEventListener('touchmove',()=>document.body.classList.add('smart-fab-compact'),{passive:true});
  window.addEventListener('keydown',e=>{
    if(['PageDown','ArrowDown','Space','End'].includes(e.key))document.body.classList.add('smart-fab-compact');
    if(['Home'].includes(e.key))sync();
  });
  setInterval(sync,250);
  sync();
}
function formHasUnsavedRepeatDraft(ii){
  const draft=__repeatEditDrafts[ii];
  const item=repeatItems[ii];
  return !!(draft&&item&&JSON.stringify({days:draft.days,pauseOnVacation:draft.pauseOnVacation,who:draft.who,title:draft.title,start:draft.start,repeatEnd:draft.repeatEnd,sT:draft.sT,eT:draft.eT})!==JSON.stringify({days:item.days,pauseOnVacation:item.pauseOnVacation,who:item.who,title:item.title,start:item.start,repeatEnd:item.repeatEnd,sT:item.sT,eT:item.eT}));
}

let __renderDebounceTimer=null;
let __renderDebounceOpts={};
function _renderImpl(opts={}){
  const preserve=opts.preserveScroll!==false;
  const y=preserve?(window.scrollY||document.documentElement?.scrollTop||0):0;
  const body=bodyEl();
  if(!body)return;
  try{
    let h='';
    if(main==='s')h=renderS();
    else if(main==='c')h=renderC();
    else if(main==='i')h=renderI();
    else if(main==='r')h=renderR();
    else if(main==='m')h=renderM();
    else if(main==='set')h=renderSettingsTab();
    else {main='s';h=renderS();}
    body.innerHTML=htmlJoin([renderTopSwipeZone(),renderFirstUseGuide(),renderSearchBox(),h,renderFab()]);
    updateSettingsTabAvatar();
    __renderErrorCount=0;
  }catch(e){
    console.warn('render failed',e);
    __renderErrorCount++;
    body.innerHTML=renderErrorView(e);
    if(__renderErrorCount>2){main='s';searchQ='';searchDraft='';filterToday=false;}
  }
  setupModalStateObserver();
  setupSmartFabScroll();
  if(preserve){
    requestAnimationFrame(()=>{try{window.scrollTo(0,y)}catch(e){}});
  }
}
function render(opts={}){
  if(opts.preserveScroll===false)__renderDebounceOpts.preserveScroll=false;
  clearTimeout(__renderDebounceTimer);
  __renderDebounceTimer=setTimeout(()=>{
    const o=__renderDebounceOpts;
    __renderDebounceOpts={};
    _renderImpl(o);
  },16);
}

function copyShareLink(){
  const url=`${location.origin}${location.pathname}?room=${encodeURIComponent(roomId)}`;
  if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>alert('가족 공유 링크가 복사됐어요.'));}
  else{alert('주소창의 URL을 복사해서 가족에게 보내주세요:\n'+url);}
}


function personChoiceButtons(selected){
  return getPersons().map(p=>`<button type="button" class="type-btn person-check-label avatar-only${p===selected?' selected tf':''}" id="who-${escapeAttr(p)}" onclick="selWho(${onclickArg(p)})" aria-label="${escapeAttr(p)}" title="${escapeAttr(p)}">
    ${avatarMarkup(personAvatar(p),p,'avatar-img-small')}
  </button>`).join('');
}
function repeatPersonChoiceButtons(ii,selected){
  return getPersons().map(p=>`<button type="button" class="type-btn person-check-label repeat-person-choice avatar-only${p===selected?' selected tf':''}" data-repeat-who="${ii}" data-who="${escapeAttr(p)}" onclick="selectRepeatModalWho(${ii},${onclickArg(p)})" aria-label="${escapeAttr(p)}" title="${escapeAttr(p)}">
    ${avatarMarkup(personAvatar(p),p,'avatar-img-small')}
  </button>`).join('');
}
function selectRepeatModalWho(ii,who){
  const hid=document.getElementById(`re-who-${ii}`);
  if(hid)hid.value=who||'공통';
  document.querySelectorAll(`[data-repeat-who="${ii}"]`).forEach(b=>{
    b.classList.toggle('selected', b.dataset.who===String(who||'공통'));
    b.classList.toggle('tf', b.dataset.who===String(who||'공통'));
  });
}

function openAddModal(dateVal){
  _mType='family';
  _mWho=getPersons()[0]||'공통';
  const startDate=dateVal||todayKey();
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet schedule-edit-sheet add-flow-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="add-flow-head">
        <div>
          <div class="modal-hd">일정 추가</div>
        </div>
      </div>
      <div class="add-flow-card">
        <div class="add-step-head"><span>WHO</span><b>누가</b></div>
        <div class="type-sel person-chip-selector add-person-row">
          ${personChoiceButtons(_mWho)}
        </div>
      </div>
      <div class="add-flow-card">
        <div class="add-step-head add-when-head">
          <span>WHEN</span><b>언제</b>
        </div>
        <div class="add-when-grid add-when-compact">
          <div class="add-when-date"><div class="sublabel">날짜</div><input class="picker-field" id="m-sd" readonly data-val="${startDate}" value="${dateLabel(startDate)}" onclick="openDatePicker('m-sd')"/></div>
          <div class="add-when-time-summary"><div class="sublabel">시간</div><button type="button" class="picker-field add-time-summary empty" id="m-time-summary" onclick="toggleScheduleTimeFields('m')">시간 없음</button></div>
        </div>
        <div class="add-time-fields" id="m-time-fields">
          <div><div class="sublabel">시작</div><input class="picker-field empty" id="m-st" readonly data-val="" value="시간 없음" onclick="openTimePicker('m-st')"/></div>
          <div><div class="sublabel">종료</div><input class="picker-field empty" id="m-et" readonly data-val="" value="시간 없음" onclick="openTimePicker('m-et')"/></div>
        </div>
      </div>
      <div class="add-flow-card add-what-card">
        <div class="add-step-head add-what-head">
          <span>WHAT</span><b>무엇을</b>
          <div class="add-option-row">
            <label class="add-option-chip add-repeat-inline-toggle what-repeat-toggle" id="m-repeat-chip"><input type="checkbox" id="m-repeat-on" onchange="toggleAddRepeatInline()"><span>↻ 반복</span></label>
            <button type="button" class="private-inline-toggle share-toggle" id="m-private" data-val="" onclick="togglePrivateField('m-private')" aria-label="가족 공유 일정"><span class="private-lock-icon" aria-hidden="true">${shareToggleSvg()}</span><span class="private-toggle-text">공유</span></button>
          </div>
          <input class="picker-field add-repeat-end-inline empty" id="m-re" readonly data-val="" value="종료 없음" onclick="openDatePicker('m-re')"/>
        </div>
        <input class="mi add-title-input" id="m-ti" placeholder="무엇을 하나요?"/>
      </div>
      <details class="detail-settings schedule-extra-settings">
        <summary>반복, 알림, 메모 더 설정</summary>
        <div class="detail-settings-panel">
          <select class="mi add-repeat-hidden-select" id="m-rp" aria-hidden="true" tabindex="-1">
            <option value="">반복 없음</option>
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
            <option value="monthly">매월</option>
          </select>
          <input type="hidden" id="m-ed" data-val=""/>
          <input type="hidden" id="m-alert" value=""/>
          <div class="schedule-alert-row">
            <div>
              <div class="ml">알림</div>
              <div class="schedule-alert-helper">필요할 때만 켜요</div>
            </div>
            <button type="button" class="schedule-alert-chip off" aria-label="알림 꺼짐">OFF</button>
          </div>
          <div class="ml">메모</div>
          <textarea class="ta schedule-memo-field" id="m-cm" placeholder="준비물이나 참고사항을 적어보세요"></textarea>
        </div>
      </details>
      <button class="primary-btn" onclick="saveNote()">저장</button>
      <button class="cancel-link" onclick="closeM()">취소</button>
    </div>
  </div>`;
}
function selT(t){
  _mType=t;
  document.getElementById('btn-p').className='type-btn'+(t==='personal'?' tp':'');
  document.getElementById('btn-w').className='type-btn'+(t==='work'?' tw':'');
  document.getElementById('btn-f').className='type-btn'+(t==='family'?' tf':'');
}

function selWho(w){
  _mWho=w;
  getPersons().forEach(p=>{
    const el=document.getElementById('who-'+p);
    if(el){
      el.classList.toggle('selected', p===w);
      el.classList.toggle('tf', p===w);
      if(el.classList.contains('person-check-label')){
        el.className='type-btn person-check-label'+(p===w?' selected tf':'');
      }else{
        el.className='type-btn'+(p===w?' tf':'');
      }
    }
  });
}

function toggleAddRepeatInline(){
  const on=!!(document.getElementById('m-repeat-on')||{}).checked;
  const repeat=document.getElementById('m-rp');
  const end=document.getElementById('m-re');
  const chip=document.getElementById('m-repeat-chip');
  if(repeat)repeat.value=on?'weekly':'';
  if(chip)chip.classList.toggle('on',on);
  if(end){
    end.classList.toggle('show',on);
    if(!on){
      end.dataset.val='';
      end.value='종료 없음';
      end.classList.add('empty');
    }
  }
}

function saveNote(){
  if(!requireEditMode())return;
  const ti=(document.getElementById('m-ti')||{}).value||'';
  if(!ti.trim()){
    alert('일정 이름을 먼저 적어주세요!');
    return;
  }
  const newNote={
    id:Date.now(),
    title:ti.trim(),
    who:_mWho,
    type:_mType,
    repeat:(document.getElementById('m-rp')||{}).value||'',
    repeatEnd:getPickerVal('m-re'),
    start:getPickerVal('m-sd'),
    end:getPickerVal('m-ed'),
    sT:getPickerVal('m-st'),
    eT:getPickerVal('m-et'),
    done:false,
    alertMemo:'',
    isPrivate:((document.getElementById('m-private')||{}).dataset||{}).val==='1',
    comment:(document.getElementById('m-cm')||{}).value||''
  };
  const dup=notes.some(n=>!isDone(n)&&n.title===newNote.title&&n.start===newNote.start&&(n.who||'공통')===newNote.who);
  if(dup && !confirm('같은 날짜에 같은 일정이 있어요. 그래도 추가할까요?'))return;
  if(!confirmScheduleConflicts(newNote,''))return;
  notes.push(newNote);
  addChangeLog(`일정 추가: ${newNote.who||'공통'} · ${newNote.title}`);
  saveNoteOnly(newNote);
  closeM();
  render({preserveScroll:true});
  showToast('일정을 등록했어요 👏');
}

function openEditNote(id){
  const n=notes.find(x=>String(x.id)===String(id));if(!n)return;
  _mType=n.type||'family';
  _mWho=n.who||getPersons()[0]||'공통';
  const startDate=n.start||todayKey();
  const privateOn=!!n.isPrivate;
  const memoText=n.comment||n.alertMemo||'';
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet schedule-edit-sheet add-flow-sheet schedule-edit-flow" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="add-flow-head">
        <div>
          <div class="modal-hd">일정 수정</div>
          <p>누가, 언제, 무엇을만 먼저 확인하면 돼요.</p>
        </div>
      </div>
      <div class="add-flow-card">
        <div class="add-step-head"><span>WHO</span><b>누가</b></div>
        <div class="type-sel person-chip-selector add-person-row">
          ${personChoiceButtons(_mWho)}
        </div>
      </div>
      <div class="add-flow-card">
        <div class="add-step-head"><span>WHEN</span><b>언제</b></div>
        <div class="add-when-grid add-when-compact">
          <div class="add-when-date"><div class="sublabel">날짜</div><input class="picker-field" id="e-sd" readonly data-val="${startDate}" value="${dateLabel(startDate)}" onclick="openDatePicker('e-sd')"/></div>
          <div class="add-when-time-summary"><div class="sublabel">시간</div><button type="button" class="picker-field add-time-summary${(n.sT||n.eT)?'':' empty'}" id="e-time-summary" onclick="toggleScheduleTimeFields('e')">${n.sT&&n.eT?`${timeLabel(n.sT)} - ${timeLabel(n.eT)}`:n.sT?timeLabel(n.sT):n.eT?`종료 ${timeLabel(n.eT)}`:'시간 없음'}</button></div>
        </div>
        <div class="add-time-fields${(n.sT||n.eT)?' show has-time':''}" id="e-time-fields">
          <div><div class="sublabel">시작</div><input class="picker-field${n.sT?'':' empty'}" id="e-st" readonly data-val="${n.sT||''}" value="${n.sT?timeLabel(n.sT):'시간 없음'}" onclick="openTimePicker('e-st')"/></div>
          <div><div class="sublabel">종료</div><input class="picker-field${n.eT?'':' empty'}" id="e-et" readonly data-val="${n.eT||''}" value="${n.eT?timeLabel(n.eT):'시간 없음'}" onclick="openTimePicker('e-et')"/></div>
        </div>
      </div>
      <div class="add-flow-card add-what-card">
        <div class="add-step-head add-what-head">
          <span>WHAT</span><b>무엇을</b>
          <div class="add-option-row">
            <button type="button" class="private-inline-toggle share-toggle${privateOn?' tf':''}" id="e-private" data-val="${privateOn?'1':''}" onclick="togglePrivateField('e-private')" aria-label="${privateOn?'나만 보는 일정':'가족 공유 일정'}"><span class="private-lock-icon" aria-hidden="true">${shareToggleSvg()}</span><span class="private-toggle-text">${privateOn?'나만':'공유'}</span></button>
          </div>
        </div>
        <input class="mi add-title-input" id="e-ti" value="${escapeAttr(n.title||'')}" placeholder="무엇을 하나요?"/>
      </div>
      <details class="detail-settings schedule-extra-settings">
        <summary>반복, 알림, 메모 더 설정</summary>
        <div class="detail-settings-panel">
          <div class="add-repeat-grid">
            <div>
              <div class="sublabel">반복</div>
              <select class="mi" id="e-rp">
                <option value="" ${!n.repeat?'selected':''}>반복 없음</option>
                <option value="daily" ${n.repeat==='daily'?'selected':''}>매일</option>
                <option value="weekly" ${n.repeat==='weekly'?'selected':''}>매주</option>
                <option value="monthly" ${n.repeat==='monthly'?'selected':''}>매월</option>
              </select>
            </div>
            <div>
              <div class="sublabel">반복 종료일</div>
              <input class="picker-field${n.repeatEnd?'':' empty'}" id="e-re" readonly data-val="${n.repeatEnd||''}" value="${n.repeatEnd?dateLabel(n.repeatEnd):'종료 없음'}" onclick="openDatePicker('e-re')"/>
            </div>
          </div>
          <input type="hidden" id="e-ed" data-val="${n.end||''}"/>
          <input type="hidden" id="e-alert" value=""/>
          <div class="schedule-alert-row">
            <div>
              <div class="ml">알림</div>
              <div class="schedule-alert-helper">필요할 때만 켜요</div>
            </div>
            <button type="button" class="schedule-alert-chip off" aria-label="알림 꺼짐">OFF</button>
          </div>
          <div class="ml">메모</div>
          <textarea class="ta schedule-memo-field" id="e-cm" placeholder="준비물이나 참고사항을 적어보세요">${escapeHtml(memoText)}</textarea>
        </div>
      </details>
      <div class="edit-sheet-actions">
        <button class="primary-btn" onclick="saveEditNote('${id}')">저장</button>
        <button class="edit-danger-text" onclick="delNote('${id}');closeM()">일정 삭제</button>
      </div>
    </div>
  </div>`;
}
function saveEditNote(id){
  if(!requireEditMode())return;
  const n=notes.find(x=>String(x.id)===String(id));if(!n)return;
  const title=(document.getElementById('e-ti')||{}).value||'';
  if(!title.trim()){
    alert('일정 이름을 먼저 적어주세요!');
    return;
  }
  const before={...n};
  const next={
    ...n,
    title:title.trim(),
    type:_mType||n.type||'family',
    who:_mWho,
    repeat:(document.getElementById('e-rp')||{}).value||'',
    repeatEnd:getPickerVal('e-re'),
    start:getPickerVal('e-sd'),
    end:getPickerVal('e-ed'),
    sT:getPickerVal('e-st'),
    eT:getPickerVal('e-et'),
    alertMemo:'',
    isPrivate:((document.getElementById('e-private')||{}).dataset||{}).val==='1',
    comment:document.getElementById('e-cm').value
  };
  if(!confirmScheduleConflicts(next,id))return;
  Object.assign(n,next);
  const changed=[];
  if(before.title!==n.title)changed.push(`제목 ${before.title||''} → ${n.title||''}`);
  if(before.start!==n.start||before.sT!==n.sT||before.eT!==n.eT)changed.push(`시간 ${dateTimeRange(before)||'미정'} → ${dateTimeRange(n)||'미정'}`);
  if(before.who!==n.who)changed.push(`대상 ${before.who||'공통'} → ${n.who||'공통'}`);
  addChangeLog(`일정 수정: ${n.title||'일정'}${changed.length?` (${changed.join(', ')})`:''}`);
  saveNoteOnly(n);
  closeM();
  render({preserveScroll:true});
  showToast('일정을 저장했어요 👏');
}

function addKidVacation(ki){
  if(!requireEditMode())return;
  if(!family[ki])return;
  if(!Array.isArray(family[ki].vacations))family[ki].vacations=[];
  family[ki].vacations.push({start:'',end:''});
  saveSettingsOnly();
  editKid(ki);
}
function delKidVacation(ki,vi){
  if(!requireEditMode())return;
  if(!family[ki]||!Array.isArray(family[ki].vacations))return;
  family[ki].vacations.splice(vi,1);
  saveSettingsOnly();
  editKid(ki);
}
function updateFamilyVacationPicker(id,val){
  if(!id||!id.startsWith('kv-'))return;
  const parts=id.split('-');
  const kind=parts[1];
  const ki=+parts[2];
  const vi=+parts[3];
  if(family[ki]&&Array.isArray(family[ki].vacations)&&family[ki].vacations[vi]){
    if(kind==='sd')family[ki].vacations[vi].start=val||'';
    if(kind==='ed')family[ki].vacations[vi].end=val||'';
    saveSettingsOnly();
  }
}
function isPersonVacation(personName,date){
  const personObj=(family||[]).find(f=>(f.name||'').trim()===(personName||'공통'));
  if(!personObj)return false;
  const vacations=Array.isArray(personObj.vacations)?personObj.vacations:[];
  return vacations.some(v=>v.start&&v.end&&date>=v.start&&date<=v.end);
}
function vacationSummary(kid){
  const list=Array.isArray(kid.vacations)?kid.vacations:[];
  return list.filter(v=>v.start||v.end).map(v=>`${v.start?dateLabel(v.start):'시작일'} ~ ${v.end?dateLabel(v.end):'종료일'}`).join(' · ');
}

function selectKidProfileColor(color){
  const el=document.getElementById('k-color');
  if(el)el.value=color||'';
  document.querySelectorAll('.kid-color-choice').forEach(b=>{
    b.classList.toggle('on', b.dataset.color===String(color||''));
  });
  const dot=document.getElementById('kid-color-preview-dot');
  if(dot)dot.style.background=color||'';
  const text=document.getElementById('kid-color-preview-text');
  if(text)text.textContent=color||'기본색';
}
function openKidProfilePanel(id){
  document.querySelectorAll('.kid-subpanel').forEach(p=>p.classList.remove('show'));
  const panel=document.getElementById(id);
  if(panel)panel.classList.add('show');
}
function closeKidProfilePanels(){
  document.querySelectorAll('.kid-subpanel').forEach(p=>p.classList.remove('show'));
}

function editKid(i){
  const k=family[i];
  if(!k)return;
  if(!Array.isArray(k.vacations))k.vacations=[];
  const curAvatar=resolveAvatarId(k.avatarId||k.avatar||defaultAvatarForName(k.name));
  const curAvatarType=k.avatarType||(k.avatarUrl?'photo':(k.avatarEmoji?'emoji':'default'));
  const curAvatarEmoji=k.avatarEmoji||'';
  const curAvatarUrl=k.avatarUrl||'';
  const curColor=k.color||defaultPersonColor(k.name);
  const vacHtml=(k.vacations||[]).map((v,vi)=>{
    const idp=`${i}-${vi}`;
    return `<div class="vacation-row">
      <div class="vacation-date-field">
        <div class="sublabel">시작일</div>
        <input class="picker-field${v.start?'':' empty'}" id="kv-sd-${idp}" readonly data-val="${v.start||''}" value="${v.start?dateLabel(v.start):'시작일'}" onclick="openDatePicker('kv-sd-${idp}')"/>
      </div>
      <span class="vacation-wave">~</span>
      <div class="vacation-date-field">
        <div class="sublabel">개학일</div>
        <input class="picker-field${v.end?'':' empty'}" id="kv-ed-${idp}" readonly data-val="${v.end||''}" value="${v.end?dateLabel(v.end):'종료일'}" onclick="openDatePicker('kv-ed-${idp}')"/>
      </div>
      <button class="vacation-del" onclick="event.stopPropagation();delKidVacation(${i},${vi})">✕</button>
    </div>`;
  }).join('');

  const quietColors=PERSON_COLOR_PALETTE.slice(0,6);
  const avatarGroups=DEFAULT_AVATAR_GROUPS.filter(g=>!/(공용|할머니)/.test(g.label||'')).slice(0,4);
  const vacationText=vacationSummary(k)||'등록된 방학이 없어요';
  const shiftStatus=shiftUsers.includes(k.name)?'근무표 표시 중':'근무표 미표시';
  document.getElementById('modal').innerHTML=`
  <div class="modal-bg" onclick="closeM(event)">
    <div class="modal-sheet profile-edit-sheet profile-state-sheet" onclick="event.stopPropagation()">
      <div class="modal-ind"></div>
      <div class="profile-state-head">
        <div id="kid-avatar-preview" class="profile-state-avatar">${avatarFrameMarkup({avatarType:curAvatarType,avatarId:curAvatar,avatarEmoji:curAvatarEmoji,avatarUrl:curAvatarUrl,color:curColor},k.name,'avatarFrame profile-state-avatar-frame')}</div>
        <div class="profile-state-title-wrap">
          <div class="modal-hd">${escapeHtml(k.name||'가족')}</div>
          <div class="profile-state-sub">현재 프로필과 일정 표시 기준</div>
        </div>
      </div>

      <div class="profile-state-card">
        <label class="profile-state-row profile-name-row">
          <span>이름</span>
          <input id="k-n" value="${escapeAttr(k.name)}" aria-label="이름"/>
        </label>
        <button type="button" class="profile-state-row" onclick="openKidProfilePanel('kid-avatar-panel')">
          <span>현재 아바타</span>
          <em>변경</em>
        </button>
        <button type="button" class="profile-state-row" onclick="openKidProfilePanel('kid-color-panel')">
          <span>대표색</span>
          <em><i id="kid-color-preview-dot" style="background:${escapeAttr(curColor)}"></i><b id="kid-color-preview-text">${escapeHtml(curColor)}</b></em>
        </button>
        <div class="profile-state-row muted">
          <span>근무 유형</span>
          <em>${escapeHtml(shiftStatus)}</em>
        </div>
      </div>

      <input type="hidden" id="k-color" value="${escapeAttr(curColor)}"/>
      <input type="hidden" id="k-avatar" value="${escapeAttr(curAvatar)}"/>
      <input type="hidden" id="k-avatar-id" value="${escapeAttr(curAvatar)}"/>
      <input type="hidden" id="k-avatar-type" value="${escapeAttr(curAvatarType)}"/>
      <input type="hidden" id="k-avatar-emoji" value="${escapeAttr(curAvatarEmoji)}"/>
      <input type="hidden" id="k-avatar-url" value="${escapeAttr(curAvatarUrl)}"/>
      <input type="hidden" id="k-avatar-custom" value="${k.avatarCustom?'1':''}"/>

      <div class="profile-state-section">
        <div class="profile-state-section-head">
          <div>
            <b>학사 일정</b>
            <span>${escapeHtml(vacationText)}</span>
          </div>
          <button class="cat-add" onclick="event.stopPropagation();addKidVacation(${i})">추가</button>
        </div>
        <div class="vacation-box profile-vacation-box">
          ${vacHtml || '<div class="empty compact-empty">방학 기간이 없어요</div>'}
        </div>
      </div>

      <div class="kid-subpanel" id="kid-avatar-panel" onclick="event.stopPropagation()">
        <div class="kid-subpanel-bar"></div>
        <div class="kid-subpanel-head">
          <b>아바타 변경</b>
          <button type="button" onclick="closeKidProfilePanels()">닫기</button>
        </div>
        <div class="avatar-system-panel compact-avatar-actions">
          <label class="avatar-upload-btn">사진 업로드<input type="file" accept="image/*" onchange="handleKidPhotoFile(this)"/></label>
          <button type="button" class="avatar-clear-btn" onclick="clearKidPhotoAvatar()">기본으로</button>
        </div>
        <div class="avatar-select-grid quiet-avatar-select-grid">
        ${avatarGroups.map(g=>`<div class="avatar-group">
          <div class="avatar-group-title">${escapeHtml(g.label)}</div>
          <div class="avatar-options">${g.items.map(ic=>`<button type="button" class="avatar-choice${resolveAvatarId(ic)===curAvatar&&curAvatarType==='default'?' on':''}" data-avatar="${escapeAttr(ic)}" onclick="selectKidAvatar(${onclickArg(ic)})">${avatarFrameMarkup({avatarType:'default',avatarId:ic},g.label,'avatarFrame avatar-picker-frame')}</button>`).join('')}</div>
        </div>`).join('')}
        <div class="avatar-group">
          <div class="avatar-group-title">이모지</div>
          <div class="avatar-options">${AVATAR_EMOJI_OPTIONS.slice(0,8).map(em=>`<button type="button" class="avatar-choice avatar-emoji-choice${curAvatarType==='emoji'&&curAvatarEmoji===em?' on':''}" data-emoji="${escapeAttr(em)}" onclick="selectKidEmojiAvatar(${onclickArg(em)})"><span class="avatarFrame avatar-picker-frame"><span class="avatar-emoji">${escapeHtml(em)}</span></span></button>`).join('')}</div>
        </div>
        </div>
      </div>

      <div class="kid-subpanel" id="kid-color-panel" onclick="event.stopPropagation()">
        <div class="kid-subpanel-bar"></div>
        <div class="kid-subpanel-head">
          <b>대표색 변경</b>
          <button type="button" onclick="closeKidProfilePanels()">닫기</button>
        </div>
        <div class="kid-color-choice-row quiet-color-choice-row">
          ${quietColors.map(c=>`<button type="button" class="color-choice kid-color-choice${c===curColor?' on':''}" data-color="${escapeAttr(c)}" onclick="selectKidProfileColor('${escapeAttr(c)}')" style="background:${c}"></button>`).join('')}
        </div>
      </div>

      <div class="profile-state-actions">
        <button class="primary-btn" onclick="saveKid(${i})">저장</button>
        <button class="edit-danger-text" onclick="delKid(${i})">이 가족 삭제</button>
      </div>
    </div>
  </div>`;
}
function addKid(){
  if(!requireEditMode())return;
  const name='새 대상';
  const avatar=defaultAvatarForName(name);
  family.push({id:Date.now(),name,avatar,avatarId:avatar,avatarType:'default',avatarEmoji:'',avatarUrl:'',avatarCustom:false,grade:'',year:'',cls:'',num:'',cats:[],showToday:false,showRoutine:false,showRequestWriter:true,vacations:[]});
  saveSettingsOnly();editKid(family.length-1);
}
function saveKid(i){
  if(!requireEditMode())return;
  const old=family[i]||{};
  const name=(document.getElementById('k-n')||{}).value||'';
  if(!name.trim()){
    alert('대상 이름을 먼저 적어주세요!');
    return;
  }
  const custom=(document.getElementById('k-avatar-custom')||{}).value==='1';
  let avatar=(document.getElementById('k-avatar')||{}).value||'';
  let avatarId=(document.getElementById('k-avatar-id')||{}).value||avatar;
  const avatarType=(document.getElementById('k-avatar-type')||{}).value||'default';
  const avatarEmoji=(document.getElementById('k-avatar-emoji')||{}).value||'';
  const avatarUrl=(document.getElementById('k-avatar-url')||{}).value||'';
  const color=(document.getElementById('k-color')||{}).value||old.color||defaultPersonColor(name);
  if(!custom && (old.name||'')!==name){
    avatar=defaultAvatarForName(name);
    avatarId=avatar;
  }
  if(!avatar)avatar=defaultAvatarForName(name);
  const finalAvatarId=avatarId||avatar;
  family[i]={...old,
    name:name.trim(),
    avatar:resolveAvatarId(finalAvatarId),
    avatarId:finalAvatarId,
    avatarType,
    avatarEmoji,
    avatarUrl,
    avatarCustom:custom,
    color,
    grade:'',
    year:'',
    cls:'',
    num:'',
    vacations:Array.isArray(old.vacations)?old.vacations:[]
  };
  delete family[i].vacationStart;
  delete family[i].vacationEnd;
  saveSettingsOnly();
  closeM();
  render({preserveScroll:true});
  showToast('대상 정보를 저장했어요.');
}

function getPickerVal(id){
  const el=document.getElementById(id);
  return el ? (el.dataset.val||'') : '';
}
function dateLabel(v){
  if(!v)return '';
  const p=v.split('-');
  return `${+p[0]}. ${+p[1]}. ${+p[2]}.`;
}
function fullDateWithDow(v){
  if(!v)return '';
  const [y,m,d]=String(v).split('-').map(Number);
  if(!y||!m||!d)return dateLabel(v);
  const dow=DAYS[new Date(y,m-1,d).getDay()]||'';
  return `${y}. ${m}. ${d}. (${dow})`;
}

function timeLabel(v){
  if(!v)return '';
  const [h,m]=v.split(':').map(Number);
  const ap=h<12?'오전':'오후';
  const hh=h%12===0?12:h%12;
  return `${ap} ${hh}:${String(m).padStart(2,'0')}`;
}
function setPickerField(id,val,label,emptyText){
  const el=document.getElementById(id);
  if(!el)return;
  el.dataset.val=val||'';
  el.value=val?label:emptyText;
  el.classList.toggle('empty',!val);
  if(/^[me]-(st|et)$/.test(id||'')){
    const prefix=id.charAt(0);
    if(val)toggleScheduleTimeFields(prefix,true);
    else syncScheduleTimeSummary(prefix);
  }
  if(/^rp-(st|et)-/.test(id||'')){
    const ii=+String(id).split('-')[2];
    if(Number.isFinite(ii)){
      if(val)toggleRepeatTimeFields(ii,true);
      else syncRepeatTimeSummary(ii);
    }
  }
  updateRepeatPicker(id,val||'');
  updateFamilyVacationPicker(id,val||'');
}
function updateRepeatPicker(id,val){
  if(!id || !id.startsWith('rp-'))return;
  const parts=id.split('-');
  const kind=parts[1];
  const ii=+parts[2];
  const item=repeatItems?.[ii];
  if(!item)return;
  const map={sd:'start',st:'sT',et:'eT',re:'repeatEnd'};
  const key=map[kind];
  if(!key)return;
  item[key]=val||'';
  saveSettingsOnly();
}
function updateFamilyRepeatPicker(id,val){}
function pickerRoot(){
  let p=document.getElementById('picker');
  if(!p){
    p=document.createElement('div');
    p.id='picker';
    document.body.appendChild(p);
  }
  return p;
}
function closePicker(){
  const p=document.getElementById('picker');
  if(p)p.innerHTML='';
}

let pickerCalY=TY,pickerCalM=TM,pickerTargetId='';
function datePickerTitle(id){
  if(id==='m-sd'||id==='e-sd')return '일정 날짜 선택';
  if(id==='rq-date-view')return '부탁한 날 선택';
  if(id==='rq-due-date')return '마감일 선택';
  if(id==='m-re'||id==='e-re'||String(id||'').includes('-re'))return '반복 종료일 선택';
  return '날짜 선택';
}
function renderDatePickerCalendarGrid(targetId){
  const y=pickerCalY,m=pickerCalM;
  ensureHolidayYear(y);
  const selected=getPickerVal(targetId);
  const dInM=new Date(y,m+1,0).getDate();
  const firstDay=new Date(y,m,1).getDay();
  let g='';
  DAYS.forEach((d,idx)=>{g+=`<div class="cal-dname${idx===0?' sun-dname':idx===6?' sat-dname':''}">${d}</div>`});
  for(let i=0;i<firstDay;i++)g+=`<div class="date-picker-empty"></div>`;
  for(let d=1;d<=dInM;d++){
    const key=dk(y,m,d);
    const dayOfWeek=new Date(y,m,d).getDay();
    const hName=holidayName(key);
    const isToday=y===TY&&m===TM&&d===TD;
    const isSel=selected===key;
    const allEvs=notesOnDateAll(y,m,d);
    const allMems=memoriesOnDate(y,m,d);
    const evs=filterCalendarEventsByTarget(allEvs);
    const mems=filterCalendarMemoriesByTarget(allMems);
    const dotHtml=renderCalendarCellDots(allEvs,allMems);
    const numCls=isToday?' today-n':(hName||dayOfWeek===0?' holiday-n':(dayOfWeek===6?' sat-n':''));
    g+=`<button type="button" class="cal-cell date-picker-day${isSel?' sel':''}" onclick="selectDatePickerDay('${targetId}','${key}')" aria-label="${dateLabel(key)}">
      <div class="cal-date-line"><div class="cal-num${numCls}" ${hName?`title="${escapeAttr(hName)}"`:''}>${d}</div></div>
      <div class="cal-shift-line">${renderCalendarShiftBadges(key)}</div>
      <div class="cal-dots">${dotHtml}</div>
    </button>`;
  }
  return g;
}
function renderDatePickerCalendar(targetId){
  return `
  <div class="picker-bg action-picker-bg date-action-picker calendar-date-picker" onclick="closePicker()">
    <div class="picker-sheet action-picker-sheet date-calendar-sheet" onclick="event.stopPropagation()">
      <div class="date-picker-nav">
        <button type="button" class="cal-nav-btn" onclick="changeDatePickerMonth(-1)" aria-label="이전 달">‹</button>
        <div class="cal-nav-title">${pickerCalY}년 ${pickerCalM+1}월</div>
        <button type="button" class="cal-nav-btn" onclick="changeDatePickerMonth(1)" aria-label="다음 달">›</button>
      </div>
      <div class="picker-title">${datePickerTitle(targetId)}</div>
      <div class="cal-grid date-picker-calendar-grid">${renderDatePickerCalendarGrid(targetId)}</div>
      <div class="picker-actions date-calendar-actions">
        <button class="picker-cancel" onclick="setPickerField('${targetId}','','','날짜 없음');closePicker()">비우기</button>
        <button class="picker-save" onclick="closePicker()">닫기</button>
      </div>
    </div>
  </div>`;
}
function changeDatePickerMonth(delta){
  pickerCalM+=delta;
  if(pickerCalM<0){pickerCalM=11;pickerCalY--}
  if(pickerCalM>11){pickerCalM=0;pickerCalY++}
  const root=pickerRoot();
  if(root&&pickerTargetId)root.innerHTML=renderDatePickerCalendar(pickerTargetId);
}
function selectDatePickerDay(id,val){
  setPickerField(id,val,dateLabel(val),'날짜 없음');
  if(id==='rq-date-view'){
    const hidden=document.getElementById('rq-date');
    if(hidden){
      hidden.dataset.val=val||'';
      hidden.value=val?dateLabel(val):'날짜 없음';
    }
  }
  closePicker();
}

function openBirthPicker(id){
  const cur=getPickerVal(id)||'2000-01-01';
  const [cy,cm,cd]=cur.split('-').map(Number);
  const century=cy<2000?19:20;
  const yy=cy%100===0?100:cy%100;
  const opts=(arr,sel,fmt=x=>x)=>arr.map(v=>`<option value="${v}" ${v===sel?'selected':''}>${fmt(v)}</option>`).join('');
  pickerRoot().innerHTML=`
  <div class="picker-bg" onclick="closePicker()">
    <div class="picker-sheet" onclick="event.stopPropagation()">
      <div class="picker-title">생년월일 선택</div>
      <div class="picker-grid" style="grid-template-columns:0.8fr 1fr 1fr 1fr">
        <select class="picker-select" id="bp-c">
          <option value="19" ${century===19?'selected':''}>19</option>
          <option value="20" ${century===20?'selected':''}>20</option>
        </select>
        <select class="picker-select" id="bp-y">${opts(Array.from({length:99},(_,i)=>i+1),yy,v=>`${String(v).padStart(2,'0')}년`)}</select>
        <select class="picker-select" id="bp-m">${opts(Array.from({length:12},(_,i)=>i+1),cm,v=>`${v}월`)}</select>
        <select class="picker-select" id="bp-d">${opts(Array.from({length:31},(_,i)=>i+1),cd,v=>`${v}일`)}</select>
      </div>
      <div class="picker-actions">
        <button class="picker-cancel" onclick="setPickerField('${id}','','','생년월일 선택');closePicker()">비우기</button>
        <button class="picker-save" onclick="saveBirthPicker('${id}')">선택</button>
      </div>
    </div>
  </div>`;
}
function saveBirthPicker(id){
  const c=+document.getElementById('bp-c').value;
  const yy=+document.getElementById('bp-y').value;
  const m=+document.getElementById('bp-m').value;
  let d=+document.getElementById('bp-d').value;
  const y=c*100+yy;
  const max=new Date(y,m,0).getDate();
  if(d>max)d=max;
  const val=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  setPickerField(id,val,dateLabel(val),'생년월일 선택');
  closePicker();
}

function openDatePicker(id){
  const cur=getPickerVal(id)||new Date().toISOString().slice(0,10);
  const [cy,cm,cd]=cur.split('-').map(Number);
  pickerTargetId=id;
  pickerCalY=cy||TY;
  pickerCalM=(cm?cm-1:TM);
  pickerRoot().innerHTML=renderDatePickerCalendar(id);
}
function saveDatePicker(id){
  const y=+document.getElementById('pk-y').value;
  const m=+document.getElementById('pk-m').value;
  let d=+document.getElementById('pk-d').value;
  const max=new Date(y,m,0).getDate();
  if(d>max)d=max;
  const val=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  setPickerField(id,val,dateLabel(val),'날짜 없음');
  closePicker();
}
function openTimePicker(id){
  const cur=getPickerVal(id)||'09:00';
  const [ch,cm]=cur.split(':').map(Number);
  const hours=Array.from({length:24},(_,i)=>i);
  const mins=Array.from({length:12},(_,i)=>i*5);
  const opts=(arr,sel,fmt=x=>x)=>arr.map(v=>`<option value="${v}" ${v===sel?'selected':''}>${fmt(v)}</option>`).join('');
  pickerRoot().innerHTML=`
  <div class="picker-bg" onclick="closePicker()">
    <div class="picker-sheet" onclick="event.stopPropagation()">
      <div class="picker-title">시간 선택</div>
      <div class="picker-grid time">
        <select class="picker-select" id="pk-h">${opts(hours,ch,h=>`${h<12?'오전':'오후'} ${h%12===0?12:h%12}시`)}</select>
        <select class="picker-select" id="pk-min">${opts(mins,Math.round(cm/5)*5,m=>`${String(m).padStart(2,'0')}분`)}</select>
      </div>
      <div class="picker-actions">
        <button class="picker-cancel" onclick="setPickerField('${id}','','${''}','시간 없음');closePicker()">비우기</button>
        <button class="picker-save" onclick="saveTimePicker('${id}')">선택</button>
      </div>
    </div>
  </div>`;
}
function saveTimePicker(id){
  const h=+document.getElementById('pk-h').value;
  const m=+document.getElementById('pk-min').value;
  const val=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  setPickerField(id,val,timeLabel(val),'시간 없음');
  closePicker();
}

function closeM(e){
  const modal=document.getElementById('modal');
  if(!modal)return;
  if(e && !(e.target&&e.target.classList&&e.target.classList.contains('modal-bg')))return;
  if(e){
    const bg=modal.querySelector('.modal-bg');
    if(bg){
      bg.classList.add('modal-closing');
      setTimeout(()=>{modal.innerHTML='';document.body.classList.remove('modal-open','quick-add-open');},140);
      return;
    }
  }
  modal.innerHTML='';
  document.body.classList.remove('modal-open','quick-add-open');
}
async function saveCalendarImage(){
  if(main!=='c'){
    setMain('c');
    setTimeout(saveCalendarImage,350);
    return;
  }
  const el=document.querySelector('.cal-card');
  if(!el)return alert('저장할 달력이 없어요.');
  if(!window.html2canvas)return alert('이미지 저장 라이브러리를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.');
  try{
    const canvas=await html2canvas(el,{backgroundColor:null,scale:2,useCORS:true});
    const a=document.createElement('a');
    const now=new Date();
    const stamp=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    a.href=canvas.toDataURL('image/png');
    a.download=`패스_달력_${calY}-${String(calM+1).padStart(2,'0')}_${stamp}.png`;
    a.click();
    showToast('캘린더 이미지를 저장했어요.');
  }catch(e){
    console.warn(e);
    alert('캘린더 이미지 저장에 실패했어요.');
  }
}
function openExport(){
  const now=new Date();
  const stamp=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

  const scheduleRows=notes.map(n=>({
    상태:isDone(n)?'완료':'진행중',
    구분:typeName(n.type),
    대상:n.who||'공통',
    반복:repeatName(n.repeat||''),
    제목:n.title||'',
    시작일:n.start||'',
    종료일:n.end||'',
    시작시간:n.sT||'',
    종료시간:n.eT||'',
    메모:n.comment||''
  }));

  const requestRows=requests.map(r=>({
    상태:isDone(r)?'완료':'진행중',
    작성자:r.writer||'',
    부탁:r.title||'',
    메모:r.comment||''
  }));

  const familyRows=[];
  family.forEach(kid=>{
    (kid.cats||[]).forEach(cat=>{
      (cat.items||[]).forEach(item=>{
        familyRows.push({
          이름:kid.name||'',
          학교과정:kid.grade||'',
          학년:kid.year||'',
          반:kid.cls||'',
          번호:kid.num||'',
          구분:cat.label||'',
          요일:daysFmt(item.days),
          내용:item.val||''
        });
      });
    });
  });

  const shiftRows=[];
  Object.keys(shiftData||{}).sort().forEach(k=>{
    const row=shiftData[k];
    if(typeof row==='string'){
      shiftRows.push({날짜:k,대상:firstShiftUser?firstShiftUser():'',상태:row||''});
    }else if(row&&typeof row==='object'){
      Object.keys(row).forEach(user=>shiftRows.push({날짜:k,대상:user,상태:row[user]||''}));
    }
  });

  const memoryRows=memories.map(x=>{
    const nb=nextBirthInfo(x.birth,memoryCalendarType(x)==='lunar');
    return {
      대상:x.name||'',
      생년월일:x.birth||'',
      만나이:x.birth?ageNow(x.birth):'',
      다음생일:nb.date||'',
      Dday:nb.dday||'',
      메모:x.memo||''
    };
  });

  // SheetJS가 로드되면 진짜 .xlsx 생성
  if(window.XLSX){
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(scheduleRows),'일정');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(requestRows),'부탁');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(familyRows),'아이정보');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(shiftRows),'상태표');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(memoryRows),'축하');
    XLSX.writeFile(wb,`가족캘린더_${stamp}.xlsx`);
    return;
  }

  // 인터넷 문제로 라이브러리가 안 불러와졌을 때 CSV로 대체
  const rows=[['상태','구분','제목','시작일','종료일','시작시간','종료시간','메모'],
    ...scheduleRows.map(r=>[r.상태,r.구분,r.제목,r.시작일,r.종료일,r.시작시간,r.종료시간,r.메모])];
  const csv='\ufeff'+rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`가족캘린더_${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escapeAttr(s){
  return String(s??'').replace(/[&<>"']/g,
    m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}


function hideSplash(){
  const s=document.getElementById('splash');
  if(s && !s.dataset.hiding){
    s.dataset.hiding='1';
    setTimeout(()=>s.classList.add('hide'),300);
    setTimeout(()=>s.remove(),800);
  }
}


function setupServiceWorkerUpdateNotice(){
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.addEventListener('message',event=>{
    const data=event.data||{};
    if(data.type==='PASS_SW_UPDATED'){
      showToast('새 버전이 있어요. 새로고침할까요?','새로고침',()=>location.reload(),9000);
    }
  });
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js')
      .then(reg=>console.log('Service Worker registered',reg))
      .catch(err=>console.warn('Service Worker registration failed',err));
  });
}

setupServiceWorkerUpdateNotice();
setupModalStateObserver();
initData();
setTimeout(hideSplash,3000);
window.addEventListener('load', hideSplash);
