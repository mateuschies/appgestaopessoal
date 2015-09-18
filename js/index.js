var classeJS;

window.onerror = function(a,b,c) {
	alert(a + '- '+ b + '-' + c);
}

var WebApp = {
	init: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
		document.querySelector('#imgMenu').addEventListener('click', WebApp.menu);
		document.querySelector('#imgHome').addEventListener('click', WebApp.home);		
		document.querySelector('#imgConfig').addEventListener('click', WebApp.config);
		document.querySelector('#imgSair').addEventListener('click', WebApp.sair);
		this.navegar('principal.html',{});
	},

	navegar: function(pagina, parametros, veioPop){
		var xmlhttp = new XMLHttpRequest();	

		xmlhttp.onreadystatechange = function (){
			document.querySelector('#main').innerHTML = xmlhttp.responseText;
			parseScript(xmlhttp.responseText);
			/* TODO: Método de inicializar*/
			if (classeJS)
				classeJS.Init(document.querySelector('#main'));
			classeJS = null;
			/* TODO: History aqui */
			if (!veioPop){
				/*parametros.pg = pagina;
				history.pushState(parametros,pagina,pagina);*/
			}
		}

		window.onpopstate = function(event){
			try{
				WebApp.navegar(event.state.pg,event.state,true);
			}catch(e){
			}
		}

		xmlhttp.open("GET",'telas/'+pagina);
		xmlhttp.send();
	},

	menu: function() {
		WebApp.navegar('menu.html',{});	
	},

	home: function() {
		WebApp.navegar('principal.html',{});	
	},
	
	voltar: function() {
        history.back();
    },

	config: function() {
		WebApp.navegar('config.html',{});	
	},

	sair: function() {
		navigator.app.exitApp();
	},

	onDeviceReady: function() {
		onDeviceReady();
	}
};

WebApp.init();