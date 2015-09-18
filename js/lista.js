function TLista(obj, ops) {
    this.cds = null;

	this.ops = ops;

	this.obj = obj;

    obj.lista = this;
}

TLista.prototype.add = function(valor) {

};

TLista.prototype.desenha = function(cdsLink) {
    var _cds = this.cds;
	if (cdsLink) {
		_cds = cdsLink;
		this.cds = cdsLink;
	}

	var tpl = this.ops.template,
		cps = _cds.fieldDefs(),
		ind = _cds.getIndice(),
		html = [],
		tmp,
		i;
	var l = cps.length;
	_cds.__ignoreEvent = true;

  _cds.first();

	while(!_cds.eof()) {

		tmp = tpl;

		for(i = 0; i < l; i++) {
      if (cps[i].TP === 'N') {
        tmp = tmp.replace(eval('/{'+cps[i].NOME+'}/g'), formataValores('N', _cds.fieldByName(cps[i].NOME).asString(), 2, 'N'));
      } else
		    tmp = tmp.replace(eval('/{'+cps[i].NOME+'}/g'), _cds.fieldByName(cps[i].NOME).asString());
		}
		html.push(tmp);
		_cds.next();
	}

  if (_cds.recordCount() <= 0 && this.ops.vazio) {
    html.push(this.ops.vazio);
  }

	_cds.setIndice(ind);
	_cds.__ignoreEvent = false;

	this.obj.innerHTML = html.join('');

  if (_cds.recordCount() > 0) {
  	var cs = this.obj.childNodes;
  	i = 0, l = cs.length;
  	var _this = this;
  	for(;i < l; i++) {
  		if (cs[i].nodeType === 3)
  			continue;

  		cs[i].addEventListener('click', function(e) {
  			/*if (_this.cds)
  				_this.cds.setIndice(e.target.parentNode.indexOf(e.target));*/
  			if (_this.ops.click) {
  				_this.ops.click.call(e.target, e);
  			}
  		});
  	}

    if (this.ops.default) {
      this.obj.value = this.ops.default;
    }

  }

  if (this.ops.callback)
    this.ops.callback();

};
