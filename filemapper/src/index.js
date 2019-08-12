import React from "react";
import ReactDOM from "react-dom";
import DynamicsFileList from "./d365files";

class DynamicsMapper extends React.Component {
    componentDidMount(){
        //receive messages from vs code extension that is doing the d365 web requests here
        window.addEventListener('message', (e)=>{
            console.log(e.data);
            this.setState(e.data);
        });
    }
    render() {
        if(this.state && this.state.resources){
            console.log(this.state.resources);
            return <div>
                <div className="container">
                    <DynamicsFileList resources={this.state.resources} />
                </div>
            </div>
        }
        else{
            return <div></div>
        }
    }
}

let App = document.getElementById("app");

ReactDOM.render(<DynamicsMapper />, App);