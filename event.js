const setting = new Store({ configName: 'settings', defaults: { notExistsReplace: '?' } });

let initKey = null;
let accepted = false;

let ch = setting.get('channel') || '';
if (ch != '') ch = "#" + ch;
let noex = setting.get('notExistsReplace') || '?';
let ch_input = document.getElementById('ch_input');
let noex_input = document.getElementById('noex_input');
let ch_button = document.getElementById('ch_button');
let noex_button = document.getElementById('noex_button');
ch_input.value = ch.substr(1);
noex_input.value = noex;
ch_input.onkeyup = (e) => {
  e.target.value = e.target.value.trim();
  ch_button.disabled = e.target.value == ch;
}
noex_input.onkeyup = (e) => {
  e.target.value = e.target.value.trim();
  noex_button.disabled = e.target.value == noex;
}
ch_button.onclick = (e) => {
  if (ch_input.value != '') {
    if (client != null) {
      setting.set('channel', ch_input.value);
      ch = "#" + setting.get('channel');
      console.log('channel changed ' + ch);
      client.channels.forEach(channel => client.part(channel));
      client.join(ch);
      ch_button.disabled = true;
    }
  }
}
noex_button.onclick = (e) => {
  if (noex_input.value != '') {
    setting.set('notExistsReplace', noex_input.value);
    noex = setting.get('notExistsReplace');
    noex_button.disabled = true;
  }
}

const panels = document.querySelectorAll('.panel');
function switchPanel(index) {
  panels.forEach((panel, i) => panel.style.transform = 'translateX(' + (i * 100 - index * 100) + '%)');
}
switchPanel(0);

document.getElementById('twitchLink').onclick = (e) => {
  ipcRenderer.send('twitchLink');
};

ipcRenderer.on('twitchToken', (hanlder, args) => {
  console.log('worked with ' + args);
  document.getElementById('pw').value = args;
})

function hostProcess(e) {
  ipcRenderer.send(e.target.id);
}
document.querySelectorAll('.hostButton').forEach(e => e.onclick = hostProcess);

const loginProc = () => {
  let idv = id.value.trim();
  let pwv = pw.value.trim();
  let atv = document.getElementById('auto').checked;
  client = new tmi.client({
    identity: {
      username: idv,
      password: pwv,
    }, channels: []
  });
  client.on('connected', (e) => {
    crd.set('ci', idv);
    if (atv) crd.set('cp', pwv);
    crd.save();
    id.value = pw.value = '';
    if (ch != undefined && ch != '') {
      client.join(ch);
    }
    switchPanel(1);
  })
  client.on('join', (channel, username, self) => {
    if (self) {
      if (ch == undefined) ch = channel;
      cmd(channel);
      client.mods(ch).then(d => {
        if (d.indexOf(client.username) != -1 || ch.substr(1) == client.username) {
          accepted = true;
          client.say(ch, `사용자봇 '${client.globaluserstate['display-name']}'(이)가 연결되었습니다. `);
        } else {
          // initKey = Math.random().toString(36).substr(2, 11);
          // client.say(ch, `사용자봇 '${client.globaluserstate['display-name']}'(이)가 연결 요청 중 입니다. 본인이 연결한 경우 '!사용자봇허용 ${initKey}' 를 입력해주세요.`);
        }
      }).catch(e => { console.log(e) });
      resetTable();
    }
  })
  client.on('message', preMessage);
  client.connect().catch(reason => {
    if (reason.toString().indexOf('NICK') != -1) {
      alert('유효하지 않은 아이디입니다.');
    } else {
      alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  })
}
function preMessage(channel, context, msg, self) {
  if (channel != ch) return;
  if (self) { console.log('self'); return; }
  if (accepted) {
    onMessage(context, msg);
  } else if (context['badges-raw'].indexOf('broadcaster') != -1 && msg == ("!사용자봇허용 " + initKey)) {
    accepted = true;
    client.say(ch, `사용자봇 '${client.globaluserstate['display-name']}'(이)가 연결되었습니다. `);
  }
}

const id = document.getElementById('id');
const pw = document.getElementById('pw');

document.body.onload = () => {
  id.value = crd.get('ci') || '';
  pw.value = crd.get('cp') || '';
  if (pw.value != '') {
    loginProc();
  }
}
document.getElementById('login').onclick = loginProc;

let up_log = document.getElementById('update_log');
let up_btn = document.getElementById('update_button');

ipcRenderer.on('updater', (e, args) => {
  if (args[0] == 0) {
    up_log.textContent = "업데이트가 없습니다. " + remote.app.getVersion();
  } else if (args[0] == 1) {
    up_log.textContent = "업데이트가 있습니다."
  } else if (args[0] == 2) {
    up_log.textContent = "업데이트가 준비되었습니다."
    up_btn.disabled = false;
  } else if (args[0] == 3) {
    args[1] = Math.round(args[1] * 100) / 100;
    up_log.textContent = `다운로드중 ${args[1]}%... `;
  } else if(args[0] == 4){
    up_log.textContent = "업데이트 확인에 오류가 발생했습니다.";
  }
});
up_btn.onclick = () => ipcRenderer.send('quitAndInstall');