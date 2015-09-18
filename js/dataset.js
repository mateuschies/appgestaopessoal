var mobileDev = true;
var sessao = -9876;

var onDblClick = document.createEvent("Event");
onDblClick.initEvent("dblClick", true, true);
var onPageChange = document.createEvent("Event");
onPageChange.initEvent("pageChange", true, true);
var onDataChange = document.createEvent("Event");
onDataChange.initEvent("dataChange", true, true);
var onStateChange = document.createEvent("Event");
onStateChange.initEvent("stateChange", true, true);
var onNavigate = document.createEvent("Event");
onNavigate.initEvent("navigate", true, true);


function DataSet(pai, tabela, createAsincrono) {

    this._versao = 0.6;
    this.flag = null;

    /**
     * Privates --> NÃ£o alterem!!!
     */
    this._json = null;
    this._dependentes = null;
    this._pai = pai;
    this._jsontmp = null;

    // Indexamento de campos por posicao
    this.index = [];
    this.nindex = [];
    /**
     * 1 - > campo : valor
     * 2 - > Indice : valor
     */
    this._tiporeg = 1;
    this._error_message = null;
    this._tabela = tabela;
    this._condicao = "";
    this._adicional = "";
    this._ordem = "";
    this._registrations = {};
    this._eof = false;
    this._eof2 = false;
    this._gindice = true; // gerar Indices
    /**
     * 0 - Consulta
     * 1 - Insert
     * 2 - Edit
     */
    this._filtro = [];
    this._filtered = false;
    this._state = 0;
    this._indice = -1;
    this.__ignoreEvent = false;
    this._camposChaves = [];

    //se vier undefined ou null, assim garante que vai passar false
    if (!createAsincrono)
        createAsincrono = false;

    if (tabela && sessao !== -9876 && !mobileDev) {
        var _this = this;
        executaServico("criaFormPai", "FuncoesUteis.jsonBase", null, function(data) {
            if (data.trim() !== "") {
                _this.setJsonData(JSON.parse(data));
            }
        }, "&tabela=" + tabela, createAsincrono);
    } else {
  		var _this = this;

      db.transaction(function(tx) {
        tx.executeSql('SELECT COLUNAS.COLUNAS FROM COLUNAS WHERE COLUNAS.TABELA = ?', [_this._tabela], function(tx, rs) {
            if (rs.rows.length > 0) {
              _this._json= {colunas: JSON.parse(rs.rows.item(0).COLUNAS), linhas: []};
              if (_this._json.colunas && _this._gindice) {
                for (var i = 0; i < _this._json.colunas.length; i++) {
                  _this.index[_this._json.colunas[i].NOME] = i;
                  _this.nindex[i] = _this._json.colunas[i].NOME;
                }
              }

              if (createAsincrono)
                createAsincrono();
            } else {
              throw new 'Tabela ' + _this._tabela +' não localizada';
            }
        });
      });

  		/*var t = db.transaction('COLUNAS', 'readwrite');
  		var ob = t.objectStore('COLUNAS');
  		req = ob.get(_this._tabela);
  		req.onsuccess = function(event) {
  			_this._json= {colunas: req.result.COLUNAS, linhas: []};
  			if (_this._json.colunas && _this._gindice) {
  				for (var i = 0; i < _this._json.colunas.length; i++) {
  					_this.index[_this._json.colunas[i].NOME] = i;
  					_this.nindex[i] = _this._json.colunas[i].NOME;
  				}
  			}

  			if (createAsincrono)
  				createAsincrono();

		};*/

	}

    this.addEventListener("dataChange", this.processaCampos);
}

DataSet.prototype.clone = function() {
    var strTmp = JSON.stringify(this._json);
    var _cds = new DataSet('', '');
    _cds.setJsonData(strTmp);
    return _cds;
};

//<editor-fold defaultstate="collapsed" desc="Funcoes em desenvolvimento">
DataSet.prototype.desenv = function(vers) {
    /**
     * Versoes e data de liberacoes
     * 1 -
     */

    if (vers === 1) {
        this.addEventListener("navigate", this.navigate);
        this.addEventListener("stateChange", this.stateChanged);
    }
};

DataSet.prototype.stateChanged = function() {
    if (this._pai && this._pai !== "") {
        var tipo = 0;
        var inpt = jQuery('#' + this._pai).get(0).querySelectorAll('input, select, textarea');
        var l = inpt.length;

        if (l <= 0) {
            inpt = jQuery('#' + this._pai).get(0).querySelectorAll(montaSeletorComponent());
            l = inpt.length;
            tipo = 1;
        }

        var f = null;
        for (var i = 0; i < l; i++) {
            if (this.findField(inpt[i].id)) {
                if (!inpt[i].getAttribute("r") || inpt[i].getAttribute("r") != "r") {
                    if (this.getState() === 0) {
                        inpt[i].setAttribute("readonly", "readonly");
                    } else {
                        if (tipo === 0)
                            inpt[i].removeAttribute("readonly");
                        else
                            inpt[i].setAttribute("readonly", "false");
                    }
                }
            }
        }
    }
};

DataSet.prototype.navigate = function() {
    if (this._pai && this._pai !== "") {
        var inpt = this._retornaCampos();
        var l = inpt.length;

        var f = null;
        for (var i = 0; i < l; i++) {
            if (this.findField(inpt[i].id)) {
                f = this.fieldByName(inpt[i].id);
                if (f) {
                    inpt[i].value = formataValores(f.TP, f.asString(), f.CASAS, f.CHAVE);
                }
            }
        }
    }
};

DataSet.prototype._retornaCampos = function() {
    if (this._pai && this._pai !== "") {
        var inpt = jQuery('#' + this._pai).get(0).querySelectorAll('input, select, textarea');
        var l = inpt.length;

        if (l <= 0) {
            inpt = jQuery('#' + this._pai).get(0).querySelectorAll(montaSeletorComponent());
            return inpt;
        } else
            return inpt;
    }
    return [];
};

//</editor-fold>

DataSet.prototype.getLinha = function() {
    if (this._json) {
        return this._json.linhas[this.getIndice()];
    }
};

DataSet.prototype.emptyDataSet = function() {
    this._json.linhas = [];
    this.atualizaDependentes();
};

DataSet.prototype.getState = function() {
    return this._state;
};

DataSet.prototype.fieldDefs = function() {
    return this._json.colunas;
};

DataSet.prototype.addField = function(nome, tipo, tamanho, chave) {
    if (!this._json) {
        this._json = {
            colunas: [],
            linhas: []
        };
    }

    if (!this.index[nome]) {
        var n = this._json.colunas.length;
        this._json.colunas[n] = {
            NOME: nome,
            TP: tipo,
            WIDTH: tamanho,
            CHAVE: chave
        };
        this.index[nome] = n;
        this.nindex[n] = nome;
    } else {
        throw ("Campo " + nome + " já existente no dataset.");
    }

};

DataSet.prototype.setIndice = function(indice) {

    if (indice > this.recordCount()) {
        throw ("Indice:" + indice + " fornecido maior que o numero de registros:" + this.recordCount());
    } else if (indice < -1) {
        throw ("Indice precisa ser maior ou igual que -1");
    } else if (indice === -1) {
        this._index = indice;
        this._eof = true;
        this._bof = true;
    } else {
        this.indice = indice;
        if (this.indice > 0 && this.indice < this.recordCount() - 1) {
            this._eof = false;
            this._bof = false;
        } else if (this.indice === 0 && this.indice < this.recordCount() - 1) {
            this._eof = false;
            this._bof = true;
        }
    }

    this._indice = indice;
    if (!this.__ignoreEvent)
        this.dispatchEvent(onNavigate);
};

DataSet.prototype.setIndice2 = function(indice) {

    if (indice > this.recordCount()) {
        throw ("Indice:" + indice + " fornecido maior que o numero de registros:" + this.recordCount());
    } else if (indice < -1) {
        throw ("Indice precisa ser maior ou igual que -1");
    } else if (indice === -1) {
        this._index = indice;
        this._eof2 = true;
        this._bof2 = true;
    } else {
        this.indice = indice;
        if (this.indice > 0 && this.indice < this.recordCount() - 1) {
            this._eof2 = false;
            this._bof2 = false;
        } else if (this.indice === 0 && this.indice < this.recordCount() - 1) {
            this._eof2 = false;
            this._bof2 = true;
        }
    }

    this._indice = indice;
    if (!this.__ignoreEvent)
        this.dispatchEvent(onNavigate);
};

DataSet.prototype.getIndice = function() {
    return this._indice;
};

DataSet.prototype.recordCount = function() {
    if (this._json !== null && this._json !== "") {
        if (this._filtered)
            return this._filtro.length;
        else
            return this._json.linhas.length;
    } else {
        var grid = jQuery(this._retornaGrid());
        return grid.get(0).querySelector("tbody").querySelectorAll("tr").length;
    }
};

DataSet.prototype.setJsonData = function(json) {
    if (typeof json == "string")
        throw ("Json veio no formato de texto");

    this._json = json;

    if (this._json.colunas) {
        var x = 0,
            l = this._json.colunas.length;
        for (; x < l; x++) {
            if (this._json.colunas[x].TP === 'bin.hex') {
                this._json.colunas[x].TP = 'M';
            }
        }
    }

    this.atualizaDependentes();
    //this._indice = this._json.linhas.length-1;
    this.first();

    if (json.colunas !== undefined && json.colunas !== null && this._gindice) {
        for (var i = 0; i < json.colunas.length; i++) {
            this.index[json.colunas[i].NOME] = i;
            this.nindex[i] = json.colunas[i].NOME;
        }
    }
    this._gindice = true;
};

DataSet.prototype.jsonData = function() {
    if (this._json !== null && this._json !== "") {
        if (this._filtro && this._filtered) {
            return {
                colunas: this._json.colunas,
                linhas: this._filtro
            };
        }
        return this._json;
    } else {
        return null;
    }
};

DataSet.prototype.atualizaDependentes = function(state) {
    if (this._dependentes !== null && this._json !== null) {
        var k;
        var pg;
        for (k in this._dependentes) {
            if (this._dependentes[k].tipo === "grid") {
                if (this._dependentes[k].obj.tagName === "T-GRID") {
                    this._dependentes[k].obj.config.pg = -1;
                    this._dependentes[k].obj.atualizaTotal();

                    pg = this._dependentes[k].obj.config.pgTotal - 1;
                    if (!pg || pg === -1)
                        pg = 0;
                    this._dependentes[k].obj.mudaPg(pg);
                    this._dependentes[k].obj.atualizaTotal();
                } else {
                    jQuery(this._dependentes[k].obj).atualizaTotal();

                    if (!this._dependentes[k].obj.grid)
                        continue;

                    pg = this._dependentes[k].obj.grid.config.pgTotal - 1;
                    if (state && state === 2)
                        pg = this._dependentes[k].obj.grid.config.pg;
                    if (!pg || pg === -1)
                        pg = 0;

                    this._dependentes[k].obj.grid.config.pg = -1;

                    this._dependentes[k].obj.grid.mudaPg(pg);
                    jQuery(this._dependentes[k].obj).atualizaTotal();
                }

                //if (state && (state === 1 || state === 3)) {
                if (state && (state === 1)) { // se fizer um while deletando registros, ele esta jogando para o ultimo quando temos um dependente
                    this.last();
                }

            } else if (this._dependentes[k].tipo === "tlista") {
				this._dependentes[k].obj.lista.desenha(this);
			} else {
                jAlert("Tipo de dependente ainda nÃ£o implementado", "Aviso");
            }
        }
    }
};

DataSet.prototype.condicao = function(condicao) {
    if (!condicao) {
        return this._condicao;
    } else {
        this._condicao = condicao;
    }
};

DataSet.prototype.getMessage = function() {
    var tmp = this._error_message;
    this._error_message = null;
    return tmp;
};

DataSet.prototype.open = function() {
    if (this._condicao.trim() !== "" && this._tabela && sessao !== -9876) {

        if (this._state !== 0) {
            throw "O Client não esta em modo consulta.";
        }

        var _this = this;
        executaServico("criaFormPai", "TecniconTDataSetJS.open", function(data) {
            jAlert(data, "Aviso");
            _this._error_message = data;
        }, function(data) {
            if (data.trim() !== "") {
                data = JSON.parse(data);
                _this._json.linhas = data.linhas;
                _this._indice = 0;
                _this._eof = false;
                _this._filtro = [];
                _this._filtered = false;

                if (data.linhas.length <= 0) {
                    _this._indice = -1;
                    _this._eof = true;
                }
                _this.atualizaDependentes();
            }
        }, "&TABELA=" + this._tabela + "&CONDICAO=" + this._condicao.trim(), false);
    }
};

DataSet.prototype.close = function() {
    if (this._state !== 0) {
        throw "O Client nÃ£o esta em modo consulta.";
    }

    if (this._json) {
        this._json.linhas = [];
    }

};

DataSet.prototype.insert = function() {
    if (this._state !== 0)
        throw "O Client não esta em modo consulta.";

    this._json.linhas.push({});
    this._indice = this._json.linhas.length - 1;
    this._state = 1;

    this.dispatchEvent(onStateChange);

    var g = this._retornaGrid();
    if (g) {
        jQuery(g).setStatus('1');
    }
};

DataSet.prototype.edit = function() {
    if (this._state !== 0)
        throw "O Client não esta em modo consulta.";

    if (this._indice === -1 || this.recordCount() <= 0)
        throw "Nenhum registro posicionado para edição";

    this._state = 2;

    this.dispatchEvent(onStateChange);

    this._jsontmp = JSON.stringify(this._json.linhas[this._indice]);

    var g = this._retornaGrid();
    try {
        if (g.get(0)) {
            jQuery(g).setStatus('2');
        }
    } catch (ex) {


    }

};

DataSet.prototype.del = function() {
    if (this._state !== 0)
        throw "O Client não esta em modo consulta.";

    if (this._json.linhas.length <= 0)
        throw "Nenhum registro para deleção";

    var tmp = this._indice;
    var deletou = true;
    var json = this._json;

    if (this._filtered) {
        json = {};
        json.linhas = this._filtro;
    }

    if (this._tabela) {
        var _this = this;
        executaServico("criaFormPai", "TecniconTDataSetJS.deleta", function(data) {
            jAlert(data, "Aviso");
            deletou = false;
        }, function(data) {
            if (data.trim() !== "OK")
                jAlert(data, "Aviso");
        }, "&TABELA=" + this._tabela + "&JSON=" + encodeURIComponent(JSON.stringify(json.linhas[this._indice])), false);
    }

    if (deletou) {
        if (this._filtered) {
            this._json.linhas.splice(this._json.linhas.indexOf(json.linhas[this._indice]), 1);
        }

        json.linhas.splice(this._indice, 1);

        if (json.linhas.length <= 0) {
            this._indice = -1;
            this._eof = true;
        }

        if (tmp > 0) {
            this._indice = tmp - 1;

            if (tmp >= this.recordCount())
                this._eof = true;
        } else
            this._indice = 0;
        this.atualizaDependentes(3);
    }
    return deletou;
};

DataSet.prototype.post = function() {
    if (this._state === 0)
        throw "O Client esta em modo consulta.";

    var posto = true;
    var stateTmp = this._state;
    if (this._tabela) {
        var _this = this;
        var metodo = "insere";
        if (this._state === 2) {
            metodo = "atualiza";
        }

        executaServico("criaFormPai", "TecniconTDataSetJS." + metodo, function(data) {
            posto = false;
            jAlert(data, "Aviso");
        }, function(data) {
            _this._json.linhas[_this._indice] = JSON.parse(data).linhas[0];
        }, "&TABELA=" + this._tabela + "&JSON=" + encodeURIComponent(JSON.stringify(this._json.linhas[this._indice])), false);
    }

    if (posto) {
        this._state = 0;
        this.dispatchEvent(onStateChange);
        var g = this._retornaGrid();
        if (g !== null) {
            jQuery(g).setStatus('0');
        }
        this.atualizaDependentes(stateTmp);
    }

    return posto;

};

DataSet.prototype.cancel = function() {

    if (this._state === 1) {
        this._json.linhas.pop();
    } else if (this._state === 2) {
        this._json.linhas[this._indice] = JSON.parse(this._jsontmp);
        this.dispatchEvent(onDataChange);
    }

    this._state = 0;
    this.dispatchEvent(onStateChange);

    var g = this._retornaGrid();
    if (g !== null) {
        jQuery(g).setStatus('0');
    }
};

DataSet.prototype.insertLinha = function(json) {
    if (typeof json === "string")
        json = JSON.parse(json);

    if (json.linhas !== null)
        this._json.linhas.push(json.linhas[0]);
    else
        this._json.linhas.push(json);
    this._eof = false;
    this.last();
};

DataSet.prototype.updateLinha = function(json) {
    if (typeof json === "string")
        json = JSON.parse(json);

    if (json.linhas !== null)
        json = json.linhas[0];

    if (this._filtered) {
        for (var i = 0; i < this._json.linhas.length; i++) {
            if (this._json.linhas[i] === this._filtro[this._indice]) {
                this._filtro[this._indice] = json;
                this._json.linhas[i] = json;
            }
        }
    } else {
        this._json.linhas[this._indice] = json;
    }

    try {
        this.atualizaDependentes(2);
    } catch (ex) {

    }

};

DataSet.prototype.next = function() {
    if (this._indice + 1 > this.recordCount() - 1) {
        this.last();
    } else
        this.setIndice(this._indice + 1);
};

DataSet.prototype.next2 = function() {
    if (this._indice + 1 > this.recordCount() - 1) {
        this.last2();
    } else
        this.setIndice2(this._indice + 1);
};

DataSet.prototype.prev = function() {
    if ((this._indice - 1) < 0) {
        this.first();
    } else
        this.setIndice(this._indice - 1);
};

DataSet.prototype.first = function() {
    if (this.recordCount() > 0) {
        this._eof = false;
        this._bof = true;
        this.setIndice(0);
    } else {
        this._eof = true;
        this._bof = true;
    }
};

DataSet.prototype.last = function() {
    if (this.recordCount() > 0) {
        this._bof = false;
        this._eof = true;
        this.setIndice(this.recordCount() - 1);

    } else {
        this._eof = true;
        this._bof = true;
    }
};

DataSet.prototype.last2 = function() {
    if (this.recordCount() > 0) {
        this._bof2 = false;
        this._eof2 = true;
        this.setIndice(this.recordCount() - 1);

    } else {
        this._eof2 = true;
        this._bof2 = true;
    }
};

DataSet.prototype.eof = function() {
    return this._eof;
};

DataSet.prototype.eof2 = function() {
    return this._eof2;
};

DataSet.prototype.isEmpty = function() {
    return this.recordCount() <= 0;
};

DataSet.prototype.fieldByName = function(campo) {
    if (this._json !== null && this._json !== "") {
        var l = this._json.colunas.length;
        var f = null;
        var tmp = this;

        f = this._json.colunas[this.index[campo]];

        if (!f)
            throw new Error('Campo ' + campo + ' não localizado');

        if (this._tiporeg === 2)
            campo = this.index[campo];

        var linhas = tmp._json.linhas;
        if (this._filtered)
            linhas = this._filtro;

        f.asString = function(val) {
            if (val !== undefined) {
                if (tmp._state !== 1 && tmp._state !== 2) {
                    throw 'CDS não esta em modo de edit/insert';
                }
                linhas[tmp._indice][campo] = val;
                tmp.dispatchEvent(onDataChange);
            }

            if (linhas.lenght <= 0)
                return "";

            if (this.TP === "D" || this.TP === "date")
                return formataValores("D", linhas[tmp._indice][campo]);

            if (!linhas[tmp._indice][campo])
                return linhas[tmp._indice][campo];
            else if (typeof linhas[tmp._indice][campo] === 'string')
                return linhas[tmp._indice][campo];
            else
                return linhas[tmp._indice][campo];
        };

        f.isNull = function() {
            return linhas[tmp._indice][campo] === null || linhas[tmp._indice][campo] === "";
        };

        f.asDate = function(val) {
            if (val !== undefined && val !== null && val !== "") {
                throw 'Para setar valor, asDate não pode ser utilizado';
            }

            if (linhas[tmp._indice][campo] !== "") {
                var pattern = /(\d{2})\/(\d{2})\/(\d{4})/;
                return new Date(linhas[tmp._indice][campo].replace(pattern, '$3-$2-$1'));
            }
            return null;
        };

        f.asDouble = function(val) {
            if (val !== undefined && val !== null && val !== "") {
                if (tmp._state !== 1 && tmp._state !== 2) {
                    throw 'CDS não esta em modo de edit/insert';
                }
                if (typeof val === "string")
                    val = String(parseDouble(val));
                else if (typeof val === "number")
                    val = String(val);
                linhas[tmp._indice][campo] = val;
                onDataChange.target = tmp;
                tmp.dispatchEvent(onDataChange);
            }

            return parseDouble(linhas[tmp._indice][campo]);
        };
        return f;
    } else {
        var grid = this._retornaGrid();
        return {
            asString: function() {
                return RetornaColuna(jQuery(grid).find('.trSelected'), RetornaSeqColuna(grid, campo));
            }
        };
    }
};

DataSet.prototype.findField = function(campo) {
    var f = this._json.colunas[this.index[campo]];
    return f;
};

DataSet.prototype.indexFieldName = function(campo, sortOrder, camposAds) {
    var c = this._json.colunas[this.index[campo]];
    var tp2 = "";
    if (camposAds && camposAds.length > 0)
        tp2 = this._json.colunas[this.index[camposAds[0]]].TP;

    var json = this._json.linhas;

    if (this._filtered)
        json = this._filtro;

    var tmp = json[this._indice];

    //var tmp = this._json.linhas[this._indice];

    json = qsort(json, c.TP, sortOrder, campo, camposAds, tp2);

    if (this._filtered)
        this._filtro = json;
    else
        this._json.linhas = json;

    /*if (c.TP === 'I' || c.TP === 'i4') {
        this._json.linhas.sort(function(a, b) {
            var compA = parseInt(replaceAll(a[campo], '.', ''), 10);
            var compB = parseInt(replaceAll(b[campo], '.', ''), 10);
            if (sortOrder === 'asc')
                return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
            else
                return (compA < compB) ? 1 : (compA > compB) ? -1 : 0;
        });
    }
    // DATE
    else if (c.TP === 'D' || c.TP.toLowerCase() === 'date') {
        this._json.linhas.sort(function(a, b) {
            var compA, compB;
            if (a[campo].indexOf('/') > 0) {
                compA = a[campo].split('/');
                compB = b[campo].split('/');
            } else {
                compA = [
                    a[campo].substr(6, 2),
                    a[campo].substr(4, 2),
                    a[campo].substr(0, 4)
                ];
                compB = [
                    b[campo].substr(6, 2),
                    b[campo].substr(4, 2),
                    b[campo].substr(0, 4)
                ];
            }
            var dtA = new Date(compA[1] + '/' + compA[0] + '/' + compA[2]);
            var dtB = new Date(compB[1] + '/' + compB[0] + '/' + compB[2]);
            if (sortOrder === 'asc')
                return (dtA < dtB) ? -1 : (dtA > dtB) ? 1 : 0;
            else
                return (dtA < dtB) ? 1 : (dtA > dtB) ? -1 : 0;
        });
    }
    // NUMERIC
    else if (c.TP === 'N' || c.TP === 'fixedFMT') {
        this._json.linhas.sort(function(a, b) {
            var compA = parseFloat(replaceAll(a[campo], ',', '.'));
            var compB = parseFloat(replaceAll(b[campo], ',', '.'));
            if (sortOrder === 'asc')
                return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
            else
                return (compA < compB) ? 1 : (compA > compB) ? -1 : 0;
        });
    }
    // HORA
    else if (c.TP === 'H' || c.TP === 'TMS' || c.TP === 'TM') {
        this._json.linhas.sort(function(a, b) {
            var compA = a[campo].split(':');
            var compB = b[campo].split(':');

            var hrA = new Date();
            hrA.setHours(compA[0]);
            hrA.setMinutes(compA[1]);
            hrA.setSeconds(compA[2]);
            var hrB = new Date();
            hrB.setHours(compB[0]);
            hrB.setMinutes(compB[1]);
            hrB.setSeconds(compB[2]);
            if (sortOrder === 'asc')
                return (hrA < hrB) ? -1 : (hrA > hrB) ? 1 : 0;
            else
                return (hrA < hrB) ? 1 : (hrA > hrB) ? -1 : 0;
        });
    }
    // STRING
    else {
        var vlr = "0";
        this._json.linhas.sort(function(a, b) {
            var compA = a[campo].toUpperCase();
            var compB = b[campo].toUpperCase();
            if (sortOrder === 'asc')
                return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
            else
                return (compA < compB) ? 1 : (compA > compB) ? -1 : 0;
        });
    }*/
    //this._indice = this._json.linhas.indexOf(tmp);
    this._indice = json.indexOf(tmp);
};

DataSet.prototype.indexFieldName2 = function(campo, sortOrder) {
    var c = this._json.colunas[this.index[campo]];
    var tmp = this._json.linhas[this._indice];
    if (c.TP === 'I' || c.TP === 'i4') {
        this._json.linhas.sort(function(a, b) {
            var compA = parseInt(replaceAll(a[campo], '.', ''), 10);
            var compB = parseInt(replaceAll(b[campo], '.', ''), 10);
            if (sortOrder === 'asc')
                return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
            else
                return (compA < compB) ? 1 : (compA > compB) ? -1 : 0;
        });
    }
    // DATE
    else if (c.TP === 'D' || c.TP.toLowerCase() === 'date') {
        this._json.linhas.sort(function(a, b) {
            var compA, compB;
            if (a[campo].indexOf('/') > 0) {
                compA = a[campo].split('/');
                compB = b[campo].split('/');
            } else {
                compA = [
                    a[campo].substr(6, 2),
                    a[campo].substr(4, 2),
                    a[campo].substr(0, 4)
                ];
                compB = [
                    b[campo].substr(6, 2),
                    b[campo].substr(4, 2),
                    b[campo].substr(0, 4)
                ];
            }
            var dtA = new Date(compA[1] + '/' + compA[0] + '/' + compA[2]);
            var dtB = new Date(compB[1] + '/' + compB[0] + '/' + compB[2]);
            if (sortOrder === 'asc')
                return (dtA < dtB) ? -1 : (dtA > dtB) ? 1 : 0;
            else
                return (dtA < dtB) ? 1 : (dtA > dtB) ? -1 : 0;
        });
    }
    // NUMERIC
    else if (c.TP === 'N' || c.TP === 'fixedFMT') {
        this._json.linhas.sort(function(a, b) {
            var compA = parseFloat(replaceAll(a[campo], ',', '.'));
            var compB = parseFloat(replaceAll(b[campo], ',', '.'));
            if (sortOrder === 'asc')
                return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
            else
                return (compA < compB) ? 1 : (compA > compB) ? -1 : 0;
        });
    }
    // HORA
    else if (c.TP === 'H' || c.TP === 'TMS' || c.TP === 'TM') {
        this._json.linhas.sort(function(a, b) {
            var compA = a[campo].split(':');
            var compB = b[campo].split(':');

            var hrA = new Date();
            hrA.setHours(compA[0]);
            hrA.setMinutes(compA[1]);
            hrA.setSeconds(compA[2]);
            var hrB = new Date();
            hrB.setHours(compB[0]);
            hrB.setMinutes(compB[1]);
            hrB.setSeconds(compB[2]);
            if (sortOrder === 'asc')
                return (hrA < hrB) ? -1 : (hrA > hrB) ? 1 : 0;
            else
                return (hrA < hrB) ? 1 : (hrA > hrB) ? -1 : 0;
        });
    }
    // STRING
    else {
        var vlr = "0";
        this._json.linhas.sort(function(a, b) {
            var compA = a[campo].toUpperCase();
            var compB = b[campo].toUpperCase();
            if (sortOrder === 'asc')
                return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
            else
                return (compA < compB) ? 1 : (compA > compB) ? -1 : 0;
        });
    }
    this._indice = this._json.linhas.indexOf(tmp);
};

DataSet.prototype.filter = function(campo, valor) {

    this._filtro = [];

    valor = valor.toLowerCase(); /* tranformar para minusculo antes de filtrar - bela */
    var valor2 = valor;

    if (this._json.colunas[this.index[campo]] && (this._json.colunas[this.index[campo]].TP === 'D' || this._json.colunas[this.index[campo]].TP === 'date')) {
        var tmp = valor.split('/');
        valor2 = tmp[2] + tmp[1] + tmp[0];
    }

    for (var i = 0; i < this._json.linhas.length; i++) {

        if (!this._json.linhas[i][campo]) {
            continue;
        }

        if (this._json.linhas[i][campo].toLowerCase().indexOf(valor) >= 0 || this._json.linhas[i][campo].toLowerCase().indexOf(valor2) >= 0) {
            this._filtro.push(this._json.linhas[i]);
        }
    }

    this._eof = false;
    this._filtered = true;

    if (this._filtro.length === 0)
        this.setIndice(-1);
    else
        this.setIndice(0);
};

// 0.5
DataSet.prototype.filterAdv = function(campo, valor, operador) {

    var tipo = this.fieldByName(campo).TP;
    if (tipo === "D" || tipo === "date") {
        valor = valor.split("/");
        valor = valor[2] + valor[1] + valor[0];
    }
    valor = valor.toLowerCase();
    valor = converterValor(valor, tipo);
    var val;
    this._filtro = [];

    for (var i = 0; i < this._json.linhas.length; i++) {
        val = converterValor(this._json.linhas[i][campo].toLowerCase(), tipo);

        if (operador === "<" && val < valor)
            this._filtro.push(this._json.linhas[i]);
        else if (operador === "<=" && val <= valor)
            this._filtro.push(this._json.linhas[i]);
        else if (operador === ">" && val > valor)
            this._filtro.push(this._json.linhas[i]);
        else if (operador === ">=" && val >= valor)
            this._filtro.push(this._json.linhas[i]);
        else if (operador === "=" && val === valor)
            this._filtro.push(this._json.linhas[i]);
        else if (operador === "<>" && val !== valor)
            this._filtro.push(this._json.linhas[i]);
    }

    if (this._filtro.length === 0)
        this.setIndice(-1);
    else
        this.setIndice(0);
    this._eof = false;
    this._filtered = true;
};

DataSet.prototype.filterAdvComp = function(campo, valor, operador) {

    var val;
    this._filtro = [];
    var fltTmp = this._json.linhas;
    var op = operador;
    var str = (typeof operador === "string");


    for (var xz = 0; xz < campo.length; xz++) {

        var tipo = this.fieldByName(campo[xz]).TP;
        if (tipo === "D" || tipo === "date") {
            valor[xz] = valor[xz].split("/");
            valor[xz] = valor[xz][2] + valor[xz][1] + valor[xz][0];
        }

        if (typeof valor[xz] !== "number")
            valor[xz] = valor[xz].toLowerCase();
        valor[xz] = converterValor(valor[xz], tipo);

        if (!str) {
            op = operador[xz];
        }

        for (var i = 0; i < fltTmp.length; i++) {
            val = converterValor(fltTmp[i][campo[xz]].toLowerCase(), tipo);

            if (op === "<" && val < valor[xz])
                this._filtro.push(fltTmp[i]);
            else if (op === "<=" && val <= valor[xz])
                this._filtro.push(fltTmp[i]);
            else if (op === ">" && val > valor[xz])
                this._filtro.push(fltTmp[i]);
            else if (op === ">=" && val >= valor[xz])
                this._filtro.push(fltTmp[i]);
            else if (op === "=" && val === valor[xz])
                this._filtro.push(fltTmp[i]);
            else if (op === "<>" && val !== valor[xz])
                this._filtro.push(fltTmp[i]);
            else if (op.toLowerCase() === "contém" && val.indexOf(valor[xz]) > -1)
                this._filtro.push(fltTmp[i]);
            else if (op.toLowerCase() === "iniciar" && val.indexOf(valor[xz]) === 0)
                this._filtro.push(fltTmp[i]);
        }

        fltTmp = this._filtro;
        this._filtro = [];
    }

    this._filtro = fltTmp;

    fltTmp = [];

    if (this._filtro.length === 0)
        this.setIndice(-1);
    else
        this.setIndice(0);
    this._eof = false;
    this._filtered = true;
};

DataSet.prototype.clearFilter = function() {
    this._filtro = null;
    this._filtered = false;
};

DataSet.prototype.locate = function(campo, valor) {
    this.__ignoreEvent = true;
    this.first();

    while (!this.eof()) {
        if (this.fieldByName(campo).asString() === valor) {
            this.__ignoreEvent = false;
            this.setIndice(this.getIndice());
            return true;
        }

        this.next();
    }

    this.__ignoreEvent = false;
    return false;
};

DataSet.prototype.change = function(e) {
    if (this.nindex.indexOf(e.target.id) >= 0 && e.target.value !== this.fieldByName(e.target.id).asString())
        this.fieldByName(e.target.id).asString(e.target.value);
};

DataSet.prototype.init = function(idPai) {
    if (idPai)
        this._pai = idPai;

    var i;

    if (this._pai !== '') {
        var tmp = this;
        var inpt = jQuery('#' + this._pai).get(0).querySelectorAll('input, select, textarea');
        var l = inpt.length;
        for (i = 0; i < l; i++) {
            if (inpt[i].getAttribute('r') === null) {
                inpt[i].addEventListener("blur", function(e) {
                    tmp.change(e);
                });
                //                    inpt[i].onchange = function(e) {
                //                        tmp.change(e);
                //                    };
                //                if (inpt[i].tagName === "SELECT") {
                //                    inpt[i].onblur = function(e) {
                //                        tmp.change(e);
                //                    };
                //                } else {
                //                    inpt[i].onchange = function(e) {
                //                        tmp.change(e);
                //                    };
                //                }
            }
        }

        if (l <= 0) {
            inpt = jQuery('#' + this._pai).get(0).querySelectorAll(montaSeletorComponent());
            l = inpt.length;
            for (i = 0; i < l; i++) {
                if (inpt[i].getAttribute('r') === null) {
                    inpt[i].addEventListener("blur", function(e) {
                        tmp.change(e);
                    });
                }
            }
        }
    }
};

DataSet.prototype.addDependente = function(objE, tipo) {
    if (this._dependentes === null) {
        this._dependentes = [{
            tipo: tipo,
            obj: objE
        }];
    } else {
        this._dependentes.push({
            tipo: tipo,
            obj: objE
        });
    }

    if (tipo === "grid") {
        if (objE.tagName === "T-GRID")
            objE.setCDS(this);
        else
            jQuery(objE).setCDS(this);
    }

};

DataSet.prototype.processaCampos = function(e) {
    var i;
    var z;
    if (this._json !== null) {
        for (i = 0; i < this._json.colunas.length; i++) {
            if (this._json.colunas[i].TP === 'CALCULADO') {
                var formula = this._json.colunas[i].DADOS;
                for (z = 0; z < this._json.colunas.length; z++) {
                    formula = formula.replaceAll("{" + this._json.colunas[z].NOME + "}", this.fieldByName(this._json.colunas[z].NOME).asString());
                }
                this._json.linhas[this.getIndice()][this._json.colunas[i].NOME] = evaEvil(formula);
            }
        }

        if (this._pai && this._pai !== "") {

            var inpt = jQuery('#' + this._pai).get(0).querySelectorAll('input, select, textarea');
            var l = inpt.length;
            for (i = 0; i < l; i++) {
                //                if (!inpt[i].getAttribute('r')) {
                if (this.nindex.indexOf(inpt[i].id.replace("FK_", "")) >= 0 && this.fieldByName(inpt[i].id.replace("FK_", "")).asString() !== inpt[i].value) {
                    inpt[i].value = formataValores(this.fieldByName(inpt[i].id.replace("FK_", "")).TIPO, this.fieldByName(inpt[i].id.replace("FK_", "")).asString(), 2, this.fieldByName(inpt[i].id.replace("FK_", "")).chave);
                }
                //                }
            }

            if (l <= 0) {
                inpt = jQuery('#' + this._pai).get(0).querySelectorAll(montaSeletorComponent());
                l = inpt.length;
                for (i = 0; i < l; i++) {
                    //                if (!inpt[i].getAttribute('r')) {
                    if (this.nindex.indexOf(inpt[i].id.replace("FK_", "")) >= 0 && this.fieldByName(inpt[i].id.replace("FK_", "")).asString() !== inpt[i].value) {
                        inpt[i].value = formataValores(this.fieldByName(inpt[i].id.replace("FK_", "")).TIPO, this.fieldByName(inpt[i].id.replace("FK_", "")).asString(), 2, this.fieldByName(inpt[i].id.replace("FK_", "")).chave);
                    }
                    //                }
                }
            }

            var grid = this._retornaGrid();
            var idTmp = "";
            try {
                if (grid.tagName !== "T-GRID" && grid.get(0)) {
                    if (this._camposChaves.length <= 0) {
                        for (z = 0; z < this._json.colunas.length; z++) {
                            if (this._json.colunas[z].chave === 'S') {
                                if (idTmp !== "")
                                    idTmp += "-";
                                idTmp = this.fieldByName(this._json.colunas[z].NOME).asString();
                            }
                        }
                    }
                    var tr = grid.get(0).querySelector("#tr-" + idTmp);
                    if (tr) {
                        for (z = 0; z < this._json.colunas.length; z++) {
                            SetaValorColuna(grid.get(0).querySelector(".trSelected"), RetornaSeqColuna(grid.get(0), this._json.colunas[z].NOME), this.fieldByName(this._json.colunas[z].NOME).asString());
                        }
                    }
                }
            } catch (ex) {

            }
        }

    }
};

DataSet.prototype._retornaGrid = function() {
    if (this._dependentes !== null) {
        for (var k in this._dependentes) {
            if (this._dependentes[k].tipo === 'grid')
                return this._dependentes[k].obj;
        }
    }
};

DataSet.prototype._getListeners = function(type, useCapture) {
    var captype = (useCapture ? '1' : '0') + type;
    if (!(captype in this._registrations))
        this._registrations[captype] = [];
    return this._registrations[captype];
};

DataSet.prototype.addEventListener = function(type, listener, useCapture) {
    var listeners = this._getListeners(type, useCapture);
    var ix = listeners.indexOf(listener);
    if (ix === -1)
        listeners.push(listener);
};

DataSet.prototype.removeEventListener = function(type, listener, useCapture) {
    var listeners = this._getListeners(type, useCapture);
    var ix = listeners.indexOf(listener);
    if (ix !== -1)
        listeners.splice(ix, 1);
};

DataSet.prototype.dispatchEvent = function(evt) {
    var listeners = this._getListeners(evt.type, false).slice();
    for (var i = 0; i < listeners.length; i++)
        listeners[i].call(this, evt);
    return !evt.defaultPrevented;
};

DataSet.prototype.clone = function() {
    var cds = new DataSet();
    var tmp = JSON.stringify(this.jsonData());
    cds.setJsonData(JSON.parse(tmp));
    return cds;
};

function qsort(a, tipo, sortType, campo, camposAdd, tipoAdd) {
    if (a.length === 0) return [];

    var left = [],
        right = [],
        pivot = a[0];

    pivot = trataValor(pivot[campo], tipo);

    for (var i = 1; i < a.length; i++) {
        if (sortType === 'asc') {
            if (trataValor(a[i][campo], tipo) < pivot)
                left.push(a[i]);
            else {
                if (camposAdd && camposAdd.length > 0 && trataValor(a[i][campo], tipo) == pivot) {
                    //TODO fazer infinito
                    if (trataValor(a[i][camposAdd[0]], tipoAdd) < trataValor(a[0][camposAdd[0]], tipoAdd))
                        left.push(a[i]);
                    else
                        right.push(a[i]);
                } else {
                    right.push(a[i]);
                }
            }
        } else {
            if (trataValor(a[i][campo], tipo) > pivot)
                left.push(a[i]);
            else {
                if (camposAdd && camposAdd.length > 0 && trataValor(a[i][campo], tipo) == pivot) {
                    //TODO fazer infinito
                    if (trataValor(a[i][camposAdd[0]], tipoAdd) > trataValor(a[0][camposAdd[0]], tipoAdd))
                        left.push(a[i]);
                    else
                        right.push(a[i]);
                } else {
                    right.push(a[i]);
                }
            }
        }
    }

    return qsort(left, tipo, sortType, campo, camposAdd, tipoAdd).concat(a[0], qsort(right, tipo, sortType, campo, camposAdd, tipoAdd));
}

function trataValor(valor, tipo) {
    if (!valor || valor === '')
        return valor;
    if (tipo === 'I' || tipo === 'i4') {
        return parseInt(String(valor).replaceAll('.', ''), 10);
    } else if (tipo === 'D' || tipo.toLowerCase() === 'date') {
        var compA;
        if (valor.indexOf('/') > 0) {
            compA = valor.split('/');
        } else {
            compA = [
                valor.substr(6, 2),
                valor.substr(4, 2),
                valor.substr(0, 4)
            ];
        }
        var dts = new Date(compA[1] + '/' + compA[0] + '/' + compA[2]);
        dts = dts.setHours(0, 0, 0);
        return dts;
    } else if (tipo === 'N' || tipo === 'fixedFMT') {
        return parseFloat(replaceAll(replaceAll(valor, '.', ''), ',', '.'));
    } else if (tipo === 'H' || tipo === 'TMS' || tipo === 'TM') {
        valor = valor.split(':');

        var hrA = new Date();
        hrA.setHours(valor[0]);
        hrA.setMinutes(valor[1]);
        hrA.setSeconds(valor[2]);

        return hrA;
    } else {
        return valor.toUpperCase();
    }
}

DataSet.prototype.ordenar = function(ordem) {
  this._ordem = ordem;
};

if (mobileDev) {
    DataSet.prototype.post = function(callback) {
        if (this._state === 0)
            throw "O Client esta em modo consulta.";

        var stateTmp = this._state;
        if (this._tabela) {
            var _this = this;
            var metodo = "insere";
            if (this._state === 2) {
                metodo = "atualiza";
            }

            db.transaction(function(tx) {
              var sql = '',
                tmp = [],
                strs = [],
                valores = [],
                cond = '';

              var cps = _this.fieldDefs(), x = 0;
              var lx = cps.length;

              if (metodo === 'insere') {
                sql = 'INSERT INTO ' + _this._tabela + ' (';
              } else {
                sql = 'UPDATE ' + _this._tabela + ' SET ';

                for (x = 0; x < lx; x++) {
                  if (cps[x].CHAVE && cps[x].CHAVE === 'S') {
                    if (cond === '')
                      cond = 'WHERE ';
                    else
                      cond = ' AND ';

                    cond +=  _this._tabela + '.' + cps[x].NOME + ' = ' + _this._json.linhas[_this._indice][cps[x].NOME];
                  }
                }
              }

              for (x = 0; x < lx; x++) {

                if (!_this._json.linhas[_this._indice][cps[x].NOME])
                  continue;

                if (metodo === 'insere') {
                  tmp.push(cps[x].NOME);
                  strs.push('?');
                } else {
                  strs.push(cps[x].NOME + ' = ?')
                }

                valores.push(_this._json.linhas[_this._indice][cps[x].NOME]);
              }

              if (metodo === 'insere') {
                sql += tmp.join(',') + ') VALUES ( '+strs.join(',')+' )';
              } else {
                sql += strs.join(',');
              }

              tx.executeSql(sql + cond, valores, function(tx, rs) {
                try {
                  if (isInteger(rs.insertId) && _this._tabela !== 'CLIFOREND') {
                    for (var x = 0; x < cps.length; x++) {
                      if (cps[x].CHAVE === 'S')
                        _this._json.linhas[_this._indice][cps[x].NOME] = rs.insertId;
                    }
                  }
                } catch(ex) {

                }


                _this._state = 0;
                _this.dispatchEvent(onStateChange);
                var g = _this._retornaGrid();
                if (g) {
                  jQuery(g).setStatus('0');
                }
                _this.atualizaDependentes(stateTmp);

                if (callback)
                  callback();

              }, function(tx, err) {
                console.log(err);
                alert(err);
                versao.lerro(err);
              });

            });

            /*var t = db.transaction(this._tabela, 'readwrite');

            t.oncomplete = function(e) {
                _this._state = 0;
                _this.dispatchEvent(onStateChange);
                var g = _this._retornaGrid();
                if (g) {
                    jQuery(g).setStatus('0');
                }
                _this.atualizaDependentes(stateTmp);
            };

            var obj = t.objectStore(this._tabela);

            var request = obj.put(this._json.linhas[this._indice]);
            */
        }

    };

    DataSet.prototype.open = function(callback, pars) {
      if (this._state !== 0)
        throw "O Cliente não esta em modo de consulta";

        var _this = this;
        var sql = 'SELECT ' + _this._tabela + '.* FROM ' + _this._tabela + ' '+ _this._adicional;

        if (this._commandText) {
          sql = this._commandText;
        }

        if (!pars)
          pars = [];

        db.transaction(function(tx) {
          tx.executeSql(sql +' ' + _this._condicao + ' ' + _this._ordem, pars, function(tx, rs) {
            var i = 0, l = rs.rows.length;
            for(; i < l; i++) {
              _this._json.linhas.push(JSON.parse(JSON.stringify(rs.rows.item(i))));
            }

            _this.first();

            if(callback)
              callback();

              _this.atualizaDependentes();

            }, function(tx, err) {
              console.log(err);
              alert(err);
            });
          });

    };

    DataSet.prototype.del = function(callback) {
        if (this._state !== 0)
            throw "O Cliente não esta em modo de consulta";

        var _this = this;
                /*var t = db.transaction(this._tabela, 'readwrite');
                var ob = t.objsectStore(this._tabela);

                ob.delete();*/

        var cps = _this.fieldDefs(), x = 0;
        var lx = cps.length;
        var cond = '';
        var tmp = this._indice;

        for (x = 0; x < lx; x++) {
          if (cps[x].CHAVE && cps[x].CHAVE === 'S') {
            if (cond === '')
              cond = 'WHERE ';
            else
              cond = ' AND ';

            cond +=  _this._tabela + '.' + cps[x].NOME + ' = ' + _this._json.linhas[_this._indice][cps[x].NOME];
          }
        }

        db.transaction(function(tx) {
          tx.executeSql('DELETE FROM ' + _this._tabela + ' ' + cond, [], function(tx, rs) {

            _this._json.linhas.splice(_this._indice, 1);

            if (_this._json.linhas.length <= 0) {
                _this._indice = -1;
                _this._eof = true;
            }

            if (tmp > 0) {
                _this._indice = tmp - 1;

                if (tmp >= _this.recordCount())
                    _this._eof = true;
            } else
                _this._indice = 0;
            _this.atualizaDependentes(3);

            if (callback)
              callback();
          }, function(tx, err) {
            fal(err);
          });
        });
    };

    DataSet.prototype.naCondicao = function(obj) {
      if (!this._condicao)
        return true;

      this._condicao = this._condicao.replace('WHERE ', '');
      var cnds = this._condicao.split(' '),
          achou = false;

      for (var i = 0; i < cnds.length; i += 4) {
        switch(cnds[i + 1]) {
          case '=':
            if (obj[cnds[i]] === cnds[i + 2])
              achou = true;
            break;
          case 'like':
            if (obj[cnds[i]].indexOf(cnds[i + 2]) > -1)
              achou = true;
            break;
          case '>':
            if (parseInt(obj[cnds[i]], 10) > parseInt(cnds[i + 2], 10))
              return true;
            break;
          default:
              achou = false;
            break;
        }
        //if (obj[cnds[i]])
      }

      return achou;

    };

    DataSet.prototype.limpar = function(callback) {
      var _this = this;
      db.transaction(function(tx) {
        tx.executeSql('DELETE FROM ' + _this._tabela, [], function(tx, rs) {
          callback();
        }, function(tx, err) {
          alert(err);
        });
      });
    };

    DataSet.prototype.adicional = function(add) {
      this._adicional = add;
    };

    DataSet.prototype.commandText = function(cmd) {
      this._commandText = cmd;
    };
}
