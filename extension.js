// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require("fs");
const path = require("path");
const D365 = require("./d365");

let authurl = null;
let adalResource = null;
let clientId = null;
let username = null;
let password = null;
let d365Auth = null;
let panel = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function documentSaved(e){
	console.log(e.path);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "d365-for-vscode" is now active');

	authurl = context.workspaceState.get("d365authurl");
	adalResource = context.workspaceState.get("d365resource");
	clientId = context.workspaceState.get("d365clientid");
	username = context.workspaceState.get("d365username");
	password = null;

	// Get path to resource on disk
	const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath, 'filemapper','dist', 'index.js')
	  );
	  
	  const onDiskPathCss = vscode.Uri.file(
        path.join(context.extensionPath, 'filemapper','dist', 'app.css')
      );

      // And get the special URI to use with the webview
	const bundle = onDiskPath.with({ scheme: 'vscode-resource' });
	const css = onDiskPathCss.with({ scheme: 'vscode-resource' });
	//html for react app in filemapper directory
	const mapperhtml = `<!DOCTYPE html>
	<html>
	<head>
		<title>Dynamics 365 File Mapping</title>
		<link rel="stylesheet" href="${css}">
	</head>
	<body>
	<div id="app"></div>
	<script src="${bundle}"></script>
	</body>
	</html>`;

	vscode.workspace.findFiles("*.d365filemap").then(urls => {
		if(urls.length == 1){
			let fw = vscode.workspace.createFileSystemWatcher('**/*');
			fw.onDidChange(documentSaved);
		}
		else if(urls.length > 1){
			vscode.window.showInformationMessage('Found more than file matching the pattern *.d365filemap . Files will not be saved to Dynamics.');
		}
	});


	var walkSync = function(dir, filelist) {
		var path = path || require('path');
		var fs = fs || require('fs'),
			files = fs.readdirSync(dir);
		filelist = filelist || [];
		files.forEach(function(file) {
		  if (fs.statSync(path.join(dir, file)).isDirectory()) {
			filelist = walkSync(path.join(dir, file), filelist);
		  }
		  else {
			filelist.push(file);
		  }
		});
		return filelist;
	  };

	

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.d365signin', async function () {
		// The code you place here will be executed every time your command is executed
		d365Auth = new D365(clientId,adalResource,username,password,authurl);
		try{
			await d365Auth.GetToken();
			let usersname = await d365Auth.GetUsername();
			vscode.window.showInformationMessage(`${usersname} Successfully Logged In`);
		}
		catch(e){
			vscode.window.showErrorMessage(e);
		}
	});

	let disposableMapper = vscode.commands.registerCommand('extension.d365map', async function () {
		const panel = vscode.window.createWebviewPanel(
			'filemapping',
			'D365 File Map',
			vscode.ViewColumn.One,
			{enableScripts: true}
		  );
		  panel.webview.html = mapperhtml;
		  //set up state to pass to panel
		  let resources = await d365Auth.GetWebresources();
		  let map = JSON.parse(fs.readFileSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath,".d365filemap"),'utf8'));
		  let dirstructure = walkSync(vscode.workspace.workspaceFolders[0].uri.fsPath);
		  let basedir = vscode.workspace.workspaceFolders[0].uri.fsPath;
		  console.log({resources:resources,map:map,dirstructure:dirstructure,basedir:basedir});
		  panel.webview.postMessage({resources:resources,map:map,dirstructure:dirstructure,basedir:basedir});
		  panel.webview.onDidReceiveMessage((e)=>{
			console.log(e);
		  });
		  panel.onDidDispose((e)=>{
			  //set panel to null on dispose to avoid message passing errors
			  panel = null;
		  });
	});

	//set base values for future logins with the set up command
	let setupdisposable = vscode.commands.registerCommand('extension.d365setup', async function () {
		authurl = context.workspaceState.get("d365authurl");
		adalResource = context.workspaceState.get("d365resource");
		clientId = context.workspaceState.get("d365clientid");
		username = context.workspaceState.get("d365username");

		// The code you place here will be executed every time your command is executed
		if(vscode.workspace.workspaceFolders != undefined && !fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath,".d365filemap"))){
			fs.writeFileSync(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath,".d365filemap"),"{}");
		}
		
		//prompt for authority url and autofill if we can
		var authurlPrompt = {prompt:"Authority URL e.g. https://login.microsoftonline.com/<tenantid>/oauth2/token"};
		if(authurl){
			authurlPrompt.value = authurl;
		}
		authurl = await vscode.window.showInputBox(authurlPrompt);

		//prompt for clientid and autofill if we can
		var clientIdPrompt = {prompt:"D365 App Id"};
		if(clientId){
			clientIdPrompt.value = clientId;
		}
		clientId = await vscode.window.showInputBox(clientIdPrompt);
		//prompt for resource and autofill if we can
		var resourcePrompt = {prompt:"Resource e.g. https://myinstance.crm.dynamics.com"};
		if(adalResource){
			resourcePrompt.value = adalResource;
		}
		adalResource = await vscode.window.showInputBox(resourcePrompt);
		//prompt for username and autofill if we can
		var usernamePrompt = {prompt:"Username"};
		if(username){
			usernamePrompt.value = username;
		}
		username = await vscode.window.showInputBox(usernamePrompt);
		//get password, DO NOT STORE ON DISK
		var passwordPrompt = {prompt:"Password"};
		passwordPrompt.password = true;
		password = await vscode.window.showInputBox(passwordPrompt);

		//store all the auth data that is safe to do so
		context.workspaceState.update("d365authurl",authurl);
		context.workspaceState.update("d365resource",adalResource);
		context.workspaceState.update("d365clientid",clientId);
		context.workspaceState.update("d365username",username);

		//auth user and greet.
		d365Auth = new D365(clientId,adalResource,username,password,authurl);
		try{
			await d365Auth.GetToken();
			let usersname = await d365Auth.GetUsername();
			vscode.window.showInformationMessage(`${usersname} Successfully Logged In`);
		}
		catch(e){
			vscode.window.showErrorMessage(e);
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(setupdisposable);
	context.subscriptions.push(disposableMapper);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}



module.exports = {
	activate,
	deactivate
}
