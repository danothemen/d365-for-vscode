const AuthenticationContext = require("adal-node").AuthenticationContext;
const axios = require("axios");
let pas;
module.exports = class D365{    
    constructor(clientId,resource,username,password,authUrl){
        this.AuthorityUrl = authUrl;
        this.ClientId = clientId;
        this.Resource = resource;
        this.Username = username;
        pas = password;
        this.AuthContext = new AuthenticationContext(this.AuthorityUrl);
    }
    //use adalnode to handle oauth authentication and get bearer/refresh tokens
    async GetToken(){
        let tokenP = new Promise((res,rej)=>{
            this.AuthContext.acquireTokenWithUsernamePassword(this.Resource,this.Username,pas,this.ClientId,(err,newToken) => {
                if(err){
                    rej(err);
                }
                else{
                    this.Token = newToken;
                    res(newToken);
                }
            });
        });
        return tokenP;
    }

    async Refresh(){
        let tokenP = new Promise((res,rej)=>{
            this.AuthContext.acquireTokenWithRefreshToken(this.Token.refreshToken,this.ClientId,this.Resource,(err,newToken) => {
                if(err){
                    rej(err);
                }
                else{
                    this.Token = newToken;
                    res(newToken);
                }
            });
        });
        return tokenP;
    }
    //verify login successful
    async GetUsername(){
        var headers = {
            Authorization: "Bearer " + this.Token.accessToken,
            "Content-Type": "application/json"
          };
        let me = await axios.get(this.Resource + "/api/data/v9.1/WhoAmI()",{headers:headers});
        let myuser = await axios.get(this.Resource + `/api/data/v9.1/systemusers(${me.data.UserId})?$select=fullname`,{headers:headers});
        return myuser.data.fullname;
    }
    //get webresources to display
    async GetWebresources(){
        var headers = {
            Authorization: "Bearer " + this.Token.accessToken,
            "Content-Type": "application/json"
          };
        let resources = await axios.get(this.Resource + "/api/data/v9.1/webresourceset?$select=name,displayname,webresourcetype",{headers:headers});
        return resources.data.value;
    }
}