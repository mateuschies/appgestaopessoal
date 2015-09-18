var versao = {
  colunas: []
};

var fwSISTEMA = 'SSISTEMA I Código, VERSAO V Versão, DTATUALIZACAO D Data Atualizacao';		


versao.carregaVersao = function(db) {
  //VERSAO 1

  db.transaction(function(tx) {
    //versao.limpaTudo();
    tx.executeSql('SELECT SISTEMA.VERSAO FROM SISTEMA',[], function(t, r) {
      versao.versao = r.rows.item(0).VERSAO;
      versao.processaVersao();
    }, function(t, e) {
      versao.versao = 0;
      versao.processaVersao();
    });
  });
};

versao.lerro = function(err, onde) {
  var ds = new DataSet('', 'TABERRO', function() {
    ds.insert();

    var d = new Date();
    var dt = d.toLocaleDateString().split('/');
    var df = dt[2]+'-'+dt[1]+'-'+dt[0];

    ds.fieldByName('DATA').asString(df);
    ds.fieldByName('MENSAGEM').asString(onde + '-' + err.message);
    ds.post();
  });
};

versao.databanco = function(dt) {
  if (typeof dt === 'string')
    dt = dt.split('/');
  else
    dt = dt.toLocaleDateString().split('/');
  return dt[2]+'-'+dt[1]+'-'+dt[0];
};

versao.databanconormal = function(dt) {
  if (typeof dt !== 'string') {
    var dia, mes, ano;

    dia = dt.getDate();
    mes = dt.getMonth()+1;
    ano = dt.getFullYear();

    if (String(dia).length === 1)
      dia = '0' + dia;

    if (String(mes).length === 1)
      mes = '0' + mes;

    dt = dia+'/'+mes+'/'+ano;
  }

  if (dt.indexOf('-') > 0 ) {
    dt = dt.split('-');

    if (dt[1].length === 1)
      dt[1] = '0' + dt[1];

    if (dt[2].length === 1)
      dt[2] = '0' + dt[2];

    dt = dt.reverse().join('/');
  }

  return dt;
};

versao.datatablet = function(dt) {
  var dt = dt.split('-');

  dt[1] = dt[1].replace('01','1').replace('02','2').replace('03','3').replace('04','4').replace('05', '5')
  .replace('06','6').replace('07','7').replace('08','8').replace('09','9');

  dt[2] = dt[2].replace('01','1').replace('02','2').replace('03','3').replace('04','4').replace('05', '5')
  .replace('06','6').replace('07','7').replace('08','8').replace('09','9');

  return dt.join('-');
};

versao.comparaData = function(dt1, comp, dt2) {
  if (dt1.indexOf('-') > 0)
    dt1 = dt1.split('-');
  else
    dt1 = dt1.split('/').reverse();

  if (dt1[1].length === 1)
    dt1[1] = '0' + dt1[1];

  if (dt1[2].length === 1)
    dt1[2] = '0' + dt1[2];

  if (dt2.indexOf('-') > 0)
    dt2 = dt2.split('-');
  else
    dt2 = dt2.split('/').reverse();


  if (dt2[1].length === 1)
    dt2[1] = '0' + dt2[1];

  if (dt2[2].length === 1)
    dt2[2] = '0' + dt2[2];

  dt1 = dt1.join('');
  dt2 = dt2.join('');

  dt1 = parseInt(dt1, 10);
  dt2 = parseInt(dt2, 10);

  if (comp === '=' && dt1 === dt2) {
    return true;
  } else if (comp === '<') {
    if (dt1 < dt2)
      return true;
  } else if (comp === '<=') {
    if (dt1 <= dt2)
      return true;
  } else if (comp === '>') {
    if (dt1 > dt2)
      return true;
  } else if (comp === '>=') {
    if (dt1 >= dt2)
      return true;
  } else
    return false;

};

versao.limpaTudo = function(callback) {
  db.transaction(function(tx) {
    tx.executeSql('SELECT name FROM sqlite_master WHERE type="table"',[], function(tx, rs) {
      var tbs = [];
      for (var i = 0; i < rs.rows.length; i++) {
        if (rs.rows.item(i).name.indexOf('__') === 0 || rs.rows.item(i).name === 'sqlite_sequence')
          continue;
        tx.executeSql('DROP TABLE ' + rs.rows.item(i).name, [], function(tx, rs) {}, function(tx, err) {console.log(err);});
      }

      if (callback)
        callback();

    }, function(tx, r) {console.log(r);});
  });
};

versao.processaVersao = function() {

  db.transaction(function(tx) {

    if (versao.versao <= 1) {
      tx.executeSql('CREATE TABLE COLUNAS (SCOLUNA INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, TABELA VARCHAR(40) NOT NULL, COLUNAS TEXT)', [], function(tx, rs) {}, versao.erro);

      versao.criaTabela(tx, 'SISTEMA', 'SSISTEMA INT NOT NULL PRIMARY KEY, VERSAO VARCHAR(15) NOT NULL, DTATUALIZACAO DATE', fwSISTEMA);

      tx.executeSql('INSERT INTO SISTEMA VALUES (?, ?, ?)', [1, 0, null], function(tx, rs) {}, versao.erro);

      versao.versao = 1;
      versao.setaVersao(tx);

      versao.criaTabela(tx, 'TABERRO', 'STABERRO INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '+
                        ' DATA DATE, MENSAGEM TEXT',
                        'STABERRO I Sequencial, DATA D Data, MENSAGEM V Mensagem');

      versao.versao =1;
      versao.setaVersao(tx);
    }

    if (versao.versao < 2) {

      versao.criaTabela(tx, 'MEIOPGTO', 'SMEIOPGTO INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '+
                        ' PGTO VARCHAR(2), FORMA VARCHAR(40), TIPO VARCHAR(30)',
                        'SMEIOPGTO I Sequencial, PGTO V Pgto, FORMA V Meio de Pagamento, TIPO V Classificação');

      tx.executeSql('INSERT INTO MEIOPGTO (PGTO,FORMA,TIPO) VALUES (?, ?, ?)', ['CC', 'Cartão de Crédito', 'Saída'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO MEIOPGTO (PGTO,FORMA,TIPO) VALUES (?, ?, ?)', ['PC', 'Parc. Cartão de Crédito', 'Saída'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO MEIOPGTO (PGTO,FORMA,TIPO) VALUES (?, ?, ?)', ['CH', 'Cheque', 'Saída'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO MEIOPGTO (PGTO,FORMA,TIPO) VALUES (?, ?, ?)', ['DB', 'Débito', 'Saída'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO MEIOPGTO (PGTO,FORMA,TIPO) VALUES (?, ?, ?)', ['DP', 'Depósito', 'Entrada'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO MEIOPGTO (PGTO,FORMA,TIPO) VALUES (?, ?, ?)', ['DI', 'Dinheiro', ' Saída'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO MEIOPGTO (PGTO,FORMA,TIPO) VALUES (?, ?, ?)', ['RD', 'Recibo - Recibo em Dinheiro', 'Entrada'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO MEIOPGTO (PGTO,FORMA,TIPO) VALUES (?, ?, ?)', ['SQ', 'Saque', 'Saída'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO MEIOPGTO (PGTO,FORMA,TIPO) VALUES (?, ?, ?)', ['TR', 'Transferência', 'Saída'], function(tx, rs) {}, versao.erro);

      versao.versao =2;
      versao.setaVersao(tx);
    }

    if (versao.versao < 3) {
      versao.criaTabela(tx, 'CONTA', 'SCONTA INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '+
                        ' CONTA VARCHAR(3), TIPO VARCHAR(40), DESCRICAO VARCHAR(50)',
                        'SCONTA I Sequencial, CONTA V Conta, TIPO V Grupo de conta, DESCRICAO V Sub-grupo de conta');

      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['R1', 'Receita', 'Salário/Adiantameto'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['R2', 'Receita', 'Férias'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['R3', 'Receita', '13º salário'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['R4', 'Receita', 'Aposentadoria'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['R5', 'Receita', 'Extra(aluguel, Restituição IR)'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['R6', 'Receita', 'Outras Receitas'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['A1', 'Alimentação', 'Supermercado'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['A2', 'Alimentação', 'Feira/Sacolão'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['A3', 'Alimentação', 'Padaria'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['A4', 'Alimentação', 'Refeição fora de casa'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['A5', 'Alimentação', 'Outros(Café, água, sorvete, etc)'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M1', 'Moradia', 'Prestação ou Aluguel de Imóvel'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M2', 'Moradia', 'Condominio'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M3', 'Moradia', 'Consumo de Água'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M4', 'Moradia', 'Serviço de Limpeza'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M5', 'Moradia', 'Energia Elétrica'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M6', 'Moradia', 'Gás'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M7', 'Moradia', 'IPTU'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M8', 'Moradia', 'Decoração da Casa'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M9', 'Moradia', 'Manutenção/Reforma da casa'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M10', 'Moradia', 'Celular'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M11', 'Moradia', 'Telefone Fixo'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['M12', 'Moradia', 'TV a cabo/Inernet'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['E1', 'Educação', 'Matricula Escolar/Mensalidade'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['E2', 'Educação', 'Material Escolar'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['E3', 'Educação', 'Outros cursos'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['E4', 'Educação', 'Transporte Escolar'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['C1', 'Animal', 'Alimentação'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['C2', 'Animal', 'Banho/Tosa'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['C3', 'Animal', 'Veterinário/Remédios'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['C4', 'Animal', 'Outros'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['S1', 'Saúde', 'Plano de Saúde'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['S2', 'Saúde', 'Medicamento'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['S3', 'Saúde', 'Dentista'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['S4', 'Saúde', 'Terapia/Psicologa'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['S5', 'Saúde', 'Médicos/Exames fora do plano'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['S6', 'Saúde', 'Academia/Tratamento Estético'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['T1', 'Transporte', 'Ônibus/Metrô'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['T2', 'Transporte', 'Taxi'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['T3', 'Transporte', 'Combustível'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['T4', 'Transporte', 'Estacionamento'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['T5', 'Transporte', 'Seguro Auto'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['T6', 'Transporte', 'Manutenção/Lavagem/Troca de óleo'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['T7', 'Transporte', 'Licenciamento'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['T8', 'Transporte', 'Pedágio'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['T9', 'Transporte', 'IPVA'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['P1', 'Pessoais', 'Vestuários/Calçados/Acessório'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['P2', 'Pessoais', 'Cabeleireiro/Manicure/Higiene Pessoal'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['P3', 'Pessoais', 'Presentes'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['P4', 'Pessoais', 'Outros'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['L1', 'Lazer', 'Cinema/Teatro/Show'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['L2', 'Lazer', 'Livros/Revistas/CD'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['L3', 'Lazer', 'Clube/Parque/Casa Noturna/Esportes'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['L4', 'Lazer', 'Viagens(hospedagem/refeições/passeios)'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['L5', 'Lazer', 'Restaurantes/Bares/Festas'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['F1', 'Serviços Financeiros', 'Empréstimos'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['F2', 'Serviços Financeiros', '(vida/residencias)'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['F3', 'Serviços Financeiros', 'Previdência Privada'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['F4', 'Serviços Financeiros', 'Juros Cheque especial + IOF'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['F5', 'Serviços Financeiros', 'Tarifas Bancárias'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['F6', 'Serviços Financeiros', 'Financiamento de Veículos'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['F7', 'Serviços Financeiros', 'Pagamento da Fatura do Cartão de Crédito'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['F8', 'Serviços Financeiros', 'Imposto de Renda a Pagar'], function(tx, rs) {}, versao.erro);
      tx.executeSql('INSERT INTO CONTA (CONTA,TIPO,DESCRICAO) VALUES (?, ?, ?)', ['F9', 'Serviços Financeiros', 'Saque'], function(tx, rs) {}, versao.erro);

      versao.versao =3;
      versao.setaVersao(tx);
    }

    if (versao.versao < 4) {
      versao.criaTabela(tx, 'MOVIMENTO', 'SMOVIMENTO INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '+
                        ' SCONTA INTEGER NOT NULL, SMEIOPGTO INTEGER NOT NULL, DATA DATE, DESCRICAO VARCHAR(100), VALOR NUMERIC',
                        'SMOVIMENTO I Sequencial, SCONTA I Cód Conta, SMEIOPGTO I Cód Meio Pagamento, DESCRICAO V Descritivo, DATA D Data, VALOR N Valro R$, CONTA V Conta, TIPO V Grupo Conta, DESCRICAOCONTA V Sub-grupo de conta, PGTO V Pgto, FORMA V Meio de Pagamento, TIPOPGTO V Classificação');
      versao.versao =4;
      versao.setaVersao(tx);
    }
    
    if (versao.versao < 5) {
      versao.criaTabela(tx, 'PREVISAO', 'SPREVISAO INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '+
                        ' SCONTA INTEGER NOT NULL, MES INTEGER NOT NULL, ANO INTEGER NOT NULL, VALOR NUMERIC',
                        'SPREVISAO I Sequencial, SCONTA I Cód Conta, MES I Mês, ANO I Ano, VALOR N Valor R$, CONTA V Conta, TIPO V Grupo Conta, DESCRICAO V Sub-grupo de conta');
      versao.versao =5;
      versao.setaVersao(tx);
    }
	
	if (versao.versao < 6) {
      versao.criaTabela(tx, 'SALDO', 'SSALDO INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '+
                        'MES INTEGER NOT NULL, ANO INTEGER NOT NULL, CCORRENTE NUMERIC, DINHEIRO NUMERIC, CCREDITO NUMERIC',
                        'SSALDO I Sequencial, MES I Mês, ANO I Ano, CCORRENTE N C.Corrente, DINHEIRO N Dinheiro, CCREDITO N C. de Crédito');
      versao.versao =6;
      versao.setaVersao(tx);
    }
	
	if (versao.versao < 7) {
      versao.criaTabela(tx, 'CARONA', 'SCARONA INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '+
                        'DATA DATE, DESCRICAO VARCHAR(100)',
                        'SCARONA I Sequencial, DATA D Dia, DESCRICAO V Motorista');
      versao.versao = 7;
      versao.setaVersao(tx);
    }
	
	if (versao.versao < 8) {      
      versao.versao = 8;
      versao.setaVersao(tx);
    }
	
	if (versao.versao < 9) {      
      versao.versao = 9;
      versao.setaVersao(tx);
    }
	
	if (versao.versao < 10) {      
      versao.versao = 10;
      versao.setaVersao(tx);
    }
	
	if (versao.versao < 11) {      
      versao.versao = 11;
      versao.setaVersao(tx);
    }
	
	if (versao.versao < 12) {      
      versao.versao = 12;
      versao.setaVersao(tx);
    }
	    
	//app.processouVersao();
  });
};

versao.criaTabela = function(tx, tabela, colunas, colunasFW, chaves) {
  var adicional = '';
  if (chaves && chaves.length > 0) {
    adicional = ', PRIMARY KEY ('+chaves.join(',')+')';
  }

  tx.executeSql('CREATE TABLE '+tabela+' ('+colunas+' '+ adicional +')', [], function(tx, rs) {}, versao.erro);

  var cols = [],
      tmp = colunasFW.split(',');
  var i = 0, l = tmp.length;

  for (; i < l; i++) {
    var t = tmp[i].trim().split(' ', 3);
    cols.push({
      NOME: t[0],
      TP: t[1],
      CHAVE: (i === 0) ? "S" : "N",
      LABEL: t[2]
    });
  }

  tx.executeSql('INSERT INTO COLUNAS (TABELA, COLUNAS) VALUES (?,?)', [tabela, JSON.stringify(cols)], function(tx, rs) {}, versao.erro);

};

versao.atualizaFW = function(tx, tabela, colunasFW) {
  var cols = [],
      tmp = colunasFW.split(',');
  var i = 0, l = tmp.length;

  for (; i < l; i++) {
    var t = tmp[i].trim().split(' ', 3);
    cols.push({
      NOME: t[0],
      TP: t[1],
      CHAVE: (i === 0) ? "S" : "N",
      LABEL: t[2]
    });
  }

  tx.executeSql('UPDATE COLUNAS SET COLUNAS = ? WHERE TABELA = ?', [JSON.stringify(cols), tabela], function(tx, rs) {}, versao.erro);

};

versao.setaVersao = function(tx) {
  tx.executeSql('UPDATE SISTEMA SET VERSAO = ?, DTATUALIZACAO = date(\'now\')', [versao.versao], function(tx, rs) {}, function(tx, err) { console.log(err);});
};

versao.erro = function(tx, err) {
  console.log(err);
};

versao.addCampo = function(tx, tabela, colunas, colunasFW) {
  debugger;
  tx.executeSql('ALTER TABLE '+tabela+' ADD COLUMN '+colunas, [], function(tx, rs) {}, versao.erro);

  tx.executeSql('SELECT COLUNAS.COLUNAS FROM COLUNAS WHERE COLUNAS.TABELA = ?' , [tabela], function(tx, rs) {
    var i = 0, l = rs.rows.length;

    var cols = [],
        tmp = colunasFW.split(',');

    for(; i < l; i++) {
      cols = JSON.parse(rs.rows.item(i).COLUNAS);
    }


    var i = 0, l = tmp.length;

    for (; i < l; i++) {
      var t = tmp[i].trim().split(' ', 3);
      cols.push({
        NOME: t[0],
        TP: t[1],
        CHAVE: "N",
        LABEL: t[2]
      });
    }

    tx.executeSql('UPDATE COLUNAS SET COLUNAS = ? WHERE COLUNAS.TABELA = ?', [JSON.stringify(cols), tabela], function(tx, rs){}, versao.erro);
  });
};  