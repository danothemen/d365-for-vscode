const fs = require("fs");
const path = require("path");
var distdir = fs.readdirSync('dist');
//cleanup resources in dist directory so that changing code in the extension.js
for(var i =0; i < distdir.length; i++){
    console.log(distdir[i]);
    if(distdir[i].endsWith(".map")||distdir[i].endsWith(".html")){
        fs.unlinkSync(path.join("dist",distdir[i]));
    }
    else if(distdir[i].endsWith(".js")){
        fs.renameSync(path.join("dist",distdir[i]),path.join("dist","index.js"))
    }
    else if(distdir[i].endsWith(".css")){
        fs.renameSync(path.join("dist",distdir[i]),path.join("dist","app.css"))
    }
}