let client = null;

const tbb1 = document.getElementById('tbb1');
const tbb2 = document.getElementById('tbb2');
const tbb3 = document.getElementById('tbb3');

const cmdMap = {};
const varMap = {};
function cmd() {
  if (cmdMap[ch] == undefined) {
    cmdMap[ch] = new Store({ configName: 'ch' + ch });
    resetTable();
  }
  if (varMap[ch] == undefined) {
    varMap[ch] = { conts: [], map: {}, keys: [] };
    Object.keys(cmdMap[ch].data).forEach(e => {
      console.log('key load : ' + e);
      if (e.startsWith('__')) {
        let o = cmdMap[ch].get(e);
        varMap[ch].keys.push(e);
        let funckey = o.func.split('#')[0]
        if (varMap[ch].conts.indexOf(funckey) == -1) varMap[ch]['conts'].push(funckey);
        if (varMap[ch].map.hasOwnProperty(funckey)) {
          varMap[ch].map[funckey].push(e);
        } else {
          varMap[ch].map[funckey] = [e];
        }
      }
    });
  }
  return cmdMap[ch];
}

function getKeys() {
  let map = cmd();
  let arr = [];
  Object.keys(map.data).forEach(key => (!key.startsWith('!') && !key.startsWith('__') && arr.push(key)));
  console.log('keys')
  console.log(arr);
  return arr;
}

function split(string, n) {
  var split = string.split(' ');
  if (split.length <= n)
    return split;
  var out = split.slice(0, n - 1);
  out.push(split.slice(n - 1).join(' '));
  return out;
}

function onJoin(channel, username, self) {

}

const invCmd = ['명령어추가', '명령어삭제', 'cmdadd', 'cmddel', '키워드추가', '키워드삭제', 'keyadd', 'keydel'];
function onMessage(context, msg) {
  msg = msg.trim();
  console.log('message received : ' + msg);
  console.log(context);
  mod = context.mod || (context['badges-raw'].indexOf('broadcaster') != -1)

  if (msg.startsWith('!')) {
    //command
    // msg = msg.substr(1);
    const com = split(msg, 3)[0].substr(1);
    let flag = false;
    switch (com) {
      case 'keyadd':
      case '키워드추가':
        flag = true;
      case 'cmdadd':
      case '명령어추가':
        if (mod) {
          let type = flag ? '키워드' : '명령어';
          let prefix = flag ? '' : '!';
          let args = split(msg, 3);
          if (args.length == 3) {
            if (invCmd.indexOf(args[1]) != -1) {
              client.say(ch, `${type}는 ${prefix}${args[1]} (은)는 사용할 수 없습니다.`);
            } else if (args[1].startsWith('__')) {
              client.say(ch, `${type}는 __로 시작할 수 없습니다.`);
            } else {
              cmd().set(prefix + args[1], args[2]);
              resetTable();
              client.say(ch, `${type} ${prefix}${args[1]} (이)가 추가되었습니다.`);
            }
          }
        }
        break;
      case 'keydel':
      case '키워드삭제':
        flag = true;
      case 'cmddel':
      case '명령어삭제':
        if (mod) {
          let type = flag ? '키워드' : '명령어';
          let prefix = flag ? '' : '!';
          let args = split(msg, 2);
          if (args.length == 2) {
            if (cmd().get(prefix + args[1]) == undefined) {
              client.say(ch, `${type} ${prefix}${args[1]} (이)가 존재하지 않습니다.`);
            } else {
              cmd().del(prefix + args[1]);
              resetTable();
              client.say(ch, `${type} ${prefix}${args[1]} (이)가 삭제되었습니다.`);
            }
          }
        }
        break;
      case 'vardel':
      case '변수삭제':
        flag = true;
      case 'varadd':
      case '변수추가':
        if (mod) {
          let args = split(msg, flag ? 2 : 4);
          if (args.length == flag ? 2 : 4) {
            if (flag) {
              if (cmd().get('__' + args[1]) != undefined) {
                cmd().del('__' + args[1]);
                resetTable();
                client.say(ch, `변수 ${args[1]}(이)가 삭제되었습니다.`);
              } else {
                client.say(ch, `변수 ${args[1]}(이)가 존재하지 않습니다.`);
              }
            } else {
              if (cmd().get('__' + args[1]) != undefined) {
                client.say(ch, `변수 ${args[1]}(이)가 이미 존재합니다.`);
              } else {
                let e = { value: parseInt(args[2]), func: args[3] };
                cmd().set('__' + args[1], e);
                resetTable();
                client.say(ch, `변수 ${args[1]}(이)가 추가되었습니다.`);
                varMap[ch].keys.push('__' + args[1]);
                let funckey = e.func.split('#')[0];
                if (varMap[ch].conts.indexOf(funckey) == -1) varMap[ch]['conts'].push(funckey);
                if (varMap[ch].map.hasOwnProperty(funckey)) {
                  varMap[ch].map[funckey].push('__' + args[1]);
                } else {
                  varMap[ch].map[funckey] = ['__' + args[1]];
                }
              }
            }
          }
        }
        break;
      default:
        let str = cmd().get('!' + com);
        if (str == undefined) return;
        let argReg = [];
        [...str.matchAll(/\$\{[0-9]{1,2}\}/g)].forEach(e => {
          argReg.push(e[0]);
        });
        let args = msg.split(argReg.length + 1);
        args.splice(0, 1);
        args.forEach((arg, i) => console.log(str = str.replace(`\$\{${i + 1}\}`, arg)));
        varMap[ch].keys.forEach((arg, i) => console.log(str = str.replace(`\$\{${arg.substr(2)}\}`, cmd().get(arg).value)));
        client.say(ch, str);
        break;
    }
  } else {
    let keyword = undefined, repl;
    getKeys().some(key => (msg.indexOf(key) != -1 && (keyword = key)));
    if (keyword != undefined && (repl = cmd().get(keyword)) != undefined) {
      // msg = msg.replace(key, repl);
      varMap[ch].keys.forEach((arg, i) => repl = repl.replace(`\$\{${arg.substr(2)}\}`, (cmd().get(arg) == undefined ? noex : cmd().get(arg).value)));
      [...repl.matchAll(/\$\{[^\$\{\}]{1,9}\}/g)].forEach(match => repl = repl.replace(match[0], noex));
      client.say(ch, repl);
    }

    replaceVar(msg, (vr, vrb) => {
      let funcAct = vrb.func.split('#')[1];
      switch (funcAct) {
        case '+':
          vrb.value += 1;
          break;
        case '-':
          vrb.value -= 1;
          break;
      }
      cmd().set(vr, vrb);
      changeTable(vr);
    });
  }
}

function replaceVar(msg, cb) {
  varMap[ch].conts.forEach(kw => {
    if (msg.indexOf(kw) != -1 && varMap[ch].map != undefined) {
      varMap[ch].map[kw].forEach(vr => {
        let vrb = cmd().get(vr);
        if (vrb != undefined) {
          cb(vr, vrb);
        }
      });
    }
  });
}

function resetTable() {
  let k1 = [], k2 = [], k3 = [];
  Object.keys(cmdMap[ch].data).forEach(e => {
    if (e.startsWith('__')) k3.push(e);
    else if (e.startsWith('!')) k1.push(e);
    else if (e.startsWith('#')) { }
    else k2.push(e);
  });
  setTable(tbb1, k1);
  setTable(tbb2, k2);
  setTable(tbb3, k3);
}

function setTable(tbb, keys) {
  tbb.innerHTML = '';
  console.log('add to ' + ch);
  console.log(tbb);
  console.log(keys);
  keys.forEach(key => {
    let val = cmd().get(key) || '-';
    if (val.hasOwnProperty('value')) val = val.value + " / " + val.func;
    let struct = `<tr id="${key}"><td><input class="uk-checkbox" type="checkbox" checked disabled></td><td>${key}</td><td class="uk-text-truncate">${val}</td><td><a href="#" onclick="removeKey('${key}')" uk-icon="icon: trash"></a></td></tr>`;
    tbb.innerHTML += struct;
  });
}

function changeTable(key) {
  let val = cmd().get(key) || '-';
  if (val.hasOwnProperty('value')) val = val.value + " / " + val.func;
  let struct = `<td><input class="uk-checkbox" type="checkbox" checked disabled></td><td>${key}</td><td class="uk-text-truncate">${val}</td><td><a href="#" onclick="removeKey('${key}')" uk-icon="icon: trash"></a></td>`;
  document.getElementById(key).innerHTML = struct;
}

function removeKey(key){
  if(cmd().get(key) != undefined){
    cmd().del(key);
    resetTable();
  }
}