'use strict';

if (navigator.mozApps) {
    var checkIfInstalled = navigator.mozApps.getSelf();
    checkIfInstalled.onsuccess = function () {
        if (checkIfInstalled.result) {
            // Already installed
            var installationInstructions = document.querySelector('#installation-instructions');
            if (installationInstructions) {
                installationInstructions.style.display = 'none';
            }
        }
        else {
            var install = document.querySelector('#install'),
                manifestURL = location.href.substring(0, location.href.lastIndexOf('/')) + '../manifest.webapp';
            install.className = 'show-install';
            install.onclick = function () {
                var installApp = navigator.mozApps.install(manifestURL);
                installApp.onsuccess = function() {
                    install.style.display = 'none';
                };
                installApp.onerror = function() {
                    alert('Install failed\n\n:' + installApp.error.name);
                };
            };
        }
    };
}
else {
    console.log('Open Web Apps not supported');
}

var db;
var VERSAO_ATUAL = '1';
var loginTimeout;

function onDeviceReady() {
  db = openDatabase('CHIES', VERSAO_ATUAL, 'CHIES DB', 2 * 1024 * 1024);
  versao.carregaVersao(db);
}

function parseScript(strcode) {
  if (!strcode || strcode == "undefined")
    return;

    var scripts = [];

    while (strcode.indexOf("<script") > -1 || strcode.indexOf("</script") > -1) {
      var s = strcode.indexOf("<script");
      var s_e = strcode.indexOf(">", s);
      var e = strcode.indexOf("</script", s);
      var e_e = strcode.indexOf(">", e);

      scripts.push(strcode.substring(s_e + 1, e));
      strcode = strcode.substring(0, s) + strcode.substring(e_e + 1);
    }
    for (var i = 0; i < scripts.length; i++) {
      try {
        eval(scripts[i]);
      }
      catch (ex) {
        console.log(ex);
      }
    }
 }


function validaCampos(tela) {
  var ipts = tela.querySelectorAll('input');
  var i = 0, l = ipts.length;

  for(; i < l; i++) {
    if (ipts[i].hasAttribute('required') && ipts[i].value.trim() === '')
      return false;
  }

  return true;
}

function ClientToForm(form, dados, prefixo) {

    if (form instanceof jQuery) {
        form = form.get(0);
    }

    if (dados == "") {
        return;
    }

    if (!prefixo)
        prefixo = "";
    try {
        if (typeof dados == "string")
            dados = JSON.parse(replaceAll(dados, "\n", ""));
    } catch (Exception) {
        return;
    }

    if (dados.linhas[0] == undefined || dados.linhas[0] == null)
        return;
    var l = dados.linhas[0];
    var campo = null;
    var valor = null;
    for (var key in l) {
        if (getElementByIdInFragment(form, prefixo + key) == null)
            campo = getElementByIdInFragment(form, prefixo + "FK_" + key);
        else
            campo = getElementByIdInFragment(form, prefixo + key);
        if (campo == undefined || campo == null)
            continue;
        valor = l[key];
        if (valor === null)
            valor = "";
        else {
            if ((campo.getAttribute("tipocomponente") != null && campo.getAttribute("tipocomponente") != undefined && (campo.getAttribute("tipocomponente") == "tnumerico" || campo.getAttribute("tipocomponente") == "tnumeric")) || (campo.tagName.toLowerCase() === "t-numeric"))
                valor = valor.replace(",", "").replace(".", ",");
            if ((campo.getAttribute("tipocomponente") != null && campo.getAttribute("tipocomponente") != undefined && campo.getAttribute("tipocomponente") == "tdata") || (campo.tagName.toLowerCase() === "t-date")) {
                if (valor.indexOf("/") < 0) {
                    if (valor.indexOf(".") > 0) {
                        valor = valor.replaceAll(".", "/");
                    } else {
                        var nData = [];
                        nData.push(valor.substr(6, 2));
                        nData.push(valor.substr(4, 2));
                        nData.push(valor.substr(0, 4));
                        valor = nData.join('/');
                        if (valor.trim() === '//')
                            valor = '';
                    }
                }
            }
        }

        campo.value = valor;
    }
}

function formataValores(tipo, valor, casas, chave, tipoalternativo, tfield) {
    if (casas === undefined)
        casas = 2;
    if (valor === null || valor === undefined || valor === "")
        return "";
    if (tipo === "PULA")
        return valor;
    if (tipoalternativo)
        tipo = tipoalternativo;
    if (tipo === "I" || tipo === "i4") {
        if (chave !== undefined && chave !== null && chave === "S")
            return (valor + '').replaceAll(".", "");
        else
            return parseInt(valor, 10).formatMoney(0, ',', '.');
    } else if (tipo === "N" || tipo.trim() === "fixedFMT") {
        return parseFloat(valor).formatMoney(casas, ',', '.');
    } else if (tipo === "D" || tipo === "date") {
        valor = String(valor);
        //05/09/2013 --> Esta vindo AnoMesDia
        if (valor.trim() === "")
            return "";
        //Se vier a data no formato correto
        if (valor.trim().substr(2, 1) === "/" || !isInteger(valor.substr(6, 2)))
            return valor;
        else if (valor.indexOf('-') > -1) {
          var tmp = valor.split('-');
          return tmp.reverse().join('/');
        }

        return valor.substr(6, 2) + "/" + valor.substr(4, 2) + "/" + valor.substr(0, 4);
    } else if (tipo === 'TM' || tipo === 'TMS' || tipo === 'TMD') {
        casas = 0;
        if (tipo === "TMS" || tipo === "TMD")
            casas = 3;
        return valor.trim().toHHMMSS(casas, tfield);
    } else if (tipo === 'CHECKBOXV' && tfield) {
        var checked = "";
        if (valor === "TRUE" || valor === "S")
            checked = "checked='checked'";
        return "<input type='checkbox' " + checked + " id='" + tfield.NOME + "' tipoComponente='tcheckbox' name='" + tfield.NOME + "' onclick='marcaCheckGridCds(this)' vdesmarcado='N' vmarcado='S' value='S'>";
    } else {
        return valor;
    }
}

function isInteger(sText){
    var ValidChars = "0123456789-";
    var IsInteger=true;
    var Char;

    for (var i = 0; i < sText.length && IsInteger == true; i++)
    {
        Char = sText.charAt(i);
        if (ValidChars.indexOf(Char) == -1)
        {
            IsInteger = false;
        }
    }
    return IsInteger;
}

function jAlert(msg) {
  alert(msg);
}

function parseDouble(value) {
    value = String(value).trim();
    if (value.length === 0 || value === 'undefined' || value === 'null') {
        value = '0';
    }
    if (value.indexOf(',') !== -1) {
        value = value.replace(/\./g, '').replace(',', '.');
    }

    return parseFloat(value);
}

Number.prototype.formatMoney = function (c, d, t) {
    var n = this,
            c = isNaN(c = Math.abs(c)) ? 2 : c,
            d = d == undefined ? "." : d,
            t = t == undefined ? "," : t,
            s = n < 0 ? "-" : "",
            i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}

function parentUntilAttr(obj, atributo, valor) {
    try {

        if (obj instanceof jQuery) {
            obj = obj.get(0);
        }

        while (!false) {
            if (obj == undefined || obj == "undefined")
                return null;

            if (obj.getAttribute(atributo) === valor)
                return obj;

            obj = obj.parentNode;
        }
    }
    catch (Exception) {
        return null;
    }
}

function jQuery() {}

function defineQuemsou(quemsou) {
    if (quemsou instanceof jQuery) {
        quemsou = quemsou[0];
    }
    if (quemsou.getAttribute('role') !== 'dialog' && quemsou.id !== 'div-login') {
        quemsou = parentUntilAttr(quemsou, 'role', 'dialog');
    }
    return quemsou;
}

function daysInMonth(month,year) {
	var m = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if (month != 2) return m[month - 1];
	if (year % 4 != 0) return m[1];
	if (year % 100 == 0 && year%400 != 0) return m[1];
	
	return m[1] + 1;
}

function stringToDate(_date,_format,_delimiter)
{
	var formatLowerCase=_format.toLowerCase();
	var formatItems=formatLowerCase.split(_delimiter);
	var dateItems=_date.split(_delimiter);
	var monthIndex=formatItems.indexOf("mm");
	var dayIndex=formatItems.indexOf("dd");
	var yearIndex=formatItems.indexOf("yyyy");
	var month=parseInt(dateItems[monthIndex]);
	month-=1;
	var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
	return formatedDate;
}